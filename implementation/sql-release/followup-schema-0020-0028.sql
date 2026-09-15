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
if exists(select 1 from science_migration_history where name='0020_science_license_versions.sql') then raise exception 'migration_already_recorded: 0020_science_license_versions.sql'; end if;
if exists(select 1 from science_migration_history where name='0021_science_auth_boundary.sql') then raise exception 'migration_already_recorded: 0021_science_auth_boundary.sql'; end if;
if exists(select 1 from science_migration_history where name='0022_science_consent_export.sql') then raise exception 'migration_already_recorded: 0022_science_consent_export.sql'; end if;
if exists(select 1 from science_migration_history where name='0023_science_bank_import.sql') then raise exception 'migration_already_recorded: 0023_science_bank_import.sql'; end if;
if exists(select 1 from science_migration_history where name='0024_science_review_recovery.sql') then raise exception 'migration_already_recorded: 0024_science_review_recovery.sql'; end if;
if exists(select 1 from science_migration_history where name='0025_science_mail_delivery.sql') then raise exception 'migration_already_recorded: 0025_science_mail_delivery.sql'; end if;
if exists(select 1 from science_migration_history where name='0026_science_withdrawn_skips.sql') then raise exception 'migration_already_recorded: 0026_science_withdrawn_skips.sql'; end if;
if exists(select 1 from science_migration_history where name='0027_science_calibration_campaign.sql') then raise exception 'migration_already_recorded: 0027_science_calibration_campaign.sql'; end if;
if exists(select 1 from science_migration_history where name='0028_science_case_sensitive_choices.sql') then raise exception 'migration_already_recorded: 0028_science_case_sensitive_choices.sql'; end if;
end $migration_guard$;
-- 0020_science_license_versions.sql
create table science_license_versions(
  version text primary key check(version~'^[a-zA-Z0-9._-]{1,100}$'),
  operator_name text not null check(length(trim(operator_name))>=2),terms jsonb not null,
  sha256 text not null check(sha256~'^[0-9a-f]{64}$'),
  published_at timestamptz,active boolean not null default false,
  operator_approved_at timestamptz,legal_review_ref text,
  check(not active or published_at is not null),
  check(published_at is null or (operator_approved_at is not null and coalesce(length(trim(legal_review_ref)),0)>=5))
);
alter table science_license_versions enable row level security;
revoke all on science_license_versions from public,anon,authenticated;
grant all on science_license_versions to service_role;
alter table science_license_acceptances add column terms_sha256 text;
create function science_freeze_published_license() returns trigger language plpgsql set search_path=public as $$
begin
  if old.published_at is not null and (tg_op='DELETE' or (to_jsonb(new)-'active') is distinct from (to_jsonb(old)-'active')) then raise exception 'published_license_is_immutable'; end if;
  if tg_op='DELETE' then return old; end if;return new;
end $$;
create trigger science_license_immutable before update or delete on science_license_versions for each row execute function science_freeze_published_license();
create function science_check_license_acceptance() returns trigger language plpgsql set search_path=public as $$
declare terms science_license_versions;
begin
  select * into terms from science_license_versions where version=new.license_version and active and published_at is not null for share;
  if not found then raise exception 'submission_not_open'; end if;
  if new.representations->>'licenseHash' is distinct from terms.sha256 then raise exception 'terms_changed' using errcode='40001'; end if;
  new.terms_sha256:=terms.sha256;return new;
end $$;
create trigger science_acceptance_terms before insert on science_license_acceptances for each row execute function science_check_license_acceptance();
revoke all on function science_freeze_published_license(),science_check_license_acceptance() from public,anon,authenticated;
grant execute on function science_freeze_published_license(),science_check_license_acceptance() to service_role;

insert into science_migration_history(name,sha256) values('0020_science_license_versions.sql','2b9c7b1f74425fea6d232118e91055e74cd44c5cba2fa538b233c73232766d3b');

-- 0021_science_auth_boundary.sql
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


insert into science_migration_history(name,sha256) values('0021_science_auth_boundary.sql','95b976c86569e72cb34ad138b7a2d3459e59b36d83c525d765fbb4de7dcd1e6e');

