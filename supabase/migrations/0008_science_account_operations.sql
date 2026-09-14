begin;
create function public.science_update_consents(p_user uuid,p_preferences jsonb,p_operation uuid)
returns boolean language plpgsql set search_path=public as $$
declare v_topic text; wanted boolean; old boolean; previous jsonb;
begin
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'email_unverified'; end if;
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
revoke all on function public.science_update_consents(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.science_update_consents(uuid,jsonb,uuid) to service_role;

create view public.science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,i.eligible,i.exclusion_reason,
    i.snapshot->>'domain' as domain,i.snapshot->>'subdomain' as subdomain,
    (i.snapshot->>'a')::double precision as a,(i.snapshot->>'b')::double precision as b,(i.snapshot->>'c')::double precision as c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=r.attempt_id;
revoke all on table public.science_responses from public,anon,authenticated;
grant select on table public.science_responses to service_role;
commit;
