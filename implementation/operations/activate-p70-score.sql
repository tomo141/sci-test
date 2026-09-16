-- Execute only after the compatible application passes checks and is Ready on production.
-- This copies frozen parameters; it does not recalibrate questions, rewrite results, or send mail.
begin;
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('science-active-release',0));
do $score_cutover$
declare previous_id uuid:='c3370bed-460e-4e40-af4f-7a7e13565c77'; next_id uuid; operator_id uuid; parent science_releases;
begin
  if not exists(select 1 from science_migration_history where name='0032_science_measurement_version.sql' and sha256='03ef2a3a4fe31785d7add50d53821b7da33b1f5a5000ad32b936fb96c2f1f0b4') then raise exception 'measurement_migration_not_verified'; end if;
  select * into parent from science_releases where id=previous_id and state='active' and model_version='science-3pl-reference-v1' for update;
  if not found then raise exception 'unexpected_active_release'; end if;
  if exists(select 1 from science_releases where model_version='science-3pl-p70-linear-v2') then raise exception 'p70_release_already_exists'; end if;
  select a.user_id into strict operator_id from science_admins a join auth.users u on u.id=a.user_id where lower(u.email)='tomoyoshi@rikei-talk.com' and u.email_confirmed_at is not null;
  if (select count(*) from science_release_items where release_id=previous_id)<>1000 then raise exception 'unexpected_bank_count'; end if;
  if coalesce((select (value->>'mailDelivery')::boolean from science_config where key='release'),false) then raise exception 'mail_delivery_changed'; end if;
  insert into science_releases(name,model_version,settings,validation)
    values('70 percent reference score 2026-09-16','science-3pl-p70-linear-v2',
      (parent.settings-'importManifest'-'expectedRevisions')||jsonb_build_object('parentRelease',previous_id,'parameterCoordinate','same-as-reference-v1','displayCenter',500,'displayPointsPerTheta',200,'difficultyProbability',0.70,'priorSd',2,'gridMin',-10,'gridMax',10),
      jsonb_build_object('contentReview','inherited_without_content_changes','parameterCopy','unchanged','endpointReachability','50_and_100_verified_offline','empiricalCalibration','not_performed','populationNorms','not_established','approval','User adopted 70 percent correspondence and endpoint repair on 2026-09-16')) returning id into next_id;
  insert into science_release_items(release_id,revision_id,a,b,c,anchor,focus,parameter_evidence)
    select next_id,revision_id,a,b,c,anchor,focus,parameter_evidence||jsonb_build_object('scoreModelChange','display_and_prior_only','previousRelease',previous_id)
    from science_release_items where release_id=previous_id;
  if exists(select revision_id,a,b,c,anchor,focus from science_release_items where release_id=previous_id except select revision_id,a,b,c,anchor,focus from science_release_items where release_id=next_id)
     or exists(select revision_id,a,b,c,anchor,focus from science_release_items where release_id=next_id except select revision_id,a,b,c,anchor,focus from science_release_items where release_id=previous_id) then raise exception 'parameter_copy_mismatch'; end if;
  perform science_activate_release(next_id,operator_id,'Adopt approved 70 percent score correspondence with validated 10–990 display reachability; preserve previous attempts and results');
end $score_cutover$;
commit;
select model_version,state,(select count(*) from science_release_items where release_id=r.id) as item_count from science_releases r order by created_at;