-- 0022_science_consent_export.sql
-- Export only verified addresses with current consent, through an audited administrator path.
create function science_private.consent_export_page(p_actor uuid,p_after_user uuid,p_after_topic text)
returns table(user_id uuid,email text,nickname text,topic text,version text,updated_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not exists(select 1 from public.science_admins a where a.user_id=p_actor) then raise exception 'forbidden'; end if;
  if p_after_user is not null and (p_after_topic is null or p_after_topic not in ('science','weekly','domain_opening')) then raise exception 'invalid_cursor'; end if;
  return query select c.user_id,u.email,p.nickname,c.topic,c.version,c.updated_at
    from public.science_consents c join auth.users u on u.id=c.user_id
    join public.science_profiles p on p.user_id=c.user_id
    where c.enabled and u.email_confirmed_at is not null and u.email is not null
      and (p_after_user is null or (c.user_id,c.topic)>(p_after_user,p_after_topic))
    order by c.user_id,c.topic limit 1000;
end $$;
create function public.science_consent_export_page(p_actor uuid,p_after_user uuid default null,p_after_topic text default null)
returns table(user_id uuid,email text,nickname text,topic text,version text,updated_at timestamptz)
language sql stable set search_path='' as $$
  select * from science_private.consent_export_page(p_actor,p_after_user,p_after_topic);
$$;
revoke all on function science_private.consent_export_page(uuid,uuid,text),public.science_consent_export_page(uuid,uuid,text) from public,anon,authenticated;
grant execute on function science_private.consent_export_page(uuid,uuid,text),public.science_consent_export_page(uuid,uuid,text) to service_role;

insert into science_migration_history(name,sha256) values('0022_science_consent_export.sql','06de3c8215a3507d384f57cb357f404e3e12fa822ffc4265f3611e014f42849d');

-- 0023_science_bank_import.sql
create index if not exists science_legacy_answer_lookup on exam_answers(question_id,user_id);
create table science_bank_import_items(
  release_id uuid not null references science_releases(id),revision_id uuid not null references science_items(id),
  usage text not null check(usage in ('formal','weekly-reserve')),content_sha256 text not null check(content_sha256~'^[0-9a-f]{64}$'),
  primary key(release_id,revision_id)
);
alter table science_bank_import_items enable row level security;
revoke all on science_bank_import_items from public,anon,authenticated;
grant all on science_bank_import_items to service_role;
create view science_reserved_weekly_families with(security_invoker=true) as
  select q.family_id from science_release_items r join science_items q on q.id=r.revision_id
  union select q.family_id from science_weekly_sets w cross join lateral unnest(w.revision_ids) v(id) join science_items q on q.id=v.id;
revoke all on science_reserved_weekly_families from public,anon,authenticated;
grant select on science_reserved_weekly_families to service_role;

create function science_import_bank_batch(p_release uuid,p_actor uuid,p_manifest text,p_rows jsonb)
returns jsonb language plpgsql set search_path=public as $$
declare r science_releases;entry jsonb;item science_items;alias_id uuid;v record;n int:=0;missing int:=0;
begin
  if p_actor is null or not exists(select 1 from science_admins where user_id=p_actor) then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 100 then raise exception 'invalid_batch'; end if;
  perform 1 from science_config where key='correction_epoch' for update;
  select * into r from science_releases where id=p_release for update;
  if not found or r.state<>'candidate' or r.settings->>'importManifest' is distinct from p_manifest or p_manifest !~ '^[0-9a-f]{64}$' then raise exception 'invalid_import'; end if;
  for entry in select value from jsonb_array_elements(p_rows) loop
    if entry->>'id' is null or (r.settings->'expectedRevisions' @> jsonb_build_array(entry->>'id')) is not true then raise exception 'unexpected_revision'; end if;
    if entry->'review_evidence'->>'releaseApproval' is distinct from 'approved'
      or entry->'review_evidence'->>'sourceChecked' is distinct from 'true'
      or entry->'review_evidence'->>'uniqueAnswerChecked' is distinct from 'true'
      or entry->'review_evidence'->>'distractorRationalesChecked' is distinct from 'true'
      or coalesce(length(trim(entry->'review_evidence'->>'rightsBasis')),0)<10
      or coalesce(entry->'review_evidence'->>'contentSha256','') !~ '^[0-9a-f]{64}$'
      or not science_valid_content(entry->'content')
      or coalesce(jsonb_array_length(entry->'content'->'sources'),0)<1
      or coalesce(jsonb_array_length(entry->'content'->'distractorRationales'),0)<>4
      or entry->'parameters'->>'a' is distinct from '1' or entry->'parameters'->>'c' is distinct from '0.25'
      or entry->>'use' not in ('formal','weekly-reserve') then raise exception 'review_evidence_required'; end if;
    insert into science_items(id,family_id,version,legacy_id,domain,subdomain,content,status,quality_passed,rights_checked,review_evidence)
      values((entry->>'id')::uuid,entry->>'family_id',(entry->>'version')::int,
        (select id from questions where id=(entry->>'legacy_id')::uuid),entry->>'domain',entry->>'subdomain',entry->'content','draft',true,true,entry->'review_evidence')
      on conflict(id) do nothing;
    select * into item from science_items where id=(entry->>'id')::uuid;
    if item.family_id is distinct from entry->>'family_id' or item.version is distinct from (entry->>'version')::int
      or item.domain is distinct from entry->>'domain' or item.subdomain is distinct from entry->>'subdomain'
      or item.content is distinct from entry->'content' or item.review_evidence->>'contentSha256' is distinct from entry->'review_evidence'->>'contentSha256'
      or item.status not in ('draft','published') or not item.quality_passed or not item.rights_checked then raise exception 'immutable_revision_conflict'; end if;
    insert into science_bank_import_items(release_id,revision_id,usage,content_sha256)
      values(r.id,item.id,entry->>'use',entry->'review_evidence'->>'contentSha256') on conflict do nothing;
    if not exists(select 1 from science_bank_import_items x where x.release_id=r.id and x.revision_id=item.id and x.usage=entry->>'use' and x.content_sha256=entry->'review_evidence'->>'contentSha256') then raise exception 'import_usage_conflict'; end if;
    if entry->>'use'='formal' then
      insert into science_release_items(release_id,revision_id,a,b,c,focus,anchor,parameter_evidence)
        values(r.id,item.id,1,(entry->'parameters'->>'b')::double precision,.25,
          (entry->'parameters'->>'focus')::boolean,(entry->'parameters'->>'anchor')::boolean,entry->'parameter_evidence') on conflict do nothing;
      if not exists(select 1 from science_release_items x where x.release_id=r.id and x.revision_id=item.id
        and x.a=1 and x.b=(entry->'parameters'->>'b')::double precision and x.c=.25
        and x.focus=(entry->'parameters'->>'focus')::boolean and x.anchor=(entry->'parameters'->>'anchor')::boolean
        and x.parameter_evidence=entry->'parameter_evidence') then raise exception 'import_parameter_conflict'; end if;
    end if;
    for alias_id in select value::uuid from jsonb_array_elements_text(entry->'legacy_ids') loop
      if exists(select 1 from questions where id=alias_id) then
        insert into science_legacy_families(question_id,family_id,reason) values(alias_id,item.family_id,entry->'review_evidence'->>'reason') on conflict do nothing;
        if not exists(select 1 from science_legacy_families where question_id=alias_id and family_id=item.family_id) then raise exception 'legacy_family_conflict'; end if;
      else missing:=missing+1;end if;
    end loop;
    n:=n+1;
  end loop;
  -- Newly mapped legacy questions must also reach people who signed in before this import.
  for v in select distinct on(sv.user_id) sv.user_id,sv.id from science_visitors sv
    where sv.user_id in(select a.user_id from exam_answers a where a.question_id in(
      select aliases.value::uuid from jsonb_array_elements(p_rows) inputs
        cross join lateral jsonb_array_elements_text(inputs.value->'legacy_ids') aliases))
    order by sv.user_id,sv.created_at,sv.id loop
    if science_private.email_verified(v.user_id) then perform science_reconcile_identity(v.user_id,v.id); end if;
  end loop;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_actor,'bank_batch_imported',r.id::text,'Reviewed candidate batch, publication still gated',jsonb_build_object('rows',n,'legacyAliasesNotPresent',missing,'manifest',p_manifest));
  return jsonb_build_object('rows',n,'legacyAliasesNotPresent',missing);
