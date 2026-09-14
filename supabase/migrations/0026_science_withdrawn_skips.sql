begin;

-- A withdrawn item can advance progress without inventing a choice or an error.
alter table science_answers alter column selected_index drop not null;
alter table science_answers alter column is_correct drop not null;
alter table science_answers add column skip_reason text;
alter table science_answers add constraint science_answer_or_withdrawn_skip check((
  (skip_reason is null and selected_index is not null and is_correct is not null)
  or (skip_reason='question_withdrawn' and selected_index is null and is_correct is null)
) is true);

create or replace function science_commit_answer(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_token uuid,p_operation uuid,p_selected int,p_result jsonb default null)
returns science_attempts language plpgsql set search_path=public as $$
declare a science_attempts; issued science_issued; previous science_answers; q science_items; correct boolean; withdrawn boolean;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into previous from science_answers where attempt_id=p_attempt and operation_id=p_operation;
  if found then
    if previous.ordinal is distinct from p_ordinal or previous.selected_index is distinct from p_selected then raise exception 'operation_reused' using errcode='40001'; end if;
    return a;
  end if;
  if a.state<>'active' or a.ordinal is distinct from p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if p_selected is not null and p_selected not between 0 and 3 then raise exception 'invalid_choice'; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal and token=p_token;
  if not found then raise exception 'not_issued' using errcode='P0002'; end if;
  select * into q from science_items where id=issued.revision_id for share;
  select exists(select 1 from science_revision_updates where source_revision=q.id and excluded) into withdrawn;
  if q.status='held' and not exists(select 1 from science_revision_updates where source_revision=q.id) then raise exception 'item_unavailable'; end if;
  if p_selected is null and not withdrawn then raise exception 'item_not_withdrawn'; end if;
  correct := case when p_selected is null then null else (issued.choice_order->>p_selected)::int=(issued.snapshot->'content'->>'correctIndex')::int end;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  if p_ordinal+1=a.total and (p_result is null or coalesce((p_result->>'originalAnswerCount')::int,(p_result->>'answerCount')::int) is distinct from a.total or p_result->>'version' is distinct from a.model_version) then raise exception 'result_required'; end if;
  if p_ordinal+1=a.total and (p_result->>'correctionEpoch')::int is distinct from science_correction_epoch() then raise exception 'result_recalculation_required' using errcode='40001'; end if;
  insert into science_answers(attempt_id,ordinal,operation_id,selected_index,is_correct,skip_reason)
    values(p_attempt,p_ordinal,p_operation,p_selected,correct,case when p_selected is null then 'question_withdrawn' else null end);
  update science_attempts set ordinal=p_ordinal+1,
    state=case when p_ordinal+1=total then 'completed' else 'active' end,
    completed_at=case when p_ordinal+1=total then now() else null end,
    result=case when p_ordinal+1=total then p_result else null end where id=p_attempt returning * into a;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id,payload)
    values('answer:'||p_attempt||':'||p_ordinal,case when p_selected is null then 'question_skipped' else 'answer_committed' end,a.visitor_id,a.user_id,a.id,jsonb_build_object('ordinal',p_ordinal)) on conflict do nothing;
  if a.state='completed' then
    insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id) values('completed:'||a.id,'attempt_completed',a.visitor_id,a.user_id,a.id) on conflict do nothing;
    insert into science_outbox(dedupe_key,user_id,kind,payload) values('completion:'||a.id,a.user_id,'attempt_completed',jsonb_build_object('attemptId',a.id)) on conflict do nothing;
  end if;
  return a;
end $$;
drop function science_commit_answer_before_hold_guard(uuid,uuid,uuid,int,uuid,uuid,int,jsonb);

create or replace function science_issue(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_revision uuid,p_order jsonb,
  p_predicted double precision,p_probability double precision,p_reason text,p_candidates int)
returns science_issued language plpgsql set search_path=public as $$
declare a science_attempts; q science_items; issued science_issued; params science_release_items; known boolean; eligible boolean; withdrawn boolean;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal;
  if found then return issued; end if;
  if a.state<>'active' or a.ordinal is distinct from p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  select * into q from science_items where id=p_revision for share;
  if not found then raise exception 'item_unavailable'; end if;
  withdrawn := a.kind='weekly' and exists(select 1 from science_revision_updates where source_revision=q.id and excluded);
  -- Only an approved withdrawal can yield a placeholder, even after rights/expiry change.
  -- The application hides its original content and requires a NULL choice to skip it.
  if not withdrawn and (not q.rights_checked or (q.status not in ('published','lab') and not (a.kind='weekly' and exists(select 1 from science_revision_updates where source_revision=q.id))) or (q.expires_at is not null and q.expires_at<=now())) then raise exception 'item_unavailable'; end if;
  if a.kind not in ('lab','weekly') and (q.status<>'published' or not q.quality_passed) then raise exception 'item_unavailable'; end if;
  if a.kind='lab' and q.author_id is null then raise exception 'not_a_submission'; end if;
  if a.kind='weekly' then
    if not exists(select 1 from science_weekly_sets w where w.id=a.week_id and w.revision_ids[p_ordinal+1]=p_revision) then raise exception 'wrong_weekly_item'; end if;
  else
    select * into params from science_release_items where release_id=a.release_id and revision_id=p_revision;
    if a.kind<>'lab' and not found then raise exception 'item_not_in_release'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_user::text,p_visitor::text),0));
  select exists(select 1 from science_exposures e where e.family_id=q.family_id and (e.visitor_id=p_visitor or (p_user is not null and e.user_id=p_user))) or (p_user is not null and q.author_id is not null and q.author_id=p_user) into known;
  if known and a.kind in ('trial','full','domain') then raise exception 'already_seen' using errcode='40001'; end if;
  eligible := a.kind in ('trial','full','domain') and not known;
  if a.kind='weekly' and known then update science_attempts set competitive=false where id=a.id; end if;
  insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible,exclusion_reason)
  values(p_attempt,p_ordinal,q.id,q.family_id,p_order,jsonb_build_object('content',q.content,'domain',q.domain,'subdomain',q.subdomain,'a',coalesce(params.a,1),'b',coalesce(params.b,0),'c',coalesce(params.c,.25),'authorId',q.author_id,'creditName',q.credit_name,'aiAssisted',q.ai_assisted),p_predicted,p_probability,p_reason,p_candidates,eligible,
    case when withdrawn then 'question_withdrawn' when known then 'previously_seen_or_author' when not eligible then a.kind else null end) returning * into issued;
  insert into science_exposures(visitor_id,family_id,user_id,first_attempt_id,reason) values(p_visitor,q.family_id,p_user,p_attempt,a.kind) on conflict(visitor_id,family_id) do nothing;
  return issued;
