begin;

create table science_myasp_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 1, claimed_version bigint, claim_token uuid, locked_until timestamptz,
  state text not null default 'pending' check(state in ('pending','processing','synced','failed')),
  next_at timestamptz not null default now(), remote_id text unique, remote_email_sha256 text,
  remote_status text, remote_stopped_at timestamptz, synced_at timestamptz, attempts int not null default 0,
  error_code text, updated_at timestamptz not null default now(),
  check(remote_email_sha256 is null or remote_email_sha256 ~ '^[0-9a-f]{64}$')
);
alter table science_myasp_sync enable row level security;
revoke all on science_myasp_sync from public,anon,authenticated;
grant all on science_myasp_sync to service_role;
create index science_myasp_due on science_myasp_sync(next_at,user_id);

create function science_private.queue_myasp(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_user is null then return; end if;
  if exists(select 1 from public.science_myasp_sync where user_id=p_user)
    or exists(select 1 from public.science_consents where user_id=p_user and enabled) then
    insert into public.science_myasp_sync(user_id) values(p_user)
    on conflict(user_id) do update set version=public.science_myasp_sync.version+1,next_at=now(),updated_at=now();
  end if;
end $$;
create function science_private.myasp_profile_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin perform science_private.queue_myasp(new.user_id);return new;end $$;
create function science_private.myasp_auth_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin perform science_private.queue_myasp(new.id);return new;end $$;
create trigger science_myasp_consent_changed after insert or update on science_consents
  for each row execute function science_private.myasp_profile_changed();
create trigger science_myasp_profile_changed after insert or update of interests on science_profiles
  for each row execute function science_private.myasp_profile_changed();
create trigger science_myasp_attempt_changed after insert or update of state,user_id on science_attempts
  for each row execute function science_private.myasp_profile_changed();
create trigger science_myasp_auth_changed after update of email,email_confirmed_at on auth.users
  for each row execute function science_private.myasp_auth_changed();

create function science_myasp_snapshot(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare q public.science_myasp_sync; recipient text; prefs jsonb; changed timestamptz; profile public.science_profiles;
  completed jsonb; active boolean; week text; config jsonb;
begin
  select * into q from public.science_myasp_sync where user_id=p_user;
  if not found then return null; end if;
  select lower(trim(email)) into recipient from auth.users where id=p_user and email_confirmed_at is not null;
  select coalesce(jsonb_object_agg(topic,enabled),'{}') into prefs from public.science_consents where user_id=p_user;
  select max(updated_at) into changed from public.science_consents where user_id=p_user and enabled;
  select * into profile from public.science_profiles where user_id=p_user;
  select coalesce(jsonb_agg(kind order by kind),'[]') into completed from
    (select distinct kind from public.science_attempts where user_id=p_user and state='completed') k;
  select exists(select 1 from public.science_attempts a where a.user_id=p_user and a.state='active'
    and (a.kind<>'weekly' or exists(select 1 from public.science_weekly_sets w where w.id=a.week_id and w.ends_at>now()))) into active;
  select w.id into week from public.science_weekly_sets w where w.starts_at<=now() and w.ends_at>now()
    and not exists(select 1 from public.science_attempts a where a.user_id=p_user and a.week_id=w.id and a.state='completed') order by w.starts_at desc limit 1;
  select value into config from public.science_config where key='release';
  return jsonb_build_object('userId',p_user,'email',recipient,'version',q.version,
    'emailHash',case when recipient is null then null else encode(sha256(convert_to(recipient,'UTF8')),'hex') end,
    'interests',coalesce(profile.interests,'{}'),'consents','{"science":false,"weekly":false,"domain_opening":false}'::jsonb||prefs,
    'consentUpdatedAt',changed,'active',active,'completedKinds',completed,'eligibleWeek',week,'observedAt',now(),
    'deliveryEnabled',coalesce((config->>'mailDelivery')::boolean and (config->>'newAttempts')::boolean,false),
    'remoteId',q.remote_id,'remoteEmailHash',q.remote_email_sha256,'remoteStatus',q.remote_status,'remoteStoppedAt',q.remote_stopped_at);
end $$;

create function science_claim_myasp_sync(p_token uuid) returns jsonb
language plpgsql set search_path=public as $$
declare q science_myasp_sync;
begin
  if p_token is null then raise exception 'invalid_token'; end if;
  if not coalesce((select (value->>'myaspSync')::boolean from science_config where key='release'),false) then return jsonb_build_object('state','disabled'); end if;
  select * into q from science_myasp_sync where next_at<=now() and (locked_until is null or locked_until<now())
    order by next_at,user_id limit 1 for update skip locked;
  if not found then return jsonb_build_object('state','idle'); end if;
  update science_myasp_sync set state='processing',claimed_version=version,claim_token=p_token,locked_until=now()+interval '3 minutes',attempts=attempts+1 where user_id=q.user_id;
  return jsonb_build_object('state','claimed','snapshot',science_myasp_snapshot(q.user_id));
end $$;

create function science_bind_myasp(p_user uuid,p_token uuid,p_remote text,p_email_hash text) returns boolean
language plpgsql set search_path=public as $$
declare q science_myasp_sync;
begin
  if p_remote is null or length(p_remote) not between 1 and 128 or p_email_hash is null or p_email_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_binding'; end if;
  select * into q from science_myasp_sync where user_id=p_user for update;
  if not found or q.claim_token is distinct from p_token or q.locked_until<now() then return false; end if;
  if q.remote_id is not null and (q.remote_id<>p_remote or q.remote_email_sha256<>p_email_hash) then raise exception 'binding_conflict'; end if;
  update science_myasp_sync set remote_id=p_remote,remote_email_sha256=p_email_hash where user_id=p_user;
  return true;
end $$;

create function science_clear_myasp_binding(p_user uuid,p_token uuid,p_remote text) returns boolean
language plpgsql set search_path=public as $$
begin
  update science_myasp_sync set remote_id=null,remote_email_sha256=null,remote_status=null,remote_stopped_at=null,version=version+1,next_at=now()
    where user_id=p_user and claim_token=p_token and remote_id=p_remote and locked_until>now();
  return found;
end $$;

-- A newly observed remote stop wins over a stale local grant. Resuming requires a later, explicit local grant.
create function science_record_myasp_stop(p_user uuid,p_token uuid,p_remote text) returns boolean
language plpgsql set search_path=public as $$
declare q science_myasp_sync; operation uuid:=gen_random_uuid();
begin
  perform pg_advisory_xact_lock(hashtextextended('consent:'||p_user,0));
  select * into q from science_myasp_sync where user_id=p_user for update;
  if not found or q.claim_token is distinct from p_token or q.remote_id is distinct from p_remote or q.locked_until<now() then return false; end if;
  insert into science_events(dedupe_key,event_name,user_id,payload)
    select 'myasp-stop:'||operation||':'||topic,'mail_consent_revoked',p_user,jsonb_build_object('topic',topic,'source','myasp')
    from science_consents where user_id=p_user and enabled;
  update science_consents set enabled=false,updated_at=now() where user_id=p_user and enabled;
  update marketing_consents set consented=false where user_id=p_user and consented;
  update science_outbox set state='cancelled',error_code='consent_revoked',processed_at=now() where user_id=p_user and kind='mail' and state in ('pending','failed','blocked');
  update science_myasp_sync set remote_status='unsubscribed',remote_stopped_at=case when q.remote_status='unsubscribed' then coalesce(q.remote_stopped_at,now()) else now() end where user_id=p_user;
  return true;
end $$;

create function science_finish_myasp_sync(p_user uuid,p_token uuid,p_status text,p_error text default null) returns boolean
language plpgsql set search_path=public as $$
declare q science_myasp_sync;
begin
  if p_status is null or p_status not in ('active','unsubscribed','no_contact','detached','failed') or (p_error is not null and p_error !~ '^[a-z_]{3,80}$') then raise exception 'invalid_sync_result'; end if;
  select * into q from science_myasp_sync where user_id=p_user for update;
  if not found or q.claim_token is distinct from p_token or q.locked_until<now() then return false; end if;
  update science_myasp_sync set state=case when p_status='failed' then 'failed' when version<>claimed_version then 'pending' else 'synced' end,
    next_at=case when p_status='failed' then now()+interval '5 minutes' when version<>claimed_version then now() else now()+interval '5 minutes' end,
    remote_status=case when p_status in ('active','unsubscribed') then p_status else remote_status end,
    synced_at=case when p_status='failed' then synced_at else now() end,error_code=p_error,claim_token=null,locked_until=null,
    attempts=case when p_status='failed' then attempts else 0 end where user_id=p_user;
  return true;
end $$;

insert into science_myasp_sync(user_id) select distinct user_id from science_consents where enabled on conflict do nothing;
update science_config set value=value||'{"myaspSync":false}'::jsonb where key='release';
revoke all on function science_private.queue_myasp(uuid),science_private.myasp_profile_changed(),science_private.myasp_auth_changed(),
  science_myasp_snapshot(uuid),science_claim_myasp_sync(uuid),science_bind_myasp(uuid,uuid,text,text),science_clear_myasp_binding(uuid,uuid,text),
  science_record_myasp_stop(uuid,uuid,text),science_finish_myasp_sync(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function science_myasp_snapshot(uuid),science_claim_myasp_sync(uuid),science_bind_myasp(uuid,uuid,text,text),
  science_clear_myasp_binding(uuid,uuid,text),science_record_myasp_stop(uuid,uuid,text),science_finish_myasp_sync(uuid,uuid,text,text) to service_role;

commit;
