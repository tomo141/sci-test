-- Approved scheduler activation after the production HTTP and application checks.
-- Does not enable MyASP scheduling or marketing mail.
begin;
do $activation$
declare v_job bigint; v_command text;
begin
  if not exists(select 1 from public.science_config where key='release'
    and value->>'newAttempts'='true' and value->>'mailDelivery'='false') then
    raise exception 'science_release_not_ready';
  end if;
  if not exists(select 1 from net._http_response where id=6 and status_code=200
    and timed_out=false and content::jsonb->>'state'='completed') then
    raise exception 'science_successful_http_check_required';
  end if;
  if not exists(select 1 from public.science_jobs where kind='daily' and state='completed'
    and finished_at >= '2026-09-15T17:59:00Z'::timestamptz) then
    raise exception 'science_completed_application_job_required';
  end if;
  if exists(select 1 from public.science_attempts where id='b570685f-e06a-47e2-a426-c17eefbfc164') then
    raise exception 'science_test_cleanup_required';
  end if;
  if (select count(*) from cron.job where jobname='science-overhaul-hourly'
    and schedule='17 * * * *' and not active) <> 1 then
    raise exception 'science_expected_inactive_hourly_job_required';
  end if;
  select jobid,command into v_job,v_command from cron.job where jobname='science-overhaul-hourly';
  if regexp_replace(v_command,'[[:space:]]+','','g') <> regexp_replace($expected$
    select net.http_get(
      url := 'https://sci-test.rikei-talk.com/api/science-jobs/daily',
      headers := jsonb_build_object('Authorization','Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')),
      timeout_milliseconds := 55000
    ) where (select value->>'newAttempts' from public.science_config where key='release')='true';
  $expected$,'[[:space:]]+','','g') then
    raise exception 'science_hourly_command_changed';
  end if;
  perform cron.alter_job(v_job,active:=true);
  insert into public.science_audit(action,target,reason,detail) values
    ('scheduler_activated','science-overhaul-hourly','Operator approved activation after connection verification',
     jsonb_build_object('httpRequestId',6,'schedule','17 * * * *','mailDelivery',false));
end
$activation$;
commit;
select jobname,schedule,active from cron.job where jobname in ('science-overhaul-hourly','science-overhaul-myasp') order by jobname;
