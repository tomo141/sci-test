-- Authenticated READ-ONLY field inspection. Run only after the production route
-- supports check=fields; older revisions ignore the parameter and run a sync.
select net.http_get(
  url:='https://sci-test.rikei-talk.com/api/science-jobs/mail?check=fields',
  headers:=jsonb_build_object('Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='science_jobs_cron_secret')),
  timeout_milliseconds:=55000
) as request_id;
