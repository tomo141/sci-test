begin;
-- Several legacy IDs may name one reviewed family. Preserve that history across rewrites.
create table science_legacy_families(
  question_id uuid primary key references questions(id),family_id text not null,
  reason text not null check(length(trim(reason))>=5),created_at timestamptz not null default now()
);
create index science_legacy_family on science_legacy_families(family_id);
create table science_response_exclusions(
  attempt_id uuid not null,ordinal int not null,reason text not null check(reason='previously_seen_after_sign_in'),
  created_at timestamptz not null default now(),primary key(attempt_id,ordinal),
  foreign key(attempt_id,ordinal) references science_issued(attempt_id,ordinal)
);
alter table science_legacy_families enable row level security;
alter table science_response_exclusions enable row level security;
revoke all on science_legacy_families,science_response_exclusions from public,anon,authenticated;
grant all on science_legacy_families,science_response_exclusions to service_role;

create function science_reconcile_identity(p_user uuid,p_visitor uuid) returns int language plpgsql set search_path=public as $$
declare changed int;
begin
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) or not exists(select 1 from science_visitors where id=p_visitor and user_id=p_user) then raise exception 'invalid_owner'; end if;
  perform 1 from science_config where key='correction_epoch' for update;
  insert into science_exposures(visitor_id,user_id,family_id,reason,seen_at)
    select p_visitor,p_user,family_id,'legacy',min(seen_at) from (
      select f.family_id,r.answered_at seen_at from science_legacy_families f join exam_answers r on r.question_id=f.question_id
        join exam_sessions s on s.id=r.session_id where s.user_id=p_user or r.user_id=p_user
      union all
      select f.family_id,r.created_at seen_at from science_legacy_families f join question_feedback r on r.question_id=f.question_id where r.user_id=p_user
    ) previous group by family_id
    on conflict(visitor_id,family_id) do update set seen_at=excluded.seen_at,reason='legacy',first_attempt_id=null
      where excluded.seen_at<science_exposures.seen_at;
  insert into science_response_exclusions(attempt_id,ordinal,reason)
    select i.attempt_id,i.ordinal,'previously_seen_after_sign_in'
      from science_issued i join science_attempts a on a.id=i.attempt_id
      where a.user_id=p_user and i.exclusion_reason is distinct from 'previously_seen_or_author' and exists(
        select 1 from science_exposures e where e.user_id=p_user and e.family_id=i.family_id and e.first_attempt_id is distinct from i.attempt_id
          and (e.seen_at<i.issued_at or (e.seen_at=i.issued_at and (e.first_attempt_id is null or e.first_attempt_id::text<i.attempt_id::text))))
    on conflict do nothing;
  get diagnostics changed=row_count;
  if changed>0 then
    update science_config set value=to_jsonb(value::text::int+1),updated_at=now() where key='correction_epoch';
    update science_attempts a set competitive=false,needs_recalculation=(state='completed') where a.user_id=p_user and exists(select 1 from science_response_exclusions x where x.attempt_id=a.id);
    insert into science_audit(actor_id,action,target,reason,detail) values(p_user,'identity_exposure_reconciled',p_user::text,'Verified sign-in joined earlier exposure histories',jsonb_build_object('excluded',changed));
  end if;
  delete from science_current_estimates where user_id=p_user;
  return changed;
end $$;

create or replace function science_claim_visitor(p_visitor uuid,p_hash text,p_user uuid)
returns boolean language plpgsql set search_path=public as $$
declare v science_visitors;original science_visitors;
begin
  -- Final scoring/issuance take a shared lock first, so this merge cannot race their novelty check.
  perform 1 from science_config where key='correction_epoch' for update;
  select * into v from science_visitors where id=p_visitor and token_hash=p_hash for update;
  if not found or (v.user_id is not null and v.user_id<>p_user) then raise exception 'invalid_owner'; end if;
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'email_unverified'; end if;
  if v.user_id=p_user then return true; end if;
  select * into original from science_visitors where user_id=p_user order by created_at,id limit 1;
  if found and original.id<>v.id then
    insert into science_events(dedupe_key,event_name,visitor_id,user_id,payload) values('merge:'||v.id,'assignment_merged',v.id,p_user,jsonb_build_object('originalGroup',v.route_group,'canonicalGroup',original.route_group)) on conflict do nothing;
  end if;
  update science_visitors set user_id=p_user,verified_at=coalesce(verified_at,now()),route_group=coalesce(original.route_group,route_group),full_length=coalesce(original.full_length,full_length),experiment=coalesce(original.experiment,experiment) where id=p_visitor;
  update science_attempts set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_exposures set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_events set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_feedback set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_outbox set user_id=p_user where user_id is null and kind='attempt_completed' and payload->>'attemptId' in(select id::text from science_attempts where visitor_id=p_visitor and user_id=p_user);
  insert into science_profiles(user_id) values(p_user) on conflict do nothing;
  insert into science_entitlements(user_id,source) values(p_user,'verified_email') on conflict do nothing;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id) values('verified:'||p_user,'email_verified',p_visitor,p_user) on conflict do nothing;
  perform science_reconcile_identity(p_user,p_visitor);
  return true;
end $$;

create or replace view science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,
    i.eligible and not coalesce(c.excluded,false) and x.attempt_id is null eligible,
    case when c.excluded then 'question_withdrawn' when x.attempt_id is not null then x.reason else i.exclusion_reason end exclusion_reason,
    i.snapshot->>'domain' domain,i.snapshot->>'subdomain' subdomain,
    (i.snapshot->>'a')::double precision a,(i.snapshot->>'b')::double precision b,(i.snapshot->>'c')::double precision c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
  left join science_revision_updates c on c.source_revision=i.revision_id
  left join science_response_exclusions x on x.attempt_id=i.attempt_id and x.ordinal=i.ordinal;
revoke all on function science_reconcile_identity(uuid,uuid),science_claim_visitor(uuid,text,uuid) from public,anon,authenticated;
grant execute on function science_reconcile_identity(uuid,uuid),science_claim_visitor(uuid,text,uuid) to service_role;
commit;