end $$;

create function science_finish_bank_import(p_release uuid,p_actor uuid,p_manifest text,p_reason text)
returns boolean language plpgsql set search_path=public as $$
declare r science_releases;expected int;
begin
  if p_actor is null or not exists(select 1 from science_admins where user_id=p_actor) then raise exception 'forbidden'; end if;
  perform 1 from science_config where key='correction_epoch' for share;
  perform pg_advisory_xact_lock(hashtextextended('science-active-release',0));
  select * into r from science_releases where id=p_release for update;
  if not found or r.state<>'candidate' or r.settings->>'importManifest' is distinct from p_manifest then raise exception 'invalid_import'; end if;
  expected:=jsonb_array_length(r.settings->'expectedRevisions');
  if expected is null or expected=0 or (select count(*) from science_bank_import_items where release_id=r.id)<>expected then raise exception 'import_incomplete'; end if;
  if exists(select 1 from science_bank_import_items x join science_items q on q.id=x.revision_id where x.release_id=r.id and (q.status not in ('draft','published') or not q.quality_passed or not q.rights_checked)) then raise exception 'item_not_approved'; end if;
  if exists(select q.family_id from science_bank_import_items x join science_items q on q.id=x.revision_id where x.release_id=r.id group by q.family_id having count(*)>1) then raise exception 'duplicate_family'; end if;
  if exists(select 1 from science_bank_import_items x join science_items q on q.id=x.revision_id join science_reserved_weekly_families used on used.family_id=q.family_id where x.release_id=r.id and x.usage='weekly-reserve') then raise exception 'weekly_family_already_used'; end if;
  if exists(select d from unnest(array['数学','物理','化学','生物','地学','工学','農学','情報・計算機科学','医歯薬学','人文社会科学']) d
    where (select count(*) from science_bank_import_items x join science_items q on q.id=x.revision_id where x.release_id=r.id and x.usage='weekly-reserve' and q.domain=d)<2) then raise exception 'weekly_reserve_below_two'; end if;
  update science_items set status='published' where status='draft' and id in(select revision_id from science_bank_import_items where release_id=r.id);
  perform science_activate_release(r.id,p_actor,p_reason);
  return true;
