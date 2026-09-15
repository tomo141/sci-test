-- One-time, approved production connection check. No marketing mail is enabled.
-- Run only after the anonymous deployment test has been removed.
begin;
do $$ begin
  if exists(select 1 from science_attempts where id='b4bb769f-1354-430d-b895-37b74a97489c') then raise exception 'cleanup_smoke_test_first'; end if;
  if not exists(select 1 from science_config where key='release' and value->>'newAttempts'='true' and value->>'myaspSync'='false' and value->>'mailDelivery'='false') then raise exception 'unexpected_release_state'; end if;
  if (select count(*) from vault.decrypted_secrets where name='science_jobs_cron_secret' and length(decrypted_secret)>=32)<>1 then raise exception 'vault_secret_required'; end if;
end $$;
with targets(label,path,authenticated) as (values
  ('daily_unauthenticated','daily',false),('mail_unauthenticated','mail',false),
  ('daily_authenticated','daily',true),('mail_authenticated_disabled','mail',true)
)
select label,net.http_get(
  url:='https://sci-test.rikei-talk.com/api/science-jobs/'||path,
  headers:=case when authenticated then jsonb_build_object('Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')) else '{}'::jsonb end,
  timeout_milliseconds:=55000
) as request_id from targets;
commit;
