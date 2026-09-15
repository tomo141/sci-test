-- Approved consent/status synchronization only. Marketing delivery stays disabled.
-- Cron schedules remain stopped until this first real synchronization is verified.
begin;
do $$ begin
  if not exists(select 1 from science_config where key='release' and value->>'newAttempts'='true' and value->>'myaspSync'='false' and value->>'mailDelivery'='false') then raise exception 'unexpected_release_state'; end if;
  if not exists(select 1 from science_jobs where kind='daily' and state='completed' and started_at>='2026-09-15 16:29:00+00') then raise exception 'completed_daily_job_required'; end if;
  if (select count(*) from net._http_response where id in (1,2) and status_code=401 and not timed_out)<>2 then raise exception 'unauthorized_checks_required'; end if;
  if not exists(select 1 from net._http_response where id=4 and status_code=200 and content::jsonb->>'state'='disabled') then raise exception 'authenticated_mail_check_required'; end if;
  if exists(select 1 from cron.job where jobname in ('science-overhaul-hourly','science-overhaul-myasp') and active) then raise exception 'cron_must_be_stopped'; end if;
end $$;
update science_config set value=jsonb_set(value,'{myaspSync}','true'),updated_at=now() where key='release';
insert into science_audit(action,target,reason,detail) values('myasp_sync_enabled','release','Approved synchronization to existing science scenario; SMTP login and authenticated job boundary verified',jsonb_build_object('scenario','wTYCnyFi','mailDelivery',false,'registerStepmail',false));
select net.http_get(url:='https://sci-test.rikei-talk.com/api/science-jobs/mail',headers:=jsonb_build_object('Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')),timeout_milliseconds:=55000) as first_sync_request;
commit;
