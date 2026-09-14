begin;
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
commit;