end $$;
revoke all on function science_import_bank_batch(uuid,uuid,text,jsonb),science_finish_bank_import(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function science_import_bank_batch(uuid,uuid,text,jsonb),science_finish_bank_import(uuid,uuid,text,text) to service_role;

insert into science_migration_history(name,sha256) values('0023_science_bank_import.sql','e6821fc67821c67953de5aee78101d167efb3f9f865e81a79127bbf92e6cf2c3');

-- 0024_science_review_recovery.sql
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

insert into science_migration_history(name,sha256) values('0024_science_review_recovery.sql','b110e8821873590d687ebdf1fb69adbf2834f3473e09d8e31e593c12159f32c3');

-- 0025_science_mail_delivery.sql
alter table science_outbox add column delivery_token uuid;
alter table science_outbox add column delivery_authorized_at timestamptz;
alter table science_outbox add column content_sha256 text check(content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$');
alter table science_outbox add column recipient_sha256 text check(recipient_sha256 is null or recipient_sha256 ~ '^[0-9a-f]{64}$');
create index science_mail_due on science_outbox(available_at,id) where kind='mail' and state in ('pending','failed');
create table science_mail_unsubscribe_tokens (
  token_hash text primary key check(token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table science_mail_unsubscribe_tokens enable row level security;
revoke all on science_mail_unsubscribe_tokens from public,anon,authenticated;
grant all on science_mail_unsubscribe_tokens to service_role;

-- No older challenge is backfilled. Repeated batches resume with users not yet queued.
create function science_queue_weekly_mail(p_limit int default 500) returns jsonb
language plpgsql set search_path=public as $$
declare w science_weekly_sets; added int; remaining boolean;
begin
  if p_limit is null or p_limit<1 or p_limit>500 then raise exception 'invalid_batch_size'; end if;
  if not coalesce((select (value->>'newAttempts')::boolean from science_config where key='release'),false) then return jsonb_build_object('state','exams_closed','queued',0); end if;
  select * into w from science_weekly_sets where starts_at<=now() and ends_at>now() order by starts_at desc limit 1;
  if not found then return jsonb_build_object('state','no_current_week','queued',0); end if;
  insert into science_outbox(dedupe_key,user_id,kind,payload)
    select 'weekly:'||w.id||':'||c.user_id,c.user_id,'mail',jsonb_build_object('topic','weekly','template','weekly','week',w.id)
    from science_consents c where c.topic='weekly' and c.enabled and science_private.email_verified(c.user_id)
      and not exists(select 1 from science_attempts a where a.user_id=c.user_id and a.week_id=w.id and a.state='completed')
      and not exists(select 1 from science_outbox o where o.dedupe_key='weekly:'||w.id||':'||c.user_id)
    order by c.user_id limit p_limit on conflict do nothing;
  get diagnostics added=row_count;
  select exists(select 1 from science_consents c where c.topic='weekly' and c.enabled and science_private.email_verified(c.user_id)
    and not exists(select 1 from science_attempts a where a.user_id=c.user_id and a.week_id=w.id and a.state='completed')
    and not exists(select 1 from science_outbox o where o.dedupe_key='weekly:'||w.id||':'||c.user_id)) into remaining;
  return jsonb_build_object('state','queued','week',w.id,'queued',added,'hasMore',remaining);
end $$;

create function science_mail_suppression(p_message uuid) returns text
language plpgsql stable set search_path=public as $$
declare m science_outbox; template text;
begin
  select * into m from science_outbox where id=p_message and kind='mail';
  if not found or m.user_id is null then return 'missing_recipient'; end if;
  if not science_private.email_verified(m.user_id) then return 'email_unverified'; end if;
  if not exists(select 1 from science_consents where user_id=m.user_id and topic=m.payload->>'topic' and enabled) then return 'consent_revoked'; end if;
  template:=m.payload->>'template';
  if template is null or template not in ('welcome','next-exam','weekly') then return 'unsupported_template'; end if;
  if (template='weekly' and m.payload->>'topic' is distinct from 'weekly') or (template<>'weekly' and m.payload->>'topic' is distinct from 'science') then return 'invalid_topic'; end if;
  if template='weekly' then
    if not exists(select 1 from science_weekly_sets where id=m.payload->>'week' and starts_at<=now() and ends_at>now()) then return 'week_closed'; end if;
    if exists(select 1 from science_attempts where user_id=m.user_id and week_id=m.payload->>'week' and state='completed') then return 'already_completed'; end if;
  elsif m.created_at<now()-interval '30 days' then return 'onboarding_expired';
  end if;
  return null;
end $$;

-- The helper returns only the verified recipient attached to a claimed mail, not arbitrary Auth data.
create function science_private.mail_recipient(p_message uuid,p_token uuid) returns text
language sql stable security definer set search_path='' as $$
  select u.email from public.science_outbox m join auth.users u on u.id=m.user_id
    where m.id=p_message and m.kind='mail' and m.state='processing' and m.delivery_token=p_token
      and u.email_confirmed_at is not null and public.science_mail_suppression(m.id) is null;
$$;

create function science_claim_mail(p_message uuid,p_token uuid,p_unsubscribe_hash text) returns jsonb
language plpgsql set search_path=public as $$
declare m science_outbox; owner uuid; suppression text; recipient text; profile science_profiles;
  active science_attempts; latest science_attempts; completed jsonb;
begin
  if p_token is null or p_unsubscribe_hash is null or p_unsubscribe_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_claim'; end if;
  if not coalesce((select (value->>'mailDelivery')::boolean and (value->>'newAttempts')::boolean from science_config where key='release'),false) then return jsonb_build_object('state','disabled'); end if;
  select user_id into owner from science_outbox where id=p_message and kind='mail';
  if owner is null then return jsonb_build_object('state','not_claimed'); end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||owner,0));
  select * into m from science_outbox where id=p_message and kind='mail' for update;
  if m.state not in ('pending','failed') or m.available_at>now() then return jsonb_build_object('state','not_claimed'); end if;
  suppression:=science_mail_suppression(m.id);
  if suppression is not null then
    update science_outbox set state='cancelled',error_code=suppression,processed_at=now() where id=m.id;
    return jsonb_build_object('state','cancelled','reason',suppression);
  end if;
  -- One live delivery per person, and at most one accepted mail in any 24 hours.
  if exists(select 1 from science_outbox where user_id=owner and kind='mail' and id<>m.id and state='processing') then return jsonb_build_object('state','recipient_busy'); end if;
  if exists(select 1 from science_outbox where user_id=owner and kind='mail' and state='accepted' and processed_at>now()-interval '24 hours') then
    update science_outbox set available_at=(select max(processed_at)+interval '24 hours' from science_outbox where user_id=owner and kind='mail' and state='accepted') where id=m.id;
    return jsonb_build_object('state','deferred');
  end if;
  update science_outbox set state='processing',delivery_token=p_token,locked_at=now(),attempts=attempts+1,error_code=null,delivery_authorized_at=null where id=m.id;
  recipient:=science_private.mail_recipient(m.id,p_token);
  if recipient is null then
    update science_outbox set state='cancelled',error_code='missing_recipient',processed_at=now() where id=m.id;
    return jsonb_build_object('state','cancelled');
  end if;
  update science_outbox set recipient_sha256=encode(sha256(convert_to(lower(recipient),'UTF8')),'hex') where id=m.id;
  insert into science_mail_unsubscribe_tokens(token_hash,user_id) values(p_unsubscribe_hash,owner) on conflict do nothing;
  if not exists(select 1 from science_mail_unsubscribe_tokens where token_hash=p_unsubscribe_hash and user_id=owner) then raise exception 'token_conflict'; end if;
  select * into profile from science_profiles where user_id=owner;
  select * into active from science_attempts a where a.user_id=owner and a.state='active'
    and (a.kind<>'weekly' or exists(select 1 from science_weekly_sets w where w.id=a.week_id and w.ends_at>now())) order by a.started_at desc limit 1;
  select * into latest from science_attempts where user_id=owner and state='completed' order by completed_at desc limit 1;
  select coalesce(jsonb_agg(distinct kind),'[]'::jsonb) into completed from science_attempts where user_id=owner and state='completed';
  return jsonb_build_object('state','claimed','id',m.id,'userId',owner,'email',recipient,'payload',m.payload,
    'nickname',coalesce(profile.nickname,'科学好き'),'interests',coalesce(profile.interests,'{}'),
    'active',case when active.id is null then null else jsonb_build_object('id',active.id,'label',active.definition->>'label') end,
    'latestResult',latest.id,'completedKinds',completed);
end $$;

create function science_authorize_mail(p_message uuid,p_token uuid,p_content_hash text) returns boolean
language plpgsql set search_path=public as $$
declare m science_outbox; owner uuid; suppression text;
begin
  if p_content_hash is null or p_content_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_content_hash'; end if;
  select user_id into owner from science_outbox where id=p_message and kind='mail';
  if owner is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||owner,0));
  select * into m from science_outbox where id=p_message for update;
  if m.state<>'processing' or m.delivery_token is distinct from p_token or m.delivery_authorized_at is not null or m.locked_at<now()-interval '2 minutes' then return false; end if;
  suppression:=science_mail_suppression(m.id);
  if not coalesce((select (value->>'mailDelivery')::boolean and (value->>'newAttempts')::boolean from science_config where key='release'),false) then suppression:='delivery_disabled'; end if;
  if suppression is null and m.recipient_sha256 is distinct from encode(sha256(convert_to(lower(science_private.mail_recipient(m.id,p_token)),'UTF8')),'hex') then suppression:='email_changed'; end if;
  if suppression is not null then
    update science_outbox set state='cancelled',error_code=suppression,processed_at=now() where id=m.id;
    return false;
  end if;
  update science_outbox set delivery_authorized_at=now(),content_sha256=p_content_hash where id=m.id;
  return true;
