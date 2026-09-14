begin;
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
commit;