end $$;

create or replace view science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,
    i.eligible and r.skip_reason is null and not coalesce(c.excluded,false) and x.attempt_id is null eligible,
    case when r.skip_reason is not null then r.skip_reason when c.excluded then 'question_withdrawn' when x.attempt_id is not null then x.reason else i.exclusion_reason end exclusion_reason,
    i.snapshot->>'domain' domain,i.snapshot->>'subdomain' subdomain,
    (i.snapshot->>'a')::double precision a,(i.snapshot->>'b')::double precision b,(i.snapshot->>'c')::double precision c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
  left join science_revision_updates c on c.source_revision=i.revision_id
  left join science_response_exclusions x on x.attempt_id=i.attempt_id and x.ordinal=i.ordinal;

create or replace function science_review_collection(p_user uuid,p_mode text,p_page int)
returns table(revision_id uuid,attempt_id uuid,ordinal int,domain text,content jsonb,is_correct boolean,selected_index int,bookmarked boolean,total bigint)
language sql stable set search_path=public as $$
  with available as (
    select distinct on(i.family_id) i.revision_id,i.attempt_id,i.ordinal,i.snapshot->>'domain' domain,i.snapshot->'content' content,r.is_correct,(i.choice_order->>r.selected_index)::int selected_index,
      (b.user_id is not null) bookmarked,r.answered_at,m.due_at
    from science_issued i join science_answers r using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
    left join science_bookmarks b on b.revision_id=i.revision_id and b.user_id=p_user
    left join science_review_marks m on m.revision_id=i.revision_id and m.user_id=p_user
    where a.user_id=p_user and r.skip_reason is null and (a.state='completed' or a.kind='lab')
    order by i.family_id,r.answered_at desc,i.attempt_id
  ),filtered as (
    select * from available where (p_mode='bookmarks' and bookmarked) or (p_mode='mistakes' and not is_correct and (due_at is null or due_at<=now()))
  )
  select revision_id,attempt_id,ordinal,domain,content,is_correct,selected_index,bookmarked,count(*) over() from filtered order by coalesce(due_at,answered_at),revision_id limit 5 offset greatest(0,least(p_page,10000))*5;
$$;
create or replace function science_mark_review(p_user uuid,p_revision uuid,p_remembered boolean,p_operation uuid)
returns boolean language plpgsql set search_path=public as $$
declare n int; previous science_review_marks;
begin
  if not exists(select 1 from science_issued i join science_answers r using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id where a.user_id=p_user and i.revision_id=p_revision and r.skip_reason is null and (a.state='completed' or a.kind='lab')) then raise exception 'not_found' using errcode='P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user||':'||p_revision,0));
  select * into previous from science_review_marks where user_id=p_user and revision_id=p_revision for update;
  if previous.operation_id=p_operation then return true; end if;
  n:=case when p_remembered then least(5,coalesce(previous.streak,0)+1) else 0 end;
  insert into science_review_marks(user_id,revision_id,streak,reviewed_at,due_at,operation_id)
    values(p_user,p_revision,n,now(),now()+make_interval(days=>(array[1,3,7,14,30,60])[n+1]),p_operation)
    on conflict(user_id,revision_id) do update set streak=excluded.streak,reviewed_at=excluded.reviewed_at,due_at=excluded.due_at,operation_id=excluded.operation_id;
  return true;
end $$;
revoke all on function science_commit_answer(uuid,uuid,uuid,int,uuid,uuid,int,jsonb),science_issue(uuid,uuid,uuid,int,uuid,jsonb,double precision,double precision,text,int),science_review_collection(uuid,text,int),science_mark_review(uuid,uuid,boolean,uuid) from public,anon,authenticated;
grant execute on function science_commit_answer(uuid,uuid,uuid,int,uuid,uuid,int,jsonb),science_issue(uuid,uuid,uuid,int,uuid,jsonb,double precision,double precision,text,int),science_review_collection(uuid,text,int),science_mark_review(uuid,uuid,boolean,uuid) to service_role;
commit;
