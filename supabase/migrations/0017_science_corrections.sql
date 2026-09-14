begin;
insert into science_config(key,value) values('correction_epoch','0');
create table science_correction_proposals(
  id uuid primary key default gen_random_uuid(),source_revision uuid not null references science_items(id),
  replacement_revision uuid not null unique references science_items(id),
  mode text not null check(mode in ('exclude','explanation')),
  reason text not null check(length(reason) between 5 and 2000),
  created_by uuid references auth.users(id),approved_by uuid references auth.users(id),
  state text not null default 'pending' check(state in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),approved_at timestamptz,
  check(source_revision<>replacement_revision),check(approved_by is null or approved_by is distinct from created_by)
);
create unique index science_one_correction on science_correction_proposals(source_revision) where state='approved';
create table science_result_revisions(
  attempt_id uuid not null references science_attempts(id),revision int not null,
  result jsonb not null,created_at timestamptz not null default now(),primary key(attempt_id,revision)
);
alter table science_correction_proposals enable row level security;
alter table science_result_revisions enable row level security;
revoke all on science_correction_proposals,science_result_revisions from public,anon,authenticated;
grant all on science_correction_proposals,science_result_revisions to service_role;

create view science_revision_updates with(security_invoker=true) as
  with recursive chain as (
    select source_revision, replacement_revision, mode='exclude' excluded,reason,approved_at,1 depth
    from science_correction_proposals where state='approved'
    union all
    select c.source_revision,p.replacement_revision,c.excluded or p.mode='exclude',c.reason||E'\n'||p.reason,p.approved_at,c.depth+1
    from chain c join science_correction_proposals p on p.source_revision=c.replacement_revision and p.state='approved'
  )
  select distinct on(source_revision) c.source_revision,c.replacement_revision,c.excluded,c.reason,c.approved_at,i.content,i.credit_name
  from chain c join science_items i on i.id=c.replacement_revision order by source_revision,depth desc;
revoke all on science_revision_updates from public,anon,authenticated;
grant select on science_revision_updates to service_role;

create function science_correction_epoch() returns int language sql stable set search_path=public as $$
  select value::text::int from science_config where key='correction_epoch';
$$;

create function science_propose_correction(p_source uuid,p_admin uuid,p_content jsonb,p_mode text,p_reason text)
returns uuid language plpgsql set search_path=public as $$
declare q science_items; replacement uuid; proposal uuid;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  select * into q from science_items where id=p_source for update;
  if not found or q.status not in ('published','lab','held') then raise exception 'not_found'; end if;
  if p_mode not in ('exclude','explanation') or length(trim(p_reason))<5 or not science_valid_content(p_content) then raise exception 'invalid_correction'; end if;
  if p_mode='explanation' and (p_content->'question'<>q.content->'question' or p_content->'choices'<>q.content->'choices' or p_content->'correctIndex'<>q.content->'correctIndex') then raise exception 'scoring_change_requires_exclusion'; end if;
  perform pg_advisory_xact_lock(hashtextextended('family:'||q.family_id,0));
  insert into science_items(family_id,version,legacy_id,author_id,domain,subdomain,content,status,license_version,credit_name,ai_assisted)
    select q.family_id,coalesce(max(version),0)+1,q.legacy_id,q.author_id,q.domain,q.subdomain,p_content,'draft',q.license_version,q.credit_name,q.ai_assisted from science_items where family_id=q.family_id returning id into replacement;
  insert into science_correction_proposals(source_revision,replacement_revision,mode,reason,created_by) values(p_source,replacement,p_mode,p_reason,p_admin) returning id into proposal;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'correction_proposed',p_source::text,p_reason,jsonb_build_object('proposal',proposal));
  return proposal;
end $$;