end $$;

create function science_finish_mail(p_message uuid,p_token uuid,p_outcome text,p_provider_id text default null,p_error_code text default null) returns boolean
language plpgsql set search_path=public as $$
declare m science_outbox;
begin
  if p_outcome is null or p_outcome not in ('accepted','retryable','blocked') or length(coalesce(p_provider_id,''))>200 or coalesce(p_error_code,'')!~ '^[a-z0-9_]{0,80}$' then raise exception 'invalid_delivery_result'; end if;
  select * into m from science_outbox where id=p_message and kind='mail' for update;
  if not found or m.state<>'processing' or m.delivery_token is distinct from p_token then return false; end if;
  if p_outcome='accepted' and m.delivery_authorized_at is null then raise exception 'mail_not_authorized'; end if;
  update science_outbox set
    state=case when p_outcome='accepted' then 'accepted' when p_outcome='retryable' and m.attempts<3 then 'failed' else 'blocked' end,
    error_code=p_error_code,provider_id=p_provider_id,processed_at=now(),
    available_at=case when p_outcome='retryable' then now()+interval '15 minutes'*power(4,least(m.attempts-1,3)) else available_at end
    where id=m.id;
  return true;
end $$;

create function science_recover_stalled_mail() returns int language plpgsql set search_path=public as $$
declare n int;
begin
  -- SMTP can accept a message just before a process dies. Never blindly replay that message.
  update science_outbox set state=case when delivery_authorized_at is null then 'failed' else 'blocked' end,
    error_code=case when delivery_authorized_at is null then 'interrupted_before_send' else 'delivery_outcome_unknown' end,
    processed_at=now(),available_at=now()
    where kind='mail' and state='processing' and locked_at<now()-interval '5 minutes';
  get diagnostics n=row_count;return n;
end $$;

create function science_unsubscribe_mail(p_token_hash text) returns boolean language plpgsql set search_path=public as $$
declare owner uuid; operation uuid:=gen_random_uuid();
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  select user_id into owner from science_mail_unsubscribe_tokens where token_hash=p_token_hash;
  if owner is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||owner,0));
  insert into science_events(dedupe_key,event_name,user_id,payload)
    select 'oneclick:'||operation||':'||topic,'mail_consent_revoked',owner,jsonb_build_object('topic',topic,'source','mail_unsubscribe') from science_consents where user_id=owner and enabled;
  update science_consents set enabled=false,updated_at=now() where user_id=owner and enabled;
  update marketing_consents set consented=false where user_id=owner and consented;
  update science_outbox set state='cancelled',error_code='consent_revoked',processed_at=now() where user_id=owner and kind='mail' and state in ('pending','failed','blocked');
  -- In-flight delivery checks consent again before its irreversible SMTP step.
  return true;
end $$;

-- Expired leases remain visible as interrupted jobs instead of looking permanently active.
create or replace function science_begin_job(p_kind text) returns uuid language plpgsql set search_path=public as $$
declare job uuid; expired science_job_leases;
begin
  if p_kind is null or length(p_kind) not between 1 and 60 then raise exception 'invalid_job_kind'; end if;
  perform pg_advisory_xact_lock(hashtextextended('job:'||p_kind,0));
  select * into expired from science_job_leases where kind=p_kind;
  if found and expired.expires_at>now() then return null; end if;
  if expired.job_id is not null then update science_jobs set state='interrupted',summary=summary||'{"reason":"lease_expired"}'::jsonb,finished_at=now() where id=expired.job_id and state='running'; end if;
  insert into science_jobs(kind,state,observed_to) values(p_kind,'running',now()) returning id into job;
  insert into science_job_leases(kind,job_id,expires_at) values(p_kind,job,now()+interval '5 minutes') on conflict(kind) do update set job_id=excluded.job_id,expires_at=excluded.expires_at;
  return job;
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname in ('science_queue_weekly_mail','science_mail_suppression','science_claim_mail','science_authorize_mail','science_finish_mail','science_recover_stalled_mail','science_unsubscribe_mail')) or (n.nspname='science_private' and p.proname='mail_recipient') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;

