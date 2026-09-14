begin;
create view public.science_personal_bests with(security_invoker=true) as
  select * from (
    select id,kind,domain,total,model_version,started_at,result,
      case when user_id is not null then 'user:'||user_id else 'visitor:'||visitor_id end as owner_key,
      row_number() over(partition by case when user_id is not null then 'user:'||user_id else 'visitor:'||visitor_id end,kind,coalesce(domain,''),total,model_version
        order by coalesce((result->>'total')::numeric,(result->'domains'->domain->>'score')::numeric) desc nulls last,completed_at,id) as best_order
    from science_attempts where state='completed' and not needs_recalculation and kind in ('trial','full','domain')
  ) ranked where best_order=1;
revoke all on table public.science_personal_bests from public,anon,authenticated;
grant select on table public.science_personal_bests to service_role;

create function public.science_award_badges(p_user uuid)
returns void language plpgsql set search_path=public as $$
begin
  if (select count(distinct domain) from science_responses where user_id=p_user and eligible)>=10 then
    insert into science_badges(user_id,code,evidence) values(p_user,'ten-domains','{"rule":"eligible answers in ten domains"}') on conflict do nothing;
  end if;
  if exists(select 1 from science_attempts where user_id=p_user and kind='full' and state='completed') then
    insert into science_badges(user_id,code,evidence) values(p_user,'first-full','{"rule":"completed full exam"}') on conflict do nothing;
  end if;
  if (select count(distinct week_id) from science_attempts where user_id=p_user and kind='weekly' and state='completed')>=3 then
    insert into science_badges(user_id,code,evidence) values(p_user,'weekly-three','{"rule":"completed in three distinct weeks"}') on conflict do nothing;
  end if;
  if (select count(distinct family_id) from science_responses where user_id=p_user and kind='lab')>=20 then
    insert into science_badges(user_id,code,evidence) values(p_user,'lab-explorer','{"rule":"answered twenty distinct lab families; participation only"}') on conflict do nothing;
  end if;
  if exists(select 1 from science_feedback where user_id=p_user and state='accepted' and resolved_by<>p_user and category<>'good') then
    insert into science_badges(user_id,code,evidence) values(p_user,'improvement','{"rule":"independently accepted improvement"}') on conflict do nothing;
  end if;
end $$;
revoke all on function public.science_award_badges(uuid) from public,anon,authenticated;
grant execute on function public.science_award_badges(uuid) to service_role;
commit;
