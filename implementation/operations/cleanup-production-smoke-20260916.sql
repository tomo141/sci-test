-- Remove only the anonymous attempt created by this deployment smoke test.
-- Never run after jobs have consumed its responses, or after an account claims it.
begin;
set local statement_timeout='30s';
do $$
declare test_id uuid:='b4bb769f-1354-430d-b895-37b74a97489c'; a science_attempts; v science_visitors;
begin
  select * into a from science_attempts where id=test_id for update;
  if not found or a.user_id is not null or a.kind<>'trial' or a.total<>20 or a.ordinal<>20 or a.state<>'completed' or a.started_at<'2026-09-15 16:17:05+00' then raise exception 'test_attempt_guard_failed'; end if;
  select * into v from science_visitors where id=a.visitor_id for update;
  if not found or v.user_id is not null or (select count(*) from science_attempts where visitor_id=v.id)<>1 then raise exception 'test_visitor_guard_failed'; end if;
  if exists(select 1 from science_shares where attempt_id=test_id and (enabled or nickname<>'運営動作確認（テスト）')) then raise exception 'revoke_test_share_first'; end if;
  if exists(select 1 from science_visitors where ref_share in(select id from science_shares where attempt_id=test_id)) then raise exception 'share_has_external_referral'; end if;
  if exists(select 1 from science_feedback where visitor_id=v.id) or exists(select 1 from science_events where visitor_id=v.id and user_id is not null) then raise exception 'unexpected_user_activity'; end if;
  if exists(select 1 from science_jobs where started_at>=a.started_at) or exists(select 1 from science_outbox where payload->>'attemptId'=test_id::text and (user_id is not null or state<>'pending')) then raise exception 'test_data_already_processed'; end if;
  delete from science_outbox where payload->>'attemptId'=test_id::text and user_id is null;
  delete from science_events where visitor_id=v.id or attempt_id=test_id;
  delete from science_exposures where visitor_id=v.id;
  delete from science_shares where attempt_id=test_id;
  delete from science_result_revisions where attempt_id=test_id;
  delete from science_response_exclusions where attempt_id=test_id;
  delete from science_answers where attempt_id=test_id;
  delete from science_issued where attempt_id=test_id;
  delete from science_attempts where id=test_id;
  delete from science_visitors where id=v.id;
  insert into science_audit(action,target,reason,detail) values('deployment_smoke_cleaned',test_id::text,'Removed anonymous deployment test after 20 saved answers, reload recovery, result sharing and withdrawal; no account or scheduler processed it',jsonb_build_object('answers',20,'humanAttempt',false));
end $$;
commit;
select count(*) as remaining_test_attempts from science_attempts where id='b4bb769f-1354-430d-b895-37b74a97489c';