insert into science_migration_history(name,sha256) values('0025_science_mail_delivery.sql','e980fe827e81220e22fda85858190c62b396476dfb7bf247851a93caedcb8f6c');

-- 0026_science_withdrawn_skips.sql
-- A withdrawn item can advance progress without inventing a choice or an error.
alter table science_answers alter column selected_index drop not null;
alter table science_answers alter column is_correct drop not null;
alter table science_answers add column skip_reason text;
alter table science_answers add constraint science_answer_or_withdrawn_skip check((
  (skip_reason is null and selected_index is not null and is_correct is not null)
  or (skip_reason='question_withdrawn' and selected_index is null and is_correct is null)
) is true);

create or replace function science_commit_answer(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_token uuid,p_operation uuid,p_selected int,p_result jsonb default null)
returns science_attempts language plpgsql set search_path=public as $$
declare a science_attempts; issued science_issued; previous science_answers; q science_items; correct boolean; withdrawn boolean;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into previous from science_answers where attempt_id=p_attempt and operation_id=p_operation;
  if found then
    if previous.ordinal is distinct from p_ordinal or previous.selected_index is distinct from p_selected then raise exception 'operation_reused' using errcode='40001'; end if;
    return a;
  end if;
  if a.state<>'active' or a.ordinal is distinct from p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if p_selected is not null and p_selected not between 0 and 3 then raise exception 'invalid_choice'; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal and token=p_token;
  if not found then raise exception 'not_issued' using errcode='P0002'; end if;
  select * into q from science_items where id=issued.revision_id for share;
  select exists(select 1 from science_revision_updates where source_revision=q.id and excluded) into withdrawn;
  if q.status='held' and not exists(select 1 from science_revision_updates where source_revision=q.id) then raise exception 'item_unavailable'; end if;
  if p_selected is null and not withdrawn then raise exception 'item_not_withdrawn'; end if;
  correct := case when p_selected is null then null else (issued.choice_order->>p_selected)::int=(issued.snapshot->'content'->>'correctIndex')::int end;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  if p_ordinal+1=a.total and (p_result is null or coalesce((p_result->>'originalAnswerCount')::int,(p_result->>'answerCount')::int) is distinct from a.total or p_result->>'version' is distinct from a.model_version) then raise exception 'result_required'; end if;
  if p_ordinal+1=a.total and (p_result->>'correctionEpoch')::int is distinct from science_correction_epoch() then raise exception 'result_recalculation_required' using errcode='40001'; end if;
  insert into science_answers(attempt_id,ordinal,operation_id,selected_index,is_correct,skip_reason)
    values(p_attempt,p_ordinal,p_operation,p_selected,correct,case when p_selected is null then 'question_withdrawn' else null end);
  update science_attempts set ordinal=p_ordinal+1,
    state=case when p_ordinal+1=total then 'completed' else 'active' end,
    completed_at=case when p_ordinal+1=total then now() else null end,
    result=case when p_ordinal+1=total then p_result else null end where id=p_attempt returning * into a;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id,payload)
    values('answer:'||p_attempt||':'||p_ordinal,case when p_selected is null then 'question_skipped' else 'answer_committed' end,a.visitor_id,a.user_id,a.id,jsonb_build_object('ordinal',p_ordinal)) on conflict do nothing;
  if a.state='completed' then
    insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id) values('completed:'||a.id,'attempt_completed',a.visitor_id,a.user_id,a.id) on conflict do nothing;
    insert into science_outbox(dedupe_key,user_id,kind,payload) values('completion:'||a.id,a.user_id,'attempt_completed',jsonb_build_object('attemptId',a.id)) on conflict do nothing;
  end if;
  return a;
end $$;
drop function science_commit_answer_before_hold_guard(uuid,uuid,uuid,int,uuid,uuid,int,jsonb);

create or replace function science_issue(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_revision uuid,p_order jsonb,
  p_predicted double precision,p_probability double precision,p_reason text,p_candidates int)
returns science_issued language plpgsql set search_path=public as $$
declare a science_attempts; q science_items; issued science_issued; params science_release_items; known boolean; eligible boolean; withdrawn boolean;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal;
  if found then return issued; end if;
  if a.state<>'active' or a.ordinal is distinct from p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  select * into q from science_items where id=p_revision for share;
  if not found then raise exception 'item_unavailable'; end if;
  withdrawn := a.kind='weekly' and exists(select 1 from science_revision_updates where source_revision=q.id and excluded);
  -- Only an approved withdrawal can yield a placeholder, even after rights/expiry change.
  -- The application hides its original content and requires a NULL choice to skip it.
  if not withdrawn and (not q.rights_checked or (q.status not in ('published','lab') and not (a.kind='weekly' and exists(select 1 from science_revision_updates where source_revision=q.id))) or (q.expires_at is not null and q.expires_at<=now())) then raise exception 'item_unavailable'; end if;
  if a.kind not in ('lab','weekly') and (q.status<>'published' or not q.quality_passed) then raise exception 'item_unavailable'; end if;
  if a.kind='lab' and q.author_id is null then raise exception 'not_a_submission'; end if;
  if a.kind='weekly' then
    if not exists(select 1 from science_weekly_sets w where w.id=a.week_id and w.revision_ids[p_ordinal+1]=p_revision) then raise exception 'wrong_weekly_item'; end if;
  else
    select * into params from science_release_items where release_id=a.release_id and revision_id=p_revision;
    if a.kind<>'lab' and not found then raise exception 'item_not_in_release'; end if;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_user::text,p_visitor::text),0));
  select exists(select 1 from science_exposures e where e.family_id=q.family_id and (e.visitor_id=p_visitor or (p_user is not null and e.user_id=p_user))) or (p_user is not null and q.author_id is not null and q.author_id=p_user) into known;
  if known and a.kind in ('trial','full','domain') then raise exception 'already_seen' using errcode='40001'; end if;
  eligible := a.kind in ('trial','full','domain') and not known;
  if a.kind='weekly' and known then update science_attempts set competitive=false where id=a.id; end if;
  insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible,exclusion_reason)
  values(p_attempt,p_ordinal,q.id,q.family_id,p_order,jsonb_build_object('content',q.content,'domain',q.domain,'subdomain',q.subdomain,'a',coalesce(params.a,1),'b',coalesce(params.b,0),'c',coalesce(params.c,.25),'authorId',q.author_id,'creditName',q.credit_name,'aiAssisted',q.ai_assisted),p_predicted,p_probability,p_reason,p_candidates,eligible,
    case when withdrawn then 'question_withdrawn' when known then 'previously_seen_or_author' when not eligible then a.kind else null end) returning * into issued;
  insert into science_exposures(visitor_id,family_id,user_id,first_attempt_id,reason) values(p_visitor,q.family_id,p_user,p_attempt,a.kind) on conflict(visitor_id,family_id) do nothing;
  return issued;
