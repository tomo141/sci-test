-- One-time production operations setup. Not part of the application migrations.
-- Requires explicit approval for Vault storage and this schedule.
-- Both jobs are created INACTIVE in the same transaction; this sends no requests.
begin;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $preflight$
begin
  if (select count(*) from vault.decrypted_secrets
      where name='science_jobs_cron_secret' and length(decrypted_secret)>=32) <> 1 then
    raise exception 'science_cron_secret_not_configured';
  end if;
  if has_table_privilege('anon','vault.decrypted_secrets','SELECT')
     or has_table_privilege('authenticated','vault.decrypted_secrets','SELECT')
     or has_table_privilege('anon','net.http_request_queue','SELECT')
     or has_table_privilege('authenticated','net.http_request_queue','SELECT') then
    raise exception 'science_cron_secret_storage_permissions_require_review';
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
