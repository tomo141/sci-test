begin;

alter table science_outbox add column delivery_token uuid;
alter table science_outbox add column delivery_authorized_at timestamptz;
alter table science_outbox add column content_sha256 text check(content_sha256 is null or content_sha256 ~ '^[0-9a-f]{64}$');
alter table science_outbox add column recipient_sha256 text check(recipient_sha256 is null or recipient_sha256 ~ '^[0-9a-f]{64}$');
create index science_mail_due on science_outbox(available_at,id) where kind='mail' and state in ('pending','failed');
create table science_mail_unsubscribe_tokens (
  token_hash text primary key check(token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table science_mail_unsubscribe_tokens enable row level security;
revoke all on science_mail_unsubscribe_tokens from public,anon,authenticated;
grant all on science_mail_unsubscribe_tokens to service_role;

-- No older challenge is backfilled. Repeated batches resume with users not yet queued.
create function science_queue_weekly_mail(p_limit int default 500) returns jsonb
language plpgsql set search_path=public as $$
declare w science_weekly_sets; added int; remaining boolean;
begin
  if p_limit is null or p_limit<1 or p_limit>500 then raise exception 'invalid_batch_size'; end if;
  if not coalesce((select (value->>'newAttempts')::boolean from science_config where key='release'),false) then return jsonb_build_object('state','exams_closed','queued',0); end if;
  select * into w from science_weekly_sets where starts_at<=now() and ends_at>now() order by starts_at desc limit 1;
  if not found then return jsonb_build_object('state','no_current_week','queued',0); end if;
  insert into science_outbox(dedupe_key,user_id,kind,payload)
    select 'weekly:'||w.id||':'||c.user_id,c.user_id,'mail',jsonb_build_object('topic','weekly','template','weekly','week',w.id)
    from science_consents c where c.topic='weekly' and c.enabled and science_private.email_verified(c.user_id)
      and not exists(select 1 from science_attempts a where a.user_id=c.user_id and a.week_id=w.id and a.state='completed')
      and not exists(select 1 from science_outbox o where o.dedupe_key='weekly:'||w.id||':'||c.user_id)
    order by c.user_id limit p_limit on conflict do nothing;
  get diagnostics added=row_count;
  select exists(select 1 from science_consents c where c.topic='weekly' and c.enabled and science_private.email_verified(c.user_id)
    and not exists(select 1 from science_attempts a where a.user_id=c.user_id and a.week_id=w.id and a.state='completed')
    and not exists(select 1 from science_outbox o where o.dedupe_key='weekly:'||w.id||':'||c.user_id)) into remaining;
  return jsonb_build_object('state','queued','week',w.id,'queued',added,'hasMore',remaining);
end $$;

create function science_mail_suppression(p_message uuid) returns text
language plpgsql stable set search_path=public as $$
declare m science_outbox; template text;
begin
  select * into m from science_outbox where id=p_message and kind='mail';
  if not found or m.user_id is null then return 'missing_recipient'; end if;
  if not science_private.email_verified(m.user_id) then return 'email_unverified'; end if;
  if not exists(select 1 from science_consents where user_id=m.user_id and topic=m.payload->>'topic' and enabled) then return 'consent_revoked'; end if;
  template:=m.payload->>'template';
  if template is null or template not in ('welcome','next-exam','weekly') then return 'unsupported_template'; end if;
  if (template='weekly' and m.payload->>'topic' is distinct from 'weekly') or (template<>'weekly' and m.payload->>'topic' is distinct from 'science') then return 'invalid_topic'; end if;
  if template='weekly' then
    if not exists(select 1 from science_weekly_sets where id=m.payload->>'week' and starts_at<=now() and ends_at>now()) then return 'week_closed'; end if;
    if exists(select 1 from science_attempts where user_id=m.user_id and week_id=m.payload->>'week' and state='completed') then return 'already_completed'; end if;
  elsif m.created_at<now()-interval '30 days' then return 'onboarding_expired';
  end if;
  return null;
end $$;

-- The helper returns only the verified recipient attached to a claimed mail, not arbitrary Auth data.
create function science_private.mail_recipient(p_message uuid,p_token uuid) returns text
language sql stable security definer set search_path='' as $$
  select u.email from public.science_outbox m join auth.users u on u.id=m.user_id
    where m.id=p_message and m.kind='mail' and m.state='processing' and m.delivery_token=p_token
      and u.email_confirmed_at is not null and public.science_mail_suppression(m.id) is null;
$$;

create function science_claim_mail(p_message uuid,p_token uuid,p_unsubscribe_hash text) returns jsonb
language plpgsql set search_path=public as $$
declare m science_outbox; owner uuid; suppression text; recipient text; profile science_profiles;
  active science_attempts; latest science_attempts; completed jsonb;
begin
  if p_token is null or p_unsubscribe_hash is null or p_unsubscribe_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_claim'; end if;
  if not coalesce((select (value->>'mailDelivery')::boolean and (value->>'newAttempts')::boolean from science_config where key='release'),false) then return jsonb_build_object('state','disabled'); end if;
  select user_id into owner from science_outbox where id=p_message and kind='mail';
  if owner is null then return jsonb_build_object('state','not_claimed'); end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||owner,0));
  select * into m from science_outbox where id=p_message and kind='mail' for update;
  if m.state not in ('pending','failed') or m.available_at>now() then return jsonb_build_object('state','not_claimed'); end if;
  suppression:=science_mail_suppression(m.id);
  if suppression is not null then
    update science_outbox set state='cancelled',error_code=suppression,processed_at=now() where id=m.id;
    return jsonb_build_object('state','cancelled','reason',suppression);
  end if;
  -- One live delivery per person, and at most one accepted mail in any 24 hours.
  if exists(select 1 from science_outbox where user_id=owner and kind='mail' and id<>m.id and state='processing') then return jsonb_build_object('state','recipient_busy'); end if;
  if exists(select 1 from science_outbox where user_id=owner and kind='mail' and state='accepted' and processed_at>now()-interval '24 hours') then
    update science_outbox set available_at=(select max(processed_at)+interval '24 hours' from science_outbox where user_id=owner and kind='mail' and state='accepted') where id=m.id;
    return jsonb_build_object('state','deferred');
  end if;
  update science_outbox set state='processing',delivery_token=p_token,locked_at=now(),attempts=attempts+1,error_code=null,delivery_authorized_at=null where id=m.id;
  recipient:=science_private.mail_recipient(m.id,p_token);
  if recipient is null then
    update science_outbox set state='cancelled',error_code='missing_recipient',processed_at=now() where id=m.id;
    return jsonb_build_object('state','cancelled');
  end if;
  update science_outbox set recipient_sha256=encode(sha256(convert_to(lower(recipient),'UTF8')),'hex') where id=m.id;
  insert into science_mail_unsubscribe_tokens(token_hash,user_id) values(p_unsubscribe_hash,owner) on conflict do nothing;
  if not exists(select 1 from science_mail_unsubscribe_tokens where token_hash=p_unsubscribe_hash and user_id=owner) then raise exception 'token_conflict'; end if;
  select * into profile from science_profiles where user_id=owner;
  select * into active from science_attempts a where a.user_id=owner and a.state='active'
    and (a.kind<>'weekly' or exists(select 1 from science_weekly_sets w where w.id=a.week_id and w.ends_at>now())) order by a.started_at desc limit 1;
  select * into latest from science_attempts where user_id=owner and state='completed' order by completed_at desc limit 1;
  select coalesce(jsonb_agg(distinct kind),'[]'::jsonb) into completed from science_attempts where user_id=owner and state='completed';
  return jsonb_build_object('state','claimed','id',m.id,'userId',owner,'email',recipient,'payload',m.payload,
    'nickname',coalesce(profile.nickname,'科学好き'),'interests',coalesce(profile.interests,'{}'),
    'active',case when active.id is null then null else jsonb_build_object('id',active.id,'label',active.definition->>'label') end,
    'latestResult',latest.id,'completedKinds',completed);