end $$;

create or replace view science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,
    i.eligible and r.skip_reason is null and not coalesce(c.excluded,false) and x.attempt_id is null eligible,
    case when r.skip_reason is not null then r.skip_reason when c.excluded then 'question_withdrawn' when x.attempt_id is not null then x.reason else i.exclusion_reason end exclusion_reason,
    i.snapshot->>'domain' domain,i.snapshot->>'subdomain' subdomain,
    (i.snapshot->>'a')::double precision a,(i.snapshot->>'b')::double precision b,(i.snapshot->>'c')::double precision c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
  left join science_revision_updates c on c.source_revision=i.revision_id
  left join science_response_exclusions x on x.attempt_id=i.attempt_id and x.ordinal=i.ordinal;

create or replace function science_review_collection(p_user uuid,p_mode text,p_page int)
returns table(revision_id uuid,attempt_id uuid,ordinal int,domain text,content jsonb,is_correct boolean,selected_index int,bookmarked boolean,total bigint)
language sql stable set search_path=public as $$
  with available as (
    select distinct on(i.family_id) i.revision_id,i.attempt_id,i.ordinal,i.snapshot->>'domain' domain,i.snapshot->'content' content,r.is_correct,(i.choice_order->>r.selected_index)::int selected_index,
      (b.user_id is not null) bookmarked,r.answered_at,m.due_at
    from science_issued i join science_answers r using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
    left join science_bookmarks b on b.revision_id=i.revision_id and b.user_id=p_user
    left join science_review_marks m on m.revision_id=i.revision_id and m.user_id=p_user
    where a.user_id=p_user and r.skip_reason is null and (a.state='completed' or a.kind='lab')
    order by i.family_id,r.answered_at desc,i.attempt_id
  ),filtered as (
    select * from available where (p_mode='bookmarks' and bookmarked) or (p_mode='mistakes' and not is_correct and (due_at is null or due_at<=now()))
  )
  select revision_id,attempt_id,ordinal,domain,content,is_correct,selected_index,bookmarked,count(*) over() from filtered order by coalesce(due_at,answered_at),revision_id limit 5 offset greatest(0,least(p_page,10000))*5;
$$;
create or replace function science_mark_review(p_user uuid,p_revision uuid,p_remembered boolean,p_operation uuid)
returns boolean language plpgsql set search_path=public as $$
declare n int; previous science_review_marks;
begin
  if not exists(select 1 from science_issued i join science_answers r using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id where a.user_id=p_user and i.revision_id=p_revision and r.skip_reason is null and (a.state='completed' or a.kind='lab')) then raise exception 'not_found' using errcode='P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user||':'||p_revision,0));
  select * into previous from science_review_marks where user_id=p_user and revision_id=p_revision for update;
  if previous.operation_id=p_operation then return true; end if;
  n:=case when p_remembered then least(5,coalesce(previous.streak,0)+1) else 0 end;
  insert into science_review_marks(user_id,revision_id,streak,reviewed_at,due_at,operation_id)
    values(p_user,p_revision,n,now(),now()+make_interval(days=>(array[1,3,7,14,30,60])[n+1]),p_operation)
    on conflict(user_id,revision_id) do update set streak=excluded.streak,reviewed_at=excluded.reviewed_at,due_at=excluded.due_at,operation_id=excluded.operation_id;
  return true;
end $$;
revoke all on function science_commit_answer(uuid,uuid,uuid,int,uuid,uuid,int,jsonb),science_issue(uuid,uuid,uuid,int,uuid,jsonb,double precision,double precision,text,int),science_review_collection(uuid,text,int),science_mark_review(uuid,uuid,boolean,uuid) from public,anon,authenticated;
grant execute on function science_commit_answer(uuid,uuid,uuid,int,uuid,uuid,int,jsonb),science_issue(uuid,uuid,uuid,int,uuid,jsonb,double precision,double precision,text,int),science_review_collection(uuid,text,int),science_mark_review(uuid,uuid,boolean,uuid) to service_role;

insert into science_migration_history(name,sha256) values('0026_science_withdrawn_skips.sql','6694f2ce218dc69269cd64a09ded84da4b1847397e12b6ebe42a898367616a02');

