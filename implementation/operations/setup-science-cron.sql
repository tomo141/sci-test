-- One-time production operations setup. Not part of the application migrations.
-- Requires explicit approval for Vault storage and this schedule.
-- Both jobs are created INACTIVE in the same transaction; this sends no requests.
begin;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Hosted pg_net is owned by supabase_admin: postgres cannot revoke its PUBLIC ACL.
-- Before activation, verify-science-job-boundary.mjs must prove the transport,
-- Vault and Cron schemas are excluded from the Data API. Also reject login roles
-- and accessible RPC bridges below. Never treat a no-op REVOKE as protection.

do $preflight$
begin
  if (select count(*) from vault.decrypted_secrets
      where name='science_jobs_cron_secret' and length(decrypted_secret)>=32) <> 1 then
    raise exception 'science_cron_secret_not_configured';
  end if;
  if has_table_privilege('anon','vault.decrypted_secrets','SELECT')
     or has_table_privilege('authenticated','vault.decrypted_secrets','SELECT') then
    raise exception 'science_cron_secret_storage_permissions_require_review';
  end if;
  if exists(select 1 from pg_roles where rolname in ('anon','authenticated') and rolcanlogin) then
    raise exception 'science_client_database_login_must_be_disabled';
  end if;
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','graphql_public') and p.prokind='f'
      and (has_function_privilege('anon',p.oid,'EXECUTE')
        or has_function_privilege('authenticated',p.oid,'EXECUTE'))
      and (p.prosrc ~* '(net|vault)[[:space:]]*\.'
        or (p.prosecdef and p.prosrc ~* 'execute[[:space:]]'))
  ) then
    raise exception 'science_public_rpc_boundary_requires_review';
  end if;
  if exists(select 1 from cron.job where jobname in ('science-overhaul-hourly','science-overhaul-myasp')) then
    raise exception 'science_cron_jobs_already_exist_read_before_reapplying';
  end if;
end
$preflight$;

do $schedule$
declare job_id bigint;
begin
  job_id := cron.schedule('science-overhaul-hourly','17 * * * *', $command$
    select net.http_get(
      url := 'https://sci-test.rikei-talk.com/api/science-jobs/daily',
      headers := jsonb_build_object('Authorization','Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')),
      timeout_milliseconds := 55000
    ) where (select value->>'newAttempts' from public.science_config where key='release')='true';
  $command$);
  perform cron.alter_job(job_id, active := false);

  job_id := cron.schedule('science-overhaul-myasp','* * * * *', $command$
    select net.http_get(
      url := 'https://sci-test.rikei-talk.com/api/science-jobs/mail',
      headers := jsonb_build_object('Authorization','Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')),
      timeout_milliseconds := 55000
    ) where (select value->>'newAttempts' from public.science_config where key='release')='true'
        and (select value->>'myaspSync' from public.science_config where key='release')='true';
  $command$);
  perform cron.alter_job(job_id, active := false);
end
$schedule$;

commit;

select jobname,schedule,active from cron.job
where jobname in ('science-overhaul-hourly','science-overhaul-myasp') order by jobname;
