begin;
create function public.science_rankings(p_kind text,p_start timestamptz,p_end timestamptz,p_length int,p_model text,p_week text default null)
returns table(place bigint,nickname text,profile_id uuid,share_id uuid,score numeric,exam_length int,effective_length int)
language sql stable set search_path=public as $$
  with eligible as (
    select a.*,row_number() over(partition by a.user_id order by a.completed_at,a.id) as attempt_order
    from science_attempts a
    where a.kind=p_kind and a.state='completed' and a.competitive and a.user_id is not null
      and a.completed_at>=p_start and a.completed_at<p_end and a.total=p_length
      and a.model_version=p_model and (p_kind<>'weekly' or a.week_id=p_week)
  ), visible as (
    select p.nickname,case when p.is_public then p.public_id else null end as profile_id,s.id as share_id,
      case when p_kind='weekly' then (a.result->>'correctCount')::numeric else (a.result->>'total')::numeric end as score,a.total,coalesce((a.result->>'answerCount')::int,a.total) effective_length
    from eligible a join science_profiles p on p.user_id=a.user_id and p.ranking_opt_in
      left join science_shares s on s.attempt_id=a.id and s.enabled
    where a.attempt_order=1 and not a.needs_recalculation
  )
  select rank() over(order by visible.score desc) as place,visible.nickname,visible.profile_id,visible.share_id,visible.score,visible.total,visible.effective_length
  from visible where visible.score is not null and visible.effective_length>0 order by visible.score desc,visible.nickname,visible.profile_id limit 100;
$$;
revoke all on function public.science_rankings(text,timestamptz,timestamptz,int,text,text) from public,anon,authenticated;
grant execute on function public.science_rankings(text,timestamptz,timestamptz,int,text,text) to service_role;
commit;
