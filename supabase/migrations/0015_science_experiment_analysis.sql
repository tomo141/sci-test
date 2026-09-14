begin;
create function science_experiment_results(p_from timestamptz,p_to timestamptz,p_experiment text)
returns table(route_group text,starters bigint,mature_starters bigint,verified_7d bigint,registrations_7d bigint,share_registrations_7d bigint,completions_7d bigint,shared_7d bigint,withdrawn bigint,mixed_assignment bigint)
language sql stable set search_path=public as $$
  with first_trial as (
    select distinct on(case when a.user_id is null then 'visitor:'||a.visitor_id else 'user:'||a.user_id end)
      a.id,a.visitor_id,a.user_id,a.started_at,v.ref_share,e.payload->>'group' grp
    from science_attempts a join science_visitors v on v.id=a.visitor_id
    join science_events e on e.dedupe_key='started:'||a.id
    left join science_profiles p on p.user_id=a.user_id
    where a.kind='trial' and v.experiment=p_experiment and (p.user_id is null or p.created_at>a.started_at)
    order by case when a.user_id is null then 'visitor:'||a.visitor_id else 'user:'||a.user_id end,a.started_at,a.id
  ),cohort as (
    select f.*,f.started_at<=now()-interval '7 days' mature,
      exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='email_verified' and e.created_at between f.started_at and f.started_at+interval '7 days') verified,
      coalesce((select e.event_name='mail_consent_granted' from science_events e where e.user_id=f.user_id and e.event_name in ('mail_consent_granted','mail_consent_revoked') and e.payload->>'topic'='science' and e.created_at<=f.started_at+interval '7 days' order by e.created_at desc,e.id desc limit 1),false) consented,
      exists(select 1 from science_events e where e.attempt_id=f.id and e.event_name='attempt_completed' and e.created_at<=f.started_at+interval '7 days') completed,
      exists(select 1 from science_events e where e.attempt_id=f.id and e.event_name='share_created' and e.created_at<=f.started_at+interval '7 days') shared,
      exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='mail_consent_revoked' and e.payload->>'topic'='science') withdrawn,
      exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='assignment_merged' and e.payload->>'originalGroup' is distinct from e.payload->>'canonicalGroup') mixed,
      exists(select 1 from science_shares s join science_attempts a on a.id=s.attempt_id where s.id=f.ref_share and a.user_id is distinct from f.user_id) referred
    from first_trial f where f.started_at>=p_from and f.started_at<p_to
  )
  select g.grp,count(c.id),count(c.id) filter(where mature),count(c.id) filter(where mature and verified),
    count(c.id) filter(where mature and verified and consented),count(c.id) filter(where mature and verified and consented and referred),
    count(c.id) filter(where mature and completed),count(c.id) filter(where mature and shared),count(c.id) filter(where withdrawn),count(c.id) filter(where mixed)
  from (values('A'),('B'),('C'),('D')) g(grp) left join cohort c on c.grp=g.grp group by g.grp order by g.grp;
$$;
revoke all on function science_experiment_results(timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function science_experiment_results(timestamptz,timestamptz,text) to service_role;
commit;
