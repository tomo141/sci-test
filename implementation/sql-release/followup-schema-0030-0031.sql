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
if exists(select 1 from science_migration_history where name='0030_science_license_publication_basis.sql') then raise exception 'migration_already_recorded: 0030_science_license_publication_basis.sql'; end if;
if exists(select 1 from science_migration_history where name='0031_science_repeat_fallback.sql') then raise exception 'migration_already_recorded: 0031_science_repeat_fallback.sql'; end if;
end $migration_guard$;
-- 0030_science_license_publication_basis.sql
-- The operator adopted the full terms on 2026-09-16 without an external legal review.
-- Preserve that distinction instead of putting an operator decision into legal_review_ref.
alter table science_license_versions add column publication_basis text not null default 'external_review'
  check (publication_basis in ('external_review','operator_acceptance'));
alter table science_license_versions add column operator_approval_ref text;
do $$
declare guard_name text; guard_count int;
begin
  select count(*),min(conname) into guard_count,guard_name from pg_constraint
    where conrelid='science_license_versions'::regclass and contype='c'
      and pg_get_constraintdef(oid) like '%legal_review_ref%';
  if guard_count<>1 then raise exception 'license_publication_guard_not_identified'; end if;
  execute format('alter table science_license_versions drop constraint %I',guard_name);
end $$;
alter table science_license_versions add constraint science_license_publication_approved check (
  published_at is null or (
    operator_approved_at is not null and (
      (publication_basis='external_review' and coalesce(length(trim(legal_review_ref)),0)>=5)
      or (publication_basis='operator_acceptance' and coalesce(length(trim(operator_approval_ref)),0)>=5 and legal_review_ref is null)
    )
  )
);

insert into science_migration_history(name,sha256) values('0030_science_license_publication_basis.sql','22d427d3ba4f99287b8f995e55bdc6107a68ca2aa14e8fda02b1f123794804d0');

-- 0031_science_repeat_fallback.sql
-- Explicit owner decision: repeat only when unseen inventory runs out; include repeats in the attempt score.
alter table science_issued add column is_repeat boolean not null default false;
alter table science_issued add column prior_presentation_count int not null default 0 check(prior_presentation_count>=0);
create function science_exposure_history(p_visitor uuid,p_user uuid)
returns table(family_id text,presentation_count int) language sql stable set search_path=public as $$
  with seen as (
    select e.family_id from science_exposures e where e.visitor_id=p_visitor or (p_user is not null and e.user_id=p_user)
  ), presented as (
    select i.family_id,count(*)::int n from science_issued i join science_attempts a on a.id=i.attempt_id
    where a.visitor_id=p_visitor or (p_user is not null and a.user_id=p_user) group by i.family_id
  )
  select coalesce(s.family_id,p.family_id),greatest(1,coalesce(p.n,0)) from (select distinct family_id from seen) s full join presented p using(family_id);
$$;
create or replace function science_issue(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_revision uuid,p_order jsonb,
  p_predicted double precision,p_probability double precision,p_reason text,p_candidates int)
