-- Read-only operator report. No customer identifiers, email addresses or free text are returned.
-- This is observational, not a randomized test of selection policies. Keep the existing A–D
-- route assignment, bank release and score model separate; do not infer a causal winner.
-- Rates below use only first-time starters whose full 7-day observation window has elapsed.
with settings as (
  select now()-interval '28 days' starts_from, now() observed_at
), first_trial as (
  select distinct on (case when a.user_id is null then 'visitor:'||a.visitor_id else 'user:'||a.user_id end)
    a.*, coalesce(a.definition->>'selectionPolicy','measurement-v1') policy,
    coalesce(e.payload->>'group',v.route_group) route_group
  from science_attempts a
  join science_visitors v on v.id=a.visitor_id
  left join science_profiles p on p.user_id=a.user_id
  left join science_events e on e.dedupe_key='started:'||a.id
  where a.kind='trial' and (p.user_id is null or p.created_at>a.started_at)
  order by case when a.user_id is null then 'visitor:'||a.visitor_id else 'user:'||a.user_id end,a.started_at,a.id
), cohort as (
  select f.*, f.started_at<=s.observed_at-interval '7 days' mature,
    f.state='completed' and f.completed_at<=f.started_at+interval '7 days' completed,
    exists(select 1 from science_attempts n where n.id<>f.id and
      (n.visitor_id=f.visitor_id or (f.user_id is not null and n.user_id=f.user_id))
      and n.kind in ('full','domain') and n.started_at>f.started_at
      and n.started_at<=f.started_at+interval '7 days') next_exam,
    exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='email_verified'
      and e.created_at between f.started_at and f.started_at+interval '7 days') verified,
    coalesce((select e.event_name='mail_consent_granted' from science_events e where e.user_id=f.user_id
      and e.event_name in ('mail_consent_granted','mail_consent_revoked') and e.payload->>'topic'='science'
      and e.created_at<=f.started_at+interval '7 days' order by e.created_at desc,e.id desc limit 1),false) consented,
    case when f.policy='trial-fluency-v1' then exists(select 1 from science_events e where
      (e.visitor_id=f.visitor_id or (f.user_id is not null and e.user_id=f.user_id)) and e.event_name='site_visit'
      and e.created_at>=f.started_at+interval '24 hours' and e.created_at<=f.started_at+interval '7 days') end revisited
  from first_trial f cross join settings s
  where f.started_at>=s.starts_from and f.started_at<s.observed_at
), measurement as (
  select c.id, count(*) answered, avg(i.predicted) mean_predicted,
    avg((i.predicted between .75 and .85)::int) target_fraction,
    avg((i.selection_reason like '%nearest-probability-fallback%')::int) range_fallback_fraction,
    avg(i.is_repeat::int) repeat_fraction
  from cohort c join science_issued i on i.attempt_id=c.id
  join science_answers a on a.attempt_id=i.attempt_id and a.ordinal=i.ordinal
  where a.selected_index is not null and a.answered_at<=c.started_at+interval '7 days'
  group by c.id
)
select c.policy,c.route_group,c.release_id,c.model_version,
  count(*) starters,count(*) filter(where c.mature) mature_starters,
  count(*) filter(where c.mature and c.completed) completions_7d,
  count(*) filter(where c.mature and c.next_exam) next_exams_7d,
  count(*) filter(where c.mature and c.verified) verified_7d,
  count(*) filter(where c.mature and c.verified and c.consented) registrations_7d,
  case when c.policy='trial-fluency-v1' then count(*) filter(where c.mature and c.revisited) end revisits_7d,
  count(*) filter(where c.mature and c.completed and not c.needs_recalculation and c.result->>'low' is not null and c.result->>'high' is not null) precision_sample,
  avg((c.result->>'high')::numeric-(c.result->>'low')::numeric)
    filter(where c.mature and c.completed and not c.needs_recalculation) mean_total_interval_width,
  sum(m.answered) filter(where c.mature) measured_answers,
  sum(m.mean_predicted*m.answered) filter(where c.mature)/nullif(sum(m.answered) filter(where c.mature),0) mean_predicted,
  sum(m.target_fraction*m.answered) filter(where c.mature)/nullif(sum(m.answered) filter(where c.mature),0) target_fraction,
  sum(m.range_fallback_fraction*m.answered) filter(where c.mature)/nullif(sum(m.answered) filter(where c.mature),0) range_fallback_fraction,
  sum(m.repeat_fraction*m.answered) filter(where c.mature)/nullif(sum(m.answered) filter(where c.mature),0) repeat_fraction
from cohort c left join measurement m on m.id=c.id
group by c.policy,c.route_group,c.release_id,c.model_version
order by c.policy,c.route_group,c.release_id,c.model_version;
