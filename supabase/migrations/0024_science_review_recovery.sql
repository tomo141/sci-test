begin;

-- Anonymous visitors are not the author. SQL NULL must not become a NULL eligibility.
create or replace function public.science_issue(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_revision uuid,p_order jsonb,
  p_predicted double precision,p_probability double precision,p_reason text,p_candidates int)
returns public.science_issued language plpgsql set search_path=public as $$
declare a science_attempts; q science_items; issued science_issued; params science_release_items; known boolean; eligible boolean;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal;
  if found then return issued; end if;
  if a.state<>'active' or a.ordinal<>p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  select * into q from science_items where id=p_revision for share;
  if not found or not q.rights_checked or (q.status not in ('published','lab') and not (a.kind='weekly' and exists(select 1 from science_revision_updates where source_revision=q.id))) or (q.expires_at is not null and q.expires_at<=now()) then raise exception 'item_unavailable'; end if;
  if a.kind not in ('lab','weekly') and (q.status<>'published' or not q.quality_passed) then raise exception 'item_unavailable'; end if;
  if a.kind='lab' and q.author_id is null then raise exception 'not_a_submission'; end if;
  if a.kind='weekly' then
    if not exists(select 1 from science_weekly_sets w where w.id=a.week_id and w.revision_ids[p_ordinal+1]=p_revision) then raise exception 'wrong_weekly_item'; end if;
  else
    select * into params from science_release_items where release_id=a.release_id and revision_id=p_revision;
    if a.kind<>'lab' and not found then raise exception 'item_not_in_release'; end if;
  end if;
  -- Serialize novelty checks across registered devices as well as anonymous tabs.
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_user::text,p_visitor::text),0));
  select exists(select 1 from science_exposures e where e.family_id=q.family_id and (e.visitor_id=p_visitor or (p_user is not null and e.user_id=p_user))) or (p_user is not null and q.author_id is not null and q.author_id=p_user) into known;
  if known and a.kind in ('trial','full','domain') then raise exception 'already_seen' using errcode='40001'; end if;
  eligible := a.kind in ('trial','full','domain') and not known;
  if a.kind='weekly' and known then update science_attempts set competitive=false where id=a.id; end if;
  insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible,exclusion_reason)
  values(p_attempt,p_ordinal,q.id,q.family_id,p_order,jsonb_build_object('content',q.content,'domain',q.domain,'subdomain',q.subdomain,'a',coalesce(params.a,1),'b',coalesce(params.b,0),'c',coalesce(params.c,.25),'authorId',q.author_id,'creditName',q.credit_name,'aiAssisted',q.ai_assisted),p_predicted,p_probability,p_reason,p_candidates,eligible,
    case when known then 'previously_seen_or_author' when not eligible then a.kind else null end) returning * into issued;
  insert into science_exposures(visitor_id,family_id,user_id,first_attempt_id,reason) values(p_visitor,q.family_id,p_user,p_attempt,a.kind) on conflict(visitor_id,family_id) do nothing;
  return issued;
end $$;

alter table science_items add column held_from_status text check(held_from_status in ('published','lab'));
alter table science_items add column held_at timestamptz;
create function science_remember_hold() returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='held' and old.status<>'held' then
    new.held_from_status:=case when old.status in ('published','lab') then old.status else null end;
    new.held_at:=now();
  elsif new.status<>'held' then
    new.held_from_status:=null;new.held_at:=null;
  end if;
  return new;
end $$;
create trigger science_item_hold_history before update of status on science_items for each row execute function science_remember_hold();

alter table science_correction_proposals add column rejected_by uuid references auth.users(id) on delete set null;
alter table science_correction_proposals add column rejected_at timestamptz;
alter table science_correction_proposals add column rejection_reason text;
create unique index science_one_pending_correction on science_correction_proposals(source_revision) where state='pending';

create function science_reject_correction(p_id uuid,p_admin uuid,p_reason text)
returns boolean language plpgsql set search_path=public as $$
declare p science_correction_proposals;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  if p_reason is null or length(trim(p_reason)) not between 5 and 2000 then raise exception 'reason_required'; end if;
  select * into p from science_correction_proposals where id=p_id for update;
  if not found or p.state<>'pending' then raise exception 'not_pending'; end if;
  update science_correction_proposals set state='rejected',rejected_by=p_admin,rejected_at=now(),rejection_reason=trim(p_reason) where id=p.id;
  update science_items set status='retired' where id=p.replacement_revision and status='draft';
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,
    case when p.created_by=p_admin then 'correction_withdrawn' else 'correction_rejected' end,
    p.source_revision::text,trim(p_reason),jsonb_build_object('proposal',p.id,'replacement',p.replacement_revision));
  return true;