returns science_issued language plpgsql set search_path=public as $$
declare a science_attempts; q science_items; issued science_issued; params science_release_items; known boolean; eligible boolean; withdrawn boolean; previous_count int;
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
  if a.kind<>'weekly' and exists(select 1 from science_issued where attempt_id=p_attempt and family_id=q.family_id) then raise exception 'same_attempt_repeat' using errcode='40001'; end if;
  if a.kind in ('trial','full','domain') and p_user is not null and q.author_id=p_user then raise exception 'already_seen' using errcode='40001'; end if;
  if known and a.kind in ('trial','full','domain') then
    if p_reason not like 'repeat-fallback-v1:%' then raise exception 'already_seen' using errcode='40001'; end if;
    if exists(
      select 1 from science_release_items ri join science_items fresh on fresh.id=ri.revision_id
      where ri.release_id=a.release_id and fresh.domain=q.domain and fresh.status='published' and fresh.quality_passed and fresh.rights_checked
        and (fresh.expires_at is null or fresh.expires_at>now()) and (fresh.author_id is null or fresh.author_id is distinct from p_user)
        and not exists(select 1 from science_exposures e where e.family_id=fresh.family_id and (e.visitor_id=p_visitor or (p_user is not null and e.user_id=p_user)))
        and not exists(select 1 from science_issued present where present.attempt_id=p_attempt and present.family_id=fresh.family_id)
    ) then raise exception 'unseen_item_available' using errcode='40001'; end if;
  end if;
  select greatest(case when known then 1 else 0 end,count(*)::int) into previous_count
    from science_issued i join science_attempts previous on previous.id=i.attempt_id
    where i.family_id=q.family_id and (previous.visitor_id=p_visitor or (p_user is not null and previous.user_id=p_user));
  eligible := a.kind in ('trial','full','domain');
  if a.kind='weekly' and known then update science_attempts set competitive=false where id=a.id; end if;
  insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible,exclusion_reason,is_repeat,prior_presentation_count)
  values(p_attempt,p_ordinal,q.id,q.family_id,p_order,jsonb_build_object('content',q.content,'domain',q.domain,'subdomain',q.subdomain,'a',coalesce(params.a,1),'b',coalesce(params.b,0),'c',coalesce(params.c,.25),'authorId',q.author_id,'creditName',q.credit_name,'aiAssisted',q.ai_assisted),p_predicted,p_probability,p_reason,p_candidates,eligible,
    case when withdrawn then 'question_withdrawn' when known and not eligible then 'previously_seen_or_author' when not eligible then a.kind else null end,known,previous_count) returning * into issued;
  insert into science_exposures(visitor_id,family_id,user_id,first_attempt_id,reason) values(p_visitor,q.family_id,p_user,p_attempt,a.kind) on conflict(visitor_id,family_id) do nothing;
  return issued;
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
      where a.user_id=p_user and not i.is_repeat and i.exclusion_reason is distinct from 'previously_seen_or_author' and exists(
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


-- Public scores include the repeat. Item calibration and first-exposure quality statistics do not.
create view science_calibration_responses with(security_invoker=true) as
  select v.* from science_responses v join science_issued i using(attempt_id,ordinal) where not i.is_repeat;
create or replace view science_quality_responses with(security_invoker=true) as
  select v.*, (i.choice_order->>r.selected_index)::int canonical_choice,
    (not i.is_repeat and (v.eligible or v.exclusion_reason in ('lab','weekly'))) quality_eligible
  from science_responses v join science_answers r using(attempt_id,ordinal) join science_issued i using(attempt_id,ordinal);
create view science_repeat_alerts with(security_invoker=true) as
  select i.attempt_id,a.kind,count(*)::int repeat_count,
    (select count(*)::int from science_issued all_items where all_items.attempt_id=i.attempt_id) presented_count,
    max(i.issued_at) last_repeat_at,string_agg(distinct i.snapshot->>'domain',' / ' order by i.snapshot->>'domain') domains,
    max(i.prior_presentation_count)+1 max_presentation_count
  from science_issued i join science_attempts a on a.id=i.attempt_id
  where i.is_repeat and i.selection_reason like 'repeat-fallback-v1:%'
  group by i.attempt_id,a.kind;
revoke all on science_calibration_responses,science_repeat_alerts from public,anon,authenticated;
grant select on science_calibration_responses,science_repeat_alerts to service_role;
revoke all on function science_exposure_history(uuid,uuid) from public,anon,authenticated;
grant execute on function science_exposure_history(uuid,uuid) to service_role;

insert into science_migration_history(name,sha256) values('0031_science_repeat_fallback.sql','1eacf51a2bc5e7dc632f97ea6c713245789dcb28b3363b7b8e6b63465418524f');
commit;
select name,sha256,applied_at from science_migration_history order by name;
