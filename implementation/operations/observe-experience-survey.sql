-- Read-only, aggregate-only. No comments or participant identifiers are returned.
-- The denominator is submitted surveys, not all examinees. Do not treat voluntary
-- respondents as a representative sample or use these ratings to update item b.
with reports as (
  select e.attempt_id, e.created_at, e.payload->'response' response, e.payload->'context' context
  from science_events e
  where e.event_name='exam_experience_submitted'
    and e.payload->'response'->>'version'='exam-experience-v1'
    and e.created_at>=now()-interval '28 days'
), prediction as (
  select r.attempt_id, count(*) predicted_answers, avg(i.predicted) mean_predicted,
    avg(a.is_correct::int) observed_correct_rate, avg(i.is_repeat::int) repeat_fraction
  from reports r join science_issued i on i.attempt_id=r.attempt_id
  join science_answers a on a.attempt_id=i.attempt_id and a.ordinal=i.ordinal
  where a.selected_index is not null and i.predicted is not null
  group by r.attempt_id
)
select r.context->>'kind' kind, (r.context->>'questionCount')::int question_count,
  r.context->>'definitionVersion' definition_version, r.context->>'selectionPolicy' selection_policy,
  r.context->>'releaseId' release_id, r.context->>'modelVersion' model_version,
  count(*) submitted_surveys,
  count(*) filter(where r.response->>'difficulty' in ('hard','very_hard')) difficult_ratings,
  count(*) filter(where r.response->>'difficulty' in ('easy','very_easy')) easy_ratings,
  count(*) filter(where r.response->>'tempo' in ('some_wait','much_wait')) wait_ratings,
  count(*) filter(where r.response->>'tempo'='unsure') tempo_unknown,
  sum((r.context->>'correctCount')::numeric)/nullif(sum((r.context->>'answerCount')::numeric),0) observed_correct_rate,
  count(*) filter(where r.context->>'low' is not null and r.context->>'high' is not null) precision_samples,
  avg((r.context->>'high')::numeric-(r.context->>'low')::numeric) mean_interval_width,
  sum(p.predicted_answers) predicted_answer_count,
  sum(p.predicted_answers*p.mean_predicted)/nullif(sum(p.predicted_answers),0) mean_predicted,
  sum(p.predicted_answers*(p.observed_correct_rate-p.mean_predicted))/nullif(sum(p.predicted_answers),0) prediction_residual,
  sum(p.predicted_answers*p.repeat_fraction)/nullif(sum(p.predicted_answers),0) repeat_fraction
from reports r left join prediction p on p.attempt_id=r.attempt_id
group by r.context->>'kind',r.context->>'questionCount',r.context->>'definitionVersion',
  r.context->>'selectionPolicy',r.context->>'releaseId',r.context->>'modelVersion'
order by kind,question_count,selection_policy,release_id;