create function science_approve_correction(p_id uuid,p_admin uuid,p_checks jsonb)
returns int language plpgsql set search_path=public as $$
declare p science_correction_proposals;q science_items;epoch int;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  select * into p from science_correction_proposals where id=p_id for update;
  if not found or p.state<>'pending' then raise exception 'not_pending'; end if;
  if p.created_by=p_admin then raise exception 'independent_review_required'; end if;
  if not coalesce((p_checks->>'rights')::boolean,false) or not coalesce((p_checks->>'source')::boolean,false) or not coalesce((p_checks->>'uniqueAnswer')::boolean,false) or not coalesce((p_checks->>'explanation')::boolean,false) then raise exception 'review_required'; end if;
  -- Lock the epoch against final answer/result commits before changing effective records.
  perform 1 from science_config where key='correction_epoch' for update;
  select * into q from science_items where id=p.source_revision for update;
  if q.author_id=p_admin then raise exception 'independent_review_required'; end if;
  update science_correction_proposals set state='approved',approved_by=p_admin,approved_at=now() where id=p.id;
  update science_items set status=case when q.status='lab' then 'lab' else 'published' end,quality_passed=true,rights_checked=true,
    review_evidence=jsonb_build_object('proposal',p.id,'reviewer',p_admin,'checks',p_checks) where id=p.replacement_revision;
  update science_items set status='held' where id=p.source_revision;
  update science_config set value=to_jsonb(value::text::int+1),updated_at=now() where key='correction_epoch' returning value::text::int into epoch;
  update science_attempts a set needs_recalculation=true where a.state='completed' and exists(
    select 1 from science_issued i join science_revision_updates c on c.source_revision=i.revision_id where i.attempt_id=a.id);
  delete from science_current_estimates where user_id in (select distinct user_id from science_attempts where needs_recalculation);
  update science_review_marks set streak=0,due_at=now() where revision_id in (select source_revision from science_revision_updates);
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'correction_approved',p.source_revision::text,p.reason,jsonb_build_object('proposal',p.id,'epoch',epoch));
  return epoch;
end $$;

create function science_result_history() returns trigger language plpgsql set search_path=public as $$
begin
  if new.result is not null and (tg_op='INSERT' or old.result is distinct from new.result) then
    new.result_revision:=case when tg_op='INSERT' or old.result is null then 1 else old.result_revision+1 end;
    insert into science_result_revisions(attempt_id,revision,result) values(new.id,new.result_revision,new.result);
  end if;
  return new;
end $$;
-- AFTER inserts are necessary because a new result references its parent attempt.
create function science_initial_result_history() returns trigger language plpgsql set search_path=public as $$
begin
  if new.result is not null then insert into science_result_revisions(attempt_id,revision,result) values(new.id,new.result_revision,new.result); end if;
  return new;
end $$;
create trigger science_result_update_history before update of result on science_attempts for each row execute function science_result_history();
create trigger science_result_insert_history after insert on science_attempts for each row execute function science_initial_result_history();

create function science_store_corrected_result(p_attempt uuid,p_result jsonb,p_previous int,p_epoch int)
returns boolean language plpgsql set search_path=public as $$
declare a science_attempts;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  if p_epoch<>science_correction_epoch() then return false; end if;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or a.state<>'completed' or not a.needs_recalculation or a.result_revision<>p_previous then return false; end if;
  if (p_result->>'originalAnswerCount')::int<>a.total or (p_result->>'correctionEpoch')::int<>p_epoch or p_result->>'version'<>a.model_version then raise exception 'invalid_result'; end if;
  update science_attempts set result=p_result,needs_recalculation=false where id=a.id;
  if a.user_id is not null then
    insert into science_outbox(dedupe_key,user_id,kind,payload) values('correction:'||a.id||':'||p_epoch,a.user_id,'result_correction',jsonb_build_object('attemptId',a.id,'label',a.definition->>'label')) on conflict do nothing;
  end if;
  return true;
end $$;

create or replace view science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,
    i.eligible and not coalesce(c.excluded,false) eligible,case when c.excluded then 'question_withdrawn' else i.exclusion_reason end exclusion_reason,
    i.snapshot->>'domain' domain,i.snapshot->>'subdomain' subdomain,
    (i.snapshot->>'a')::double precision a,(i.snapshot->>'b')::double precision b,(i.snapshot->>'c')::double precision c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
  left join science_revision_updates c on c.source_revision=i.revision_id;

alter table science_current_estimates add column correction_epoch int not null default 0;
drop function science_store_current(uuid,jsonb,timestamptz);
create function science_store_current(p_user uuid,p_result jsonb,p_through timestamptz,p_epoch int default 0)
returns boolean language plpgsql set search_path=public as $$
begin
  perform 1 from science_config where key='correction_epoch' for share;
  if p_epoch<>science_correction_epoch() then return false; end if;
  insert into science_current_estimates(user_id,version,result,through_at,correction_epoch) values(p_user,p_result->>'version',p_result,p_through,p_epoch)
    on conflict(user_id) do update set version=excluded.version,result=excluded.result,through_at=excluded.through_at,correction_epoch=excluded.correction_epoch,updated_at=now()
    where science_current_estimates.correction_epoch<excluded.correction_epoch or (science_current_estimates.correction_epoch=excluded.correction_epoch and coalesce(science_current_estimates.through_at,'-infinity'::timestamptz)<=coalesce(excluded.through_at,'-infinity'::timestamptz));
  return true;
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('science_correction_epoch','science_propose_correction','science_approve_correction','science_result_history','science_initial_result_history','science_store_corrected_result','science_store_current') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