end $$;

create function science_revise_correction(p_id uuid,p_admin uuid,p_content jsonb,p_mode text,p_reason text)
returns uuid language plpgsql set search_path=public as $$
declare source uuid;new_id uuid;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  select source_revision into source from science_correction_proposals where id=p_id and state='pending' for update;
  if not found then raise exception 'not_pending'; end if;
  perform science_reject_correction(p_id,p_admin,p_reason);
  new_id:=science_propose_correction(source,p_admin,p_content,p_mode,p_reason);
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'correction_revised',source::text,p_reason,jsonb_build_object('previousProposal',p_id,'proposal',new_id));
  return new_id;
end $$;

create view science_unresolved_holds with(security_invoker=true) as
  select q.id,q.family_id,q.domain,q.subdomain,q.content,q.author_id,q.held_from_status,q.held_at,
    exists(select 1 from science_correction_proposals p where p.source_revision=q.id and p.state='pending') pending_correction
  from science_items q where q.status='held'
    and not exists(select 1 from science_correction_proposals p where p.source_revision=q.id and p.state='approved');
revoke all on science_unresolved_holds from public,anon,authenticated;
grant select on science_unresolved_holds to service_role;

create function science_reopen_held_item(p_revision uuid,p_admin uuid,p_reason text,p_checks jsonb)
returns text language plpgsql set search_path=public as $$
declare q science_items;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  if p_reason is null or length(trim(p_reason)) not between 5 and 2000 then raise exception 'reason_required'; end if;
  if p_checks is null or not coalesce((p_checks->>'rights')::boolean,false) or not coalesce((p_checks->>'source')::boolean,false)
    or not coalesce((p_checks->>'uniqueAnswer')::boolean,false) or not coalesce((p_checks->>'explanation')::boolean,false) then raise exception 'review_required'; end if;
  -- Use the same lock order as issuance and answer commitment.
  perform 1 from science_config where key='correction_epoch' for share;
  select * into q from science_items where id=p_revision for update;
  if not found or q.status<>'held' then raise exception 'not_held'; end if;
  if q.author_id=p_admin then raise exception 'independent_review_required'; end if;
  if exists(select 1 from science_correction_proposals where source_revision=q.id and state='approved') then raise exception 'corrected_revision_cannot_reopen'; end if;
  if exists(select 1 from science_correction_proposals where source_revision=q.id and state='pending') then raise exception 'pending_correction'; end if;
  if q.held_from_status is null then raise exception 'previous_publication_state_unknown'; end if;
  if not q.rights_checked or (q.held_from_status='published' and not q.quality_passed) or q.expires_at<=now() then raise exception 'item_not_approved'; end if;
  update science_items set status=q.held_from_status where id=q.id;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'item_hold_released',q.id::text,trim(p_reason),jsonb_build_object('restoredStatus',q.held_from_status,'heldAt',q.held_at,'checks',p_checks));
  return q.held_from_status;
end $$;

-- A cached browser must not commit a newly held item. Previously committed operations
-- still return their acknowledgement, even if a reviewer held the item in the meantime.
alter function science_commit_answer(uuid,uuid,uuid,int,uuid,uuid,int,jsonb) rename to science_commit_answer_before_hold_guard;
create function science_commit_answer(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_token uuid,p_operation uuid,p_selected int,p_result jsonb default null)
returns science_attempts language plpgsql set search_path=public as $$
declare q science_items;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  perform 1 from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  if not exists(select 1 from science_answers where attempt_id=p_attempt and operation_id=p_operation) then
    select i.* into q from science_items i join science_issued s on s.revision_id=i.id
      where s.attempt_id=p_attempt and s.ordinal=p_ordinal and s.token=p_token for share of i;
    if found and q.status='held' and not exists(select 1 from science_revision_updates where source_revision=q.id) then raise exception 'item_unavailable'; end if;
  end if;
  return science_commit_answer_before_hold_guard(p_attempt,p_visitor,p_user,p_ordinal,p_token,p_operation,p_selected,p_result);
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname in ('science_remember_hold','science_reject_correction','science_revise_correction','science_reopen_held_item','science_commit_answer','science_commit_answer_before_hold_guard') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
