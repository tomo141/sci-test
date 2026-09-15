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
if exists(select 1 from science_migration_history where name='0007_legacy_security_and_identity.sql') then raise exception 'migration_already_recorded: 0007_legacy_security_and_identity.sql'; end if;
end $migration_guard$;
-- 0007_legacy_security_and_identity.sql
-- Keep every legacy row. The new application uses explicit server projections for private data.
revoke all on all tables in schema public from anon, authenticated, public;
revoke all on all sequences in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables from anon, authenticated, public;
alter default privileges in schema public revoke all on sequences from anon, authenticated, public;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from science_admins where user_id=auth.uid());
$$;
revoke all on function public.is_admin() from public,anon,authenticated;
grant execute on function public.is_admin() to service_role;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,nickname,role)
    values(new.id,coalesce(new.email,''),left(nullif(new.raw_user_meta_data->>'nickname',''),30),'user') on conflict(id) do nothing;
  insert into marketing_consents(user_id,consented) values(new.id,false) on conflict(user_id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;

insert into science_profiles(user_id,nickname,created_at)
  select id,coalesce(nullif(left(nickname,30),''),'科学好き'),created_at from profiles on conflict(user_id) do nothing;
insert into science_entitlements(user_id,acquired_at,source)
  select user_id,training_unlocked_at,'legacy_training_right' from marketing_consents where training_unlocked_at is not null
  on conflict(user_id) do nothing;
insert into science_consents(user_id,topic,enabled,version,updated_at)
  select user_id,'science',consented,'legacy-consent',coalesce(consented_at,created_at) from marketing_consents
  on conflict(user_id,topic) do nothing;

-- Never copy the old editable profiles.role into trusted administration rights.
-- Operator provisioning is a separate, audited bootstrap using the existing verified allowlist.

insert into science_migration_history(name,sha256) values('0007_legacy_security_and_identity.sql','63b603296e8d3bbdf5fd8780b129c7072aec34cd1b156d3c189a6d5b373206c8');
commit;
select name,sha256,applied_at from science_migration_history order by name;