end $$;

create function science_authorize_mail(p_message uuid,p_token uuid,p_content_hash text) returns boolean
language plpgsql set search_path=public as $$
declare m science_outbox; owner uuid; suppression text;
begin
  if p_content_hash is null or p_content_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_content_hash'; end if;
  select user_id into owner from science_outbox where id=p_message and kind='mail';
  if owner is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||owner,0));
  select * into m from science_outbox where id=p_message for update;
  if m.state<>'processing' or m.delivery_token is distinct from p_token or m.delivery_authorized_at is not null or m.locked_at<now()-interval '2 minutes' then return false; end if;
  suppression:=science_mail_suppression(m.id);
  if not coalesce((select (value->>'mailDelivery')::boolean and (value->>'newAttempts')::boolean from science_config where key='release'),false) then suppression:='delivery_disabled'; end if;
  if suppression is null and m.recipient_sha256 is distinct from encode(sha256(convert_to(lower(science_private.mail_recipient(m.id,p_token)),'UTF8')),'hex') then suppression:='email_changed'; end if;
  if suppression is not null then
    update science_outbox set state='cancelled',error_code=suppression,processed_at=now() where id=m.id;
    return false;
  end if;
  update science_outbox set delivery_authorized_at=now(),content_sha256=p_content_hash where id=m.id;
  return true;
