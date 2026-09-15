begin;
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('science-overhaul-install',0));
do $migration_guard$ begin
if not exists(select 1 from science_migration_history where name='0004_exam_modes_and_score_kinds.sql' and sha256='651d2250079f2a1642aeed14012a46ff21c41ad0713b695cb303a23caa978603') then raise exception 'prerequisite_hash_mismatch: 0004_exam_modes_and_score_kinds.sql'; end if;
if not exists(select 1 from science_migration_history where name='0005_subdomain_exam.sql' and sha256='5b2a49cd98beb233ab12592780e185411954bf26c2a301afe8683d825623df7c') then raise exception 'prerequisite_hash_mismatch: 0005_subdomain_exam.sql'; end if;
if not exists(select 1 from science_migration_history where name='0006_science_overhaul.sql' and sha256='9ee7078f1ea5a91d2ca5251fc2702e03e9f980e030ed095c67903afcd17e4708') then raise exception 'prerequisite_hash_mismatch: 0006_science_overhaul.sql'; end if;
if not exists(select 1 from science_migration_history where name='0008_science_account_operations.sql' and sha256='6044462c2bb019c045df781f38e6260ee5d89c976bd4b4e925100059d33ff037') then raise exception 'prerequisite_hash_mismatch: 0008_science_account_operations.sql'; end if;
if not exists(select 1 from science_migration_history where name='0009_science_results_and_badges.sql' and sha256='e4d59384d82344a54529cfafe78919a486502ec31e1f1ad8363e7128cc31d0b0') then raise exception 'prerequisite_hash_mismatch: 0009_science_results_and_badges.sql'; end if;
if not exists(select 1 from science_migration_history where name='0010_science_rankings.sql' and sha256='2ff9d6a30a4cab347dfe285ba733bf38e2f9cdd7844e8b4f221ee54c91387c2e') then raise exception 'prerequisite_hash_mismatch: 0010_science_rankings.sql'; end if;
if not exists(select 1 from science_migration_history where name='0011_science_community.sql' and sha256='9689274c0272d990ee218daa093c129e920d23a03973a47bc4f0bc2e9090b9ff') then raise exception 'prerequisite_hash_mismatch: 0011_science_community.sql'; end if;
if not exists(select 1 from science_migration_history where name='0012_science_admin_metrics.sql' and sha256='aed7aa32917b9a2a7bedbd5fb8936af8cd1a32984c1f1bc3a1d133e64090af33') then raise exception 'prerequisite_hash_mismatch: 0012_science_admin_metrics.sql'; end if;
if not exists(select 1 from science_migration_history where name='0013_science_review_collection.sql' and sha256='9ecf9a065eb2153b469bd7a62d6ab13ef2d832f4fc925be8b89a18b7729ef205') then raise exception 'prerequisite_hash_mismatch: 0013_science_review_collection.sql'; end if;
if not exists(select 1 from science_migration_history where name='0014_science_release_operations.sql' and sha256='75fcd91e7723eaf1ddc232717fe53c910bd6e4bbb9f49a7e1775cf0d855101b7') then raise exception 'prerequisite_hash_mismatch: 0014_science_release_operations.sql'; end if;
if not exists(select 1 from science_migration_history where name='0015_science_experiment_analysis.sql' and sha256='503344b2c6bbdcb781ca889541b0a7fbdd956636d2bc61b67a2583393a969e37') then raise exception 'prerequisite_hash_mismatch: 0015_science_experiment_analysis.sql'; end if;
if not exists(select 1 from science_migration_history where name='0016_science_calibration_candidates.sql' and sha256='cc97af1cbbe16fb8bb6cbae0fbc3dd57fd0dbca8640da43f867dab164992574b') then raise exception 'prerequisite_hash_mismatch: 0016_science_calibration_candidates.sql'; end if;
if not exists(select 1 from science_migration_history where name='0017_science_corrections.sql' and sha256='99593d1e5351eac25e3d46e8a91164bf6bc349dca3a95f6dfa87701d93b665a3') then raise exception 'prerequisite_hash_mismatch: 0017_science_corrections.sql'; end if;
if not exists(select 1 from science_migration_history where name='0018_science_quality_watch.sql' and sha256='68dff7ff26c16c71e7aed28e38a6d09f4fe23f9d18b7a372e9415a7b8c115196') then raise exception 'prerequisite_hash_mismatch: 0018_science_quality_watch.sql'; end if;
if not exists(select 1 from science_migration_history where name='0019_science_identity_exposure.sql' and sha256='0fa8ae1766a1a49d0a30a41b390b5339ee947c86417fd17a6000cf36e973bbd6') then raise exception 'prerequisite_hash_mismatch: 0019_science_identity_exposure.sql'; end if;
if not exists(select 1 from science_migration_history where name='0020_science_license_versions.sql' and sha256='2b9c7b1f74425fea6d232118e91055e74cd44c5cba2fa538b233c73232766d3b') then raise exception 'prerequisite_hash_mismatch: 0020_science_license_versions.sql'; end if;
if not exists(select 1 from science_migration_history where name='0021_science_auth_boundary.sql' and sha256='95b976c86569e72cb34ad138b7a2d3459e59b36d83c525d765fbb4de7dcd1e6e') then raise exception 'prerequisite_hash_mismatch: 0021_science_auth_boundary.sql'; end if;
if not exists(select 1 from science_migration_history where name='0022_science_consent_export.sql' and sha256='06de3c8215a3507d384f57cb357f404e3e12fa822ffc4265f3611e014f42849d') then raise exception 'prerequisite_hash_mismatch: 0022_science_consent_export.sql'; end if;
if not exists(select 1 from science_migration_history where name='0023_science_bank_import.sql' and sha256='e6821fc67821c67953de5aee78101d167efb3f9f865e81a79127bbf92e6cf2c3') then raise exception 'prerequisite_hash_mismatch: 0023_science_bank_import.sql'; end if;
if not exists(select 1 from science_migration_history where name='0024_science_review_recovery.sql' and sha256='b110e8821873590d687ebdf1fb69adbf2834f3473e09d8e31e593c12159f32c3') then raise exception 'prerequisite_hash_mismatch: 0024_science_review_recovery.sql'; end if;
if not exists(select 1 from science_migration_history where name='0025_science_mail_delivery.sql' and sha256='e980fe827e81220e22fda85858190c62b396476dfb7bf247851a93caedcb8f6c') then raise exception 'prerequisite_hash_mismatch: 0025_science_mail_delivery.sql'; end if;
if not exists(select 1 from science_migration_history where name='0026_science_withdrawn_skips.sql' and sha256='6694f2ce218dc69269cd64a09ded84da4b1847397e12b6ebe42a898367616a02') then raise exception 'prerequisite_hash_mismatch: 0026_science_withdrawn_skips.sql'; end if;
if not exists(select 1 from science_migration_history where name='0027_science_calibration_campaign.sql' and sha256='0ad611c957028a71a620552bcd9e1a3dbf60b39a87ff092591a2b485b1d58389') then raise exception 'prerequisite_hash_mismatch: 0027_science_calibration_campaign.sql'; end if;
if not exists(select 1 from science_migration_history where name='0028_science_case_sensitive_choices.sql' and sha256='4802c0bfede49627960bf1de5a8bad58cec78d1adab5392c3e05591f11a1d644') then raise exception 'prerequisite_hash_mismatch: 0028_science_case_sensitive_choices.sql'; end if;
if exists(select 1 from science_migration_history where name='0029_science_myasp_sync.sql') then raise exception 'migration_already_recorded: 0029_science_myasp_sync.sql'; end if;
end $migration_guard$;
-- 0029_science_myasp_sync.sql
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


insert into science_migration_history(name,sha256) values('0029_science_myasp_sync.sql','c718d8d9c47b21883965471abb45e1665b4b7b7816deac471e1e33d9cbfa09b4');
commit;
select name,sha256,applied_at from science_migration_history order by name;
