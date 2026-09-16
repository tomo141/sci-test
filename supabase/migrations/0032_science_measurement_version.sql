begin;
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
commit;
