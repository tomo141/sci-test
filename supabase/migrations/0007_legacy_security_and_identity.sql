begin;

-- Keep every legacy row. The new application uses explicit server projections for private data.
revoke all on all tables in schema public from anon, authenticated, public;
revoke all on all sequences in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables from anon, authenticated, public;
alter default privileges in schema public revoke all on sequences from anon, authenticated, public;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from science_admins where user_id=auth.uid());
$$;
revoke all on function public.is_admin() from public,anon,authenticated;
grant execute on function public.is_admin() to service_role;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,nickname,role)
    values(new.id,coalesce(new.email,''),left(nullif(new.raw_user_meta_data->>'nickname',''),30),'user') on conflict(id) do nothing;
  insert into marketing_consents(user_id,consented) values(new.id,false) on conflict(user_id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;

insert into science_profiles(user_id,nickname)
  select id,coalesce(nullif(left(nickname,30),''),'科学好き') from profiles on conflict(user_id) do nothing;
insert into science_entitlements(user_id,acquired_at,source)
  select user_id,training_unlocked_at,'legacy_training_right' from marketing_consents where training_unlocked_at is not null
  on conflict(user_id) do nothing;
insert into science_consents(user_id,topic,enabled,version,updated_at)
  select user_id,'science',consented,'legacy-consent',coalesce(consented_at,created_at) from marketing_consents
  on conflict(user_id,topic) do nothing;

-- Never copy the old editable profiles.role into trusted administration rights.
-- Operator provisioning is a separate, audited bootstrap using the existing verified allowlist.
commit;
