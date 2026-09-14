begin;
-- Auth stays inaccessible through the Data API. This helper reveals only confirmation status.
create schema if not exists science_private;
revoke all on schema science_private from public,anon,authenticated;
grant usage on schema science_private to service_role;
create function science_private.email_verified(p_user uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null);
$$;
revoke all on function science_private.email_verified(uuid) from public,anon,authenticated;
grant execute on function science_private.email_verified(uuid) to service_role;


create or replace function public.science_update_consents(p_user uuid,p_preferences jsonb,p_operation uuid)
returns boolean language plpgsql set search_path=public as $$
declare v_topic text; wanted boolean; old boolean; previous jsonb;
begin
  if not science_private.email_verified(p_user) then raise exception 'email_unverified'; end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||p_user,0));
  select payload into previous from science_events where dedupe_key='consents:'||p_user||':'||p_operation;
  if found then
    if previous<>p_preferences then raise exception 'operation_reused' using errcode='40001'; end if;
    return true;
  end if;
  if jsonb_typeof(p_preferences)<>'object' or exists(select 1 from jsonb_object_keys(p_preferences) k where k not in ('science','weekly','domain_opening')) then raise exception 'invalid_topics'; end if;
  for v_topic in select jsonb_object_keys(p_preferences) loop
    if jsonb_typeof(p_preferences->v_topic)<>'boolean' then raise exception 'invalid_consent'; end if;
    wanted:=(p_preferences->>v_topic)::boolean;
    select enabled into old from science_consents where user_id=p_user and science_consents.topic=v_topic;
    insert into science_consents(user_id,topic,enabled,version) values(p_user,v_topic,wanted,'science-mail-v1')
      on conflict(user_id,topic) do update set enabled=excluded.enabled,version=excluded.version,updated_at=now();
    if wanted is distinct from coalesce(old,false) then
      insert into science_events(dedupe_key,event_name,user_id,payload) values('consent:'||p_user||':'||p_operation||':'||v_topic,case when wanted then 'mail_consent_granted' else 'mail_consent_revoked' end,p_user,jsonb_build_object('topic',v_topic,'version','science-mail-v1'));
    end if;
    if not wanted then
      update science_outbox set state='cancelled',processed_at=now() where user_id=p_user and payload->>'topic'=v_topic and state in ('pending','failed','blocked');
    end if;
    if v_topic='science' then
      update marketing_consents set consented=wanted,consented_at=case when wanted then now() else consented_at end where user_id=p_user;
      if wanted and not coalesce(old,false) then
        insert into science_outbox(dedupe_key,user_id,kind,payload) values('welcome:'||p_user,p_user,'mail',jsonb_build_object('topic','science','template','welcome')) on conflict do nothing;
        insert into science_outbox(dedupe_key,user_id,kind,payload,available_at) values('welcome2:'||p_user,p_user,'mail',jsonb_build_object('topic','science','template','next-exam'),now()+interval '3 days') on conflict do nothing;
      end if;
    end if;
  end loop;
  insert into science_events(dedupe_key,event_name,user_id,payload) values('consents:'||p_user||':'||p_operation,'consent_preferences_updated',p_user,p_preferences);
  return true;
end $$;

create or replace function science_reconcile_identity(p_user uuid,p_visitor uuid) returns int language plpgsql set search_path=public as $$
declare changed int;
begin
  if not science_private.email_verified(p_user) or not exists(select 1 from science_visitors where id=p_visitor and user_id=p_user) then raise exception 'invalid_owner'; end if;
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
  if not science_private.email_verified(p_user) then raise exception 'email_unverified'; end if;
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

commit;