-- 0027_science_calibration_campaign.sql
create or replace function science_apply_calibration(p_parent uuid,p_candidates uuid[],p_job uuid)
returns uuid language plpgsql set search_path=public as $$
declare r uuid;parent science_releases;fit_candidate science_calibration_candidates;epoch int;
begin
  -- Corrections must not change the eligible response set during publication.
  perform 1 from science_config where key='correction_epoch' for share;
  epoch:=science_correction_epoch();
  perform pg_advisory_xact_lock(hashtextextended('science-active-release',0));
  select * into parent from science_releases where id=p_parent and state='active';
  if not found or coalesce(cardinality(p_candidates),0)<1 then raise exception 'stale_calibration'; end if;
  if not exists(select 1 from science_jobs where id=p_job and state='running') then raise exception 'job_required'; end if;
  if not coalesce((select (value->>'automaticCalibration')::boolean from science_config where key='release'),false) then raise exception 'automatic_calibration_disabled'; end if;
  if (select count(*)=cardinality(p_candidates) and count(distinct revision_id)=cardinality(p_candidates)
      from science_calibration_candidates where id=any(p_candidates) and release_id=p_parent and state='qualified'
        and (fit->>'eligible')::boolean and (fit->>'correctionEpoch')::int=epoch) is not true then raise exception 'validation_required'; end if;
  insert into science_releases(name,model_version,settings,validation)
    values('Difficulty calibration '||current_date,parent.model_version,parent.settings||jsonb_build_object('parentRelease',p_parent),jsonb_build_object('automaticBUpdate','passed','jobId',p_job,'candidates',p_candidates,'correctionEpoch',epoch)) returning id into r;
  insert into science_release_items(release_id,revision_id,a,b,c,focus,anchor,parameter_evidence)
    select r,revision_id,a,b,c,focus,anchor,parameter_evidence from science_release_items where release_id=p_parent;
  for fit_candidate in select * from science_calibration_candidates where id=any(p_candidates) loop
    if not exists(select 1 from science_release_items ri join science_items q on q.id=ri.revision_id
      where ri.release_id=r and ri.revision_id=fit_candidate.revision_id and ri.focus and not ri.anchor
        and q.status='published' and q.quality_passed and q.rights_checked and (q.expires_at is null or q.expires_at>now())
        and ri.b=(fit_candidate.fit->>'oldB')::float8 and abs(ri.b-(fit_candidate.fit->>'b')::float8)<=.500001
        and ri.a=(fit_candidate.fit->>'a')::float8 and ri.c=(fit_candidate.fit->>'c')::float8) then raise exception 'parameter_guard_failed'; end if;
    update science_release_items set b=(fit_candidate.fit->>'b')::float8,focus=false,parameter_evidence=fit_candidate.fit||jsonb_build_object('candidateId',fit_candidate.id)
      where release_id=r and revision_id=fit_candidate.revision_id;
  end loop;
  -- Preserve each domain's focus count; anchors and unavailable items are not replacements.
  with slots as (select q.domain,count(*) n from science_calibration_candidates c join science_items q on q.id=c.revision_id where c.id=any(p_candidates) group by q.domain),
  ranked as (select ri.revision_id,row_number() over(partition by q.domain order by coalesce((ri.parameter_evidence->>'count')::int,0),q.id) rank,s.n
    from science_release_items ri join science_items q on q.id=ri.revision_id join slots s on s.domain=q.domain
    where ri.release_id=r and not ri.anchor and not ri.focus and q.status='published' and q.quality_passed and q.rights_checked and (q.expires_at is null or q.expires_at>now())
      and ri.revision_id not in (select revision_id from science_calibration_candidates where id=any(p_candidates)))
  update science_release_items set focus=true where release_id=r and revision_id in (select revision_id from ranked where rank<=n);
  perform science_activate_release(r,null,'Held-out difficulty prediction, coverage and score-change guards passed');
  update science_calibration_candidates set state='applied' where id=any(p_candidates);
  return r;
end $$;
revoke all on function science_apply_calibration(uuid,uuid[],uuid) from public,anon,authenticated;
grant execute on function science_apply_calibration(uuid,uuid[],uuid) to service_role;

insert into science_migration_history(name,sha256) values('0027_science_calibration_campaign.sql','0ad611c957028a71a620552bcd9e1a3dbf60b39a87ff092591a2b485b1d58389');

-- 0028_science_case_sensitive_choices.sql
-- Letter case distinguishes scientific symbols. Normalize width, not case.
-- Keep old migration files immutable; existing question versions are not rewritten.
create or replace function science_valid_content(value jsonb)
returns boolean language sql immutable as $$
  select case when jsonb_typeof(value)='object' and jsonb_typeof(value->'choices')='array' then
    coalesce(jsonb_array_length(value->'choices')=4
      and jsonb_typeof(value->'question')='string' and length(trim(value->>'question'))>0
      and jsonb_typeof(value->'explanation')='string' and length(trim(value->>'explanation'))>0
      and jsonb_typeof(value->'correctIndex')='number' and value->>'correctIndex' in ('0','1','2','3')
      and (select count(*)=4
        and bool_and(jsonb_typeof(choice)='string')
        and count(distinct (trim(normalize(choice#>>'{}',NFKC)) collate "C"))=4
        and min(length(trim(normalize(choice#>>'{}',NFKC))))>0
        from jsonb_array_elements(value->'choices') as t(choice)),false)
    else false end;
$$;
revoke all on function science_valid_content(jsonb) from public,anon,authenticated;
grant execute on function science_valid_content(jsonb) to service_role;

insert into science_migration_history(name,sha256) values('0028_science_case_sensitive_choices.sql','4802c0bfede49627960bf1de5a8bad58cec78d1adab5392c3e05591f11a1d644');
commit;
select name,sha256,applied_at from science_migration_history order by name;