end $$;

create function science_finish_mail(p_message uuid,p_token uuid,p_outcome text,p_provider_id text default null,p_error_code text default null) returns boolean
language plpgsql set search_path=public as $$
declare m science_outbox;
begin
  if p_outcome is null or p_outcome not in ('accepted','retryable','blocked') or length(coalesce(p_provider_id,''))>200 or coalesce(p_error_code,'')!~ '^[a-z0-9_]{0,80}$' then raise exception 'invalid_delivery_result'; end if;
  select * into m from science_outbox where id=p_message and kind='mail' for update;
  if not found or m.state<>'processing' or m.delivery_token is distinct from p_token then return false; end if;
  if p_outcome='accepted' and m.delivery_authorized_at is null then raise exception 'mail_not_authorized'; end if;
  update science_outbox set
    state=case when p_outcome='accepted' then 'accepted' when p_outcome='retryable' and m.attempts<3 then 'failed' else 'blocked' end,
    error_code=p_error_code,provider_id=p_provider_id,processed_at=now(),
    available_at=case when p_outcome='retryable' then now()+interval '15 minutes'*power(4,least(m.attempts-1,3)) else available_at end
    where id=m.id;
  return true;
end $$;

create function science_recover_stalled_mail() returns int language plpgsql set search_path=public as $$
declare n int;
begin
  -- SMTP can accept a message just before a process dies. Never blindly replay that message.
  update science_outbox set state=case when delivery_authorized_at is null then 'failed' else 'blocked' end,
    error_code=case when delivery_authorized_at is null then 'interrupted_before_send' else 'delivery_outcome_unknown' end,
    processed_at=now(),available_at=now()
    where kind='mail' and state='processing' and locked_at<now()-interval '5 minutes';
  get diagnostics n=row_count;return n;
end $$;

create function science_unsubscribe_mail(p_token_hash text) returns boolean language plpgsql set search_path=public as $$
declare owner uuid; operation uuid:=gen_random_uuid();
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  select user_id into owner from science_mail_unsubscribe_tokens where token_hash=p_token_hash;
  if owner is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||owner,0));
  insert into science_events(dedupe_key,event_name,user_id,payload)
    select 'oneclick:'||operation||':'||topic,'mail_consent_revoked',owner,jsonb_build_object('topic',topic,'source','mail_unsubscribe') from science_consents where user_id=owner and enabled;
  update science_consents set enabled=false,updated_at=now() where user_id=owner and enabled;
  update marketing_consents set consented=false where user_id=owner and consented;
  update science_outbox set state='cancelled',error_code='consent_revoked',processed_at=now() where user_id=owner and kind='mail' and state in ('pending','failed','blocked');
  -- In-flight delivery checks consent again before its irreversible SMTP step.
  return true;
end $$;

-- Expired leases remain visible as interrupted jobs instead of looking permanently active.
create or replace function science_begin_job(p_kind text) returns uuid language plpgsql set search_path=public as $$
declare job uuid; expired science_job_leases;
begin
  if p_kind is null or length(p_kind) not between 1 and 60 then raise exception 'invalid_job_kind'; end if;
  perform pg_advisory_xact_lock(hashtextextended('job:'||p_kind,0));
  select * into expired from science_job_leases where kind=p_kind;
  if found and expired.expires_at>now() then return null; end if;
  if expired.job_id is not null then update science_jobs set state='interrupted',summary=summary||'{"reason":"lease_expired"}'::jsonb,finished_at=now() where id=expired.job_id and state='running'; end if;
  insert into science_jobs(kind,state,observed_to) values(p_kind,'running',now()) returning id into job;
  insert into science_job_leases(kind,job_id,expires_at) values(p_kind,job,now()+interval '5 minutes') on conflict(kind) do update set job_id=excluded.job_id,expires_at=excluded.expires_at;
  return job;
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='public' and p.proname in ('science_queue_weekly_mail','science_mail_suppression','science_claim_mail','science_authorize_mail','science_finish_mail','science_recover_stalled_mail','science_unsubscribe_mail')) or (n.nspname='science_private' and p.proname='mail_recipient') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
