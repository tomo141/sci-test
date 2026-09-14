begin;
create view science_quality_responses with(security_invoker=true) as
  select v.*, (i.choice_order->>r.selected_index)::int canonical_choice,
    (v.eligible or v.exclusion_reason in ('lab','weekly')) quality_eligible
  from science_responses v join science_answers r using(attempt_id,ordinal) join science_issued i using(attempt_id,ordinal);
revoke all on science_quality_responses from public,anon,authenticated;
grant select on science_quality_responses to service_role;

create table science_quality_signals(
  id uuid primary key default gen_random_uuid(),revision_id uuid not null references science_items(id),
  code text not null check(code in ('rare_distractor','negative_discrimination','unexpected_errors','report_burst','evidence_report','source_expired','source_due','similar_stem')),
  priority int not null check(priority between 1 and 3),state text not null default 'open' check(state in ('open','acknowledged','resolved')),
  evidence jsonb not null,first_observed_at timestamptz not null,last_observed_at timestamptz not null,observed_from timestamptz not null,
  job_id uuid not null references science_jobs(id),reviewed_by uuid references auth.users(id),review_note text,reviewed_at timestamptz,
  unique(revision_id,code)
);
alter table science_quality_signals enable row level security;
revoke all on science_quality_signals from public,anon,authenticated;
grant all on science_quality_signals to service_role;

create function science_store_quality_signals(p_job uuid,p_signals jsonb,p_revisions uuid[],p_observed timestamptz,p_from timestamptz)
returns boolean language plpgsql set search_path=public as $$
declare s jsonb;
begin
  if not exists(select 1 from science_jobs where id=p_job and state='running') then raise exception 'invalid_job'; end if;
  if jsonb_typeof(p_signals)<>'array' or p_from>p_observed then raise exception 'invalid_signals'; end if;
  perform pg_advisory_xact_lock(hashtextextended('science-quality-watch',0));
  for s in select * from jsonb_array_elements(p_signals) loop
    if not ((s->>'revisionId')::uuid=any(p_revisions)) then raise exception 'unobserved_revision'; end if;
    insert into science_quality_signals(revision_id,code,priority,evidence,first_observed_at,last_observed_at,observed_from,job_id)
      values((s->>'revisionId')::uuid,s->>'code',(s->>'priority')::int,s->'evidence',p_observed,p_observed,p_from,p_job)
      on conflict(revision_id,code) do update set priority=excluded.priority,evidence=excluded.evidence,last_observed_at=excluded.last_observed_at,observed_from=excluded.observed_from,job_id=excluded.job_id,
        state=case when science_quality_signals.state='resolved' then 'open' else science_quality_signals.state end,
        reviewed_by=case when science_quality_signals.state='resolved' then null else science_quality_signals.reviewed_by end,
        review_note=case when science_quality_signals.state='resolved' then null else science_quality_signals.review_note end,
        reviewed_at=case when science_quality_signals.state='resolved' then null else science_quality_signals.reviewed_at end
      where science_quality_signals.last_observed_at<=excluded.last_observed_at;
  end loop;
  update science_quality_signals q set state='resolved',job_id=p_job,last_observed_at=p_observed
    where q.revision_id=any(p_revisions) and q.last_observed_at<=p_observed and q.state<>'resolved'
      and not exists(select 1 from jsonb_array_elements(p_signals) as input(value) where input.value->>'revisionId'=q.revision_id::text and input.value->>'code'=q.code);
  return true;
end $$;

create function science_review_quality_signal(p_id uuid,p_admin uuid,p_reason text,p_hold boolean)
returns boolean language plpgsql set search_path=public as $$
declare signal science_quality_signals;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'forbidden'; end if;
  if length(trim(p_reason))<5 then raise exception 'reason_required'; end if;
  select * into signal from science_quality_signals where id=p_id for update;
  if not found or signal.state='resolved' then raise exception 'not_found' using errcode='P0002'; end if;
  if p_hold then update science_items set status='held' where id=signal.revision_id and status in ('published','lab'); end if;
  update science_quality_signals set state='acknowledged',reviewed_by=p_admin,review_note=p_reason,reviewed_at=now() where id=p_id;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'quality_signal_reviewed',p_id::text,p_reason,jsonb_build_object('hold',p_hold,'code',signal.code,'revision',signal.revision_id,'evidence',signal.evidence));
  return true;
end $$;
revoke all on function science_store_quality_signals(uuid,jsonb,uuid[],timestamptz,timestamptz),science_review_quality_signal(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function science_store_quality_signals(uuid,jsonb,uuid[],timestamptz,timestamptz),science_review_quality_signal(uuid,uuid,text,boolean) to service_role;
commit;
