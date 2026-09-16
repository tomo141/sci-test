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
if not exists(select 1 from science_migration_history where name='0029_science_myasp_sync.sql' and sha256='c718d8d9c47b21883965471abb45e1665b4b7b7816deac471e1e33d9cbfa09b4') then raise exception 'prerequisite_hash_mismatch: 0029_science_myasp_sync.sql'; end if;
if not exists(select 1 from science_migration_history where name='0030_science_license_publication_basis.sql' and sha256='22d427d3ba4f99287b8f995e55bdc6107a68ca2aa14e8fda02b1f123794804d0') then raise exception 'prerequisite_hash_mismatch: 0030_science_license_publication_basis.sql'; end if;
if not exists(select 1 from science_migration_history where name='0031_science_repeat_fallback.sql' and sha256='1eacf51a2bc5e7dc632f97ea6c713245789dcb28b3363b7b8e6b63465418524f') then raise exception 'prerequisite_hash_mismatch: 0031_science_repeat_fallback.sql'; end if;
if exists(select 1 from science_migration_history where name='0032_science_measurement_version.sql') then raise exception 'migration_already_recorded: 0032_science_measurement_version.sql'; end if;
end $migration_guard$;
-- 0032_science_measurement_version.sql
-- A deployment and an immutable question release must never disagree on the score model.
create function science_guard_attempt_model() returns trigger language plpgsql set search_path=public as $$
begin
  if new.release_id is not null and not exists(select 1 from science_releases where id=new.release_id and model_version=new.model_version) then
    raise exception 'measurement_version_mismatch';
  end if;
  return new;
end $$;
create trigger science_attempt_model_guard before insert on science_attempts for each row execute function science_guard_attempt_model();

create or replace function science_store_current(p_user uuid,p_result jsonb,p_through timestamptz,p_epoch int default 0)
returns boolean language plpgsql set search_path=public as $$
declare active_model text; expected_version text;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  if p_epoch<>science_correction_epoch() then return false; end if;
  select model_version into active_model from science_releases where state='active' for share;
  expected_version:=case active_model when 'science-3pl-reference-v1' then 'domain-window100-half30-v1' when 'science-3pl-p70-linear-v2' then 'domain-window100-half30-p70-v2' end;
  if active_model is not null and (expected_version is null or p_result->>'version' is distinct from expected_version) then return false; end if;
  insert into science_current_estimates(user_id,version,result,through_at,correction_epoch) values(p_user,p_result->>'version',p_result,p_through,p_epoch)
    on conflict(user_id) do update set version=excluded.version,result=excluded.result,through_at=excluded.through_at,correction_epoch=excluded.correction_epoch,updated_at=now()
    where science_current_estimates.version<>excluded.version or science_current_estimates.correction_epoch<excluded.correction_epoch
      or (science_current_estimates.correction_epoch=excluded.correction_epoch and coalesce(science_current_estimates.through_at,'-infinity'::timestamptz)<=coalesce(excluded.through_at,'-infinity'::timestamptz));
  return true;
end $$;

-- Weekly rank is an unweighted correct-answer count on the same fixed set, so a
-- formal-score model change must not split one week's participants into two boards.
create or replace function science_rankings(p_kind text,p_start timestamptz,p_end timestamptz,p_length int,p_model text,p_week text default null)
returns table(place bigint,nickname text,profile_id uuid,share_id uuid,score numeric,exam_length int,effective_length int)
language sql stable set search_path=public as $$
  with eligible as (
    select a.*,row_number() over(partition by a.user_id order by a.completed_at,a.id) as attempt_order
    from science_attempts a
    where a.kind=p_kind and a.state='completed' and a.competitive and a.user_id is not null
      and a.completed_at>=p_start and a.completed_at<p_end and a.total=p_length
      and (p_kind='weekly' or a.model_version=p_model) and (p_kind<>'weekly' or a.week_id=p_week)
  ), visible as (
    select p.nickname,case when p.is_public then p.public_id else null end as profile_id,s.id as share_id,
      case when p_kind='weekly' then (a.result->>'correctCount')::numeric else (a.result->>'total')::numeric end as score,a.total,coalesce((a.result->>'answerCount')::int,a.total) effective_length
    from eligible a join science_profiles p on p.user_id=a.user_id and p.ranking_opt_in left join science_shares s on s.attempt_id=a.id and s.enabled
    where a.attempt_order=1 and not a.needs_recalculation
  )
  select rank() over(order by visible.score desc) as place,visible.nickname,visible.profile_id,visible.share_id,visible.score,visible.total,visible.effective_length
  from visible where visible.score is not null and visible.effective_length>0 order by visible.score desc,visible.nickname,visible.profile_id limit 100;
$$;
revoke all on function science_guard_attempt_model() from public,anon,authenticated;
grant execute on function science_guard_attempt_model() to service_role;

insert into science_migration_history(name,sha256) values('0032_science_measurement_version.sql','03ef2a3a4fe31785d7add50d53821b7da33b1f5a5000ad32b936fb96c2f1f0b4');
commit;
select name,sha256,applied_at from science_migration_history order by name;
