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
if not exists(select 1 from science_migration_history where name='0032_science_measurement_version.sql' and sha256='03ef2a3a4fe31785d7add50d53821b7da33b1f5a5000ad32b936fb96c2f1f0b4') then raise exception 'prerequisite_hash_mismatch: 0032_science_measurement_version.sql'; end if;
if exists(select 1 from science_migration_history where name='0033_science_knowledge_levels.sql') then raise exception 'migration_already_recorded: 0033_science_knowledge_levels.sql'; end if;
end $migration_guard$;
-- 0033_science_knowledge_levels.sql
-- Optional reference judgements. They are not credentials or score adjustments.
alter table science_submission_drafts add column level_reference jsonb;
create function science_valid_level_reference(value jsonb) returns boolean language sql immutable as $$
  select value is null or coalesce(jsonb_typeof(value)='object'
    and value->>'version'='science-knowledge-stages-v1-20260916'
    and value->>'targetProbability'='0.7'
    and value ? 'level' and (value->'level'='null'::jsonb or value->>'level' in ('primary','lower_secondary','upper_secondary','undergraduate_core','bachelor','master','doctor_research'))
    and value->>'confidence' in ('confident','uncertain','unknown'),false);
$$;
alter table science_submission_drafts add constraint science_draft_level_valid check(science_valid_level_reference(level_reference));
create table science_item_level_references (
  revision_id uuid primary key references science_items(id) on delete cascade,
  draft_id uuid not null references science_submission_drafts(id), draft_revision int not null,
  domain text not null, subdomain text not null,
  reference jsonb not null check(science_valid_level_reference(reference)), created_at timestamptz not null default now()
);
create function science_snapshot_level_reference() returns trigger language plpgsql set search_path=public as $$
begin
  if new.revision_id is distinct from old.revision_id and new.revision_id is not null and new.level_reference is not null then
    insert into science_item_level_references(revision_id,draft_id,draft_revision,domain,subdomain,reference)
      values(new.revision_id,new.id,new.revision,new.domain,new.subdomain,new.level_reference);
  end if;
  return new;
end $$;
create trigger science_draft_level_snapshot after update of revision_id on science_submission_drafts for each row execute function science_snapshot_level_reference();

create table science_level_assessments (
  id uuid primary key default gen_random_uuid(), operation_id uuid not null,
  visitor_id uuid not null references science_visitors(id) on delete cascade,
  attempt_id uuid not null references science_attempts(id) on delete cascade,
  domain text not null check(domain in ('数学','物理','化学','生物','地学','工学','農学','情報・計算機科学','医歯薬学','人文社会科学')),
  subdomain text check(subdomain is null or length(trim(subdomain)) between 1 and 100),
  definition_version text not null check(definition_version='science-knowledge-stages-v1-20260916'),
  level text check(level in ('primary','lower_secondary','upper_secondary','undergraduate_core','bachelor','master','doctor_research')),
  created_at timestamptz not null default now(), unique(visitor_id,operation_id)
);
create index science_level_assessments_owner on science_level_assessments(visitor_id,created_at desc);
create index science_level_assessments_scope on science_level_assessments(domain,subdomain,definition_version,created_at);
-- Resolve account ownership through the visitor, so verified claiming also carries prior self-reports.
create function science_level_history(p_visitor uuid,p_user uuid) returns setof science_level_assessments
language sql stable set search_path=public as $$
  select distinct on (a.domain,coalesce(a.subdomain,''),a.definition_version) a.* from science_level_assessments a join science_visitors v on v.id=a.visitor_id
    where (v.id=p_visitor and (v.user_id is null or v.user_id=p_user)) or (p_user is not null and v.user_id=p_user)
    order by a.domain,coalesce(a.subdomain,''),a.definition_version,a.created_at desc,a.id desc;
$$;
alter table science_level_assessments enable row level security;
alter table science_item_level_references enable row level security;
revoke all on science_level_assessments,science_item_level_references from public,anon,authenticated,service_role;
grant select,insert,delete on science_level_assessments,science_item_level_references to service_role;
revoke all on function science_valid_level_reference(jsonb),science_snapshot_level_reference(),science_level_history(uuid,uuid) from public,anon,authenticated;
grant execute on function science_valid_level_reference(jsonb),science_snapshot_level_reference(),science_level_history(uuid,uuid) to service_role;

insert into science_migration_history(name,sha256) values('0033_science_knowledge_levels.sql','767240ee04e8b21edf99e2180a80518f569a5af3347ad3e6d607ea3e612a61cf');
commit;
select name,sha256,applied_at from science_migration_history order by name;
