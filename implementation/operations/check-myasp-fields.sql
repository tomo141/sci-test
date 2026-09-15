-- Authenticated synchronization check; no marketing mail is sent.
select net.http_get(
  url:='https://sci-test.rikei-talk.com/api/science-jobs/mail',
  headers:=jsonb_build_object('Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')),
  timeout_milliseconds:=55000
) as request_id;
