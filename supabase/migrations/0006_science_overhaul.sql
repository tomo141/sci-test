begin;

create table public.science_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(), reason text not null
);
create table public.science_visitors (
  id uuid primary key default gen_random_uuid(), token_hash text not null unique check(length(token_hash)=64),
  user_id uuid references auth.users(id) on delete set null,
  experiment text not null default 'entry-route-v1', route_group text not null check(route_group in ('A','B','C','D')),
  full_length int not null default 50 check(full_length in (50,100)),
  ref_share uuid, created_at timestamptz not null default now(), verified_at timestamptz
);
create index science_visitors_user on public.science_visitors(user_id,created_at);
create table public.science_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_id uuid not null unique default gen_random_uuid(), nickname text not null default '科学好き' check(length(nickname) between 1 and 30),
  bio text not null default '' check(length(bio)<=160), interests text[] not null default '{}',
  is_public boolean not null default false, ranking_opt_in boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.science_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  acquired_at timestamptz not null default now(), source text not null
);
create table public.science_consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check(topic in ('science','weekly','domain_opening')),
  enabled boolean not null default false, version text not null, updated_at timestamptz not null default now(),
  primary key(user_id,topic)
);
create table public.science_releases (
  id uuid primary key default gen_random_uuid(), name text not null,
  state text not null default 'candidate' check(state in ('candidate','active','retired')),
  model_version text not null, settings jsonb not null default '{}', validation jsonb not null default '{}',
  created_at timestamptz not null default now(), activated_at timestamptz
);
create unique index science_one_active_release on public.science_releases(state) where state='active';
create table public.science_items (
  id uuid primary key default gen_random_uuid(), family_id text not null, version int not null default 1 check(version>0),
  legacy_id uuid references public.questions(id), author_id uuid references auth.users(id) on delete set null,
  domain text not null, subdomain text not null, content jsonb not null,
  status text not null default 'draft' check(status in ('draft','submitted','lab','published','held','retired')),
  quality_passed boolean not null default false, rights_checked boolean not null default false,
  review_evidence jsonb not null default '{}', license_version text, expires_at timestamptz,
  created_at timestamptz not null default now(), unique(family_id,version),
  check(jsonb_typeof(content->'choices')='array' and jsonb_array_length(content->'choices')=4),
  check((content->>'correctIndex')::int between 0 and 3),
  check(length(content->>'question')>0), check(length(content->>'explanation')>0)
);
create index science_items_domain on public.science_items(status,domain);
create table public.science_release_items (
  release_id uuid not null references public.science_releases(id), revision_id uuid not null references public.science_items(id),
  a double precision not null default 1 check(a>0 and a<=4),
  b double precision not null check(b between -5 and 5),
  c double precision not null default .25 check(c>=0 and c<.5),
  focus boolean not null default false, anchor boolean not null default false,
  parameter_evidence jsonb not null default '{}',
  primary key(release_id,revision_id)
);
create table public.science_weekly_sets (
  id text primary key, starts_at timestamptz not null, ends_at timestamptz not null,
  revision_ids uuid[] not null check(cardinality(revision_ids)=10),
  created_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table public.science_attempts (
  id uuid primary key default gen_random_uuid(), visitor_id uuid not null references public.science_visitors(id),
  user_id uuid references auth.users(id) on delete set null,
  definition jsonb not null, release_id uuid references public.science_releases(id), model_version text not null,
  kind text not null check(kind in ('trial','full','domain','weekly','lab')),
  total int not null check(total in (10,20,50,100)), domain text, week_id text references public.science_weekly_sets(id),
  state text not null default 'active' check(state in ('active','completed','abandoned')),
  ordinal int not null default 0 check(ordinal>=0 and ordinal<=total),
  competitive boolean not null default true, started_at timestamptz not null default now(), completed_at timestamptz,
  result jsonb, result_revision int not null default 1, needs_recalculation boolean not null default false,
  check(state<>'completed' or (ordinal=total and result is not null and completed_at is not null))
);
create index science_attempts_owner on public.science_attempts(user_id,started_at desc);
create index science_attempts_visitor on public.science_attempts(visitor_id,started_at desc);
create unique index science_active_visitor on public.science_attempts(visitor_id) where state='active';
create index science_active_user on public.science_attempts(user_id) where state='active' and user_id is not null;
create table public.science_issued (
  attempt_id uuid not null references public.science_attempts(id), ordinal int not null check(ordinal>=0),
  revision_id uuid not null references public.science_items(id), family_id text not null,
  token uuid not null unique default gen_random_uuid(), choice_order jsonb not null, snapshot jsonb not null,
  predicted double precision not null check(predicted between 0 and 1),
  selection_probability double precision not null check(selection_probability>0 and selection_probability<=1),
  selection_reason text not null, candidate_count int not null check(candidate_count>0),
  eligible boolean not null, exclusion_reason text, issued_at timestamptz not null default now(),
  primary key(attempt_id,ordinal), unique(attempt_id,family_id),
  check(jsonb_array_length(choice_order)=4 and choice_order @> '[0,1,2,3]'::jsonb)
);
create table public.science_answers (
  attempt_id uuid not null, ordinal int not null, operation_id uuid not null,
  selected_index int not null check(selected_index between 0 and 3), is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key(attempt_id,ordinal), unique(attempt_id,operation_id),
  foreign key(attempt_id,ordinal) references public.science_issued(attempt_id,ordinal)
);
create table public.science_exposures (
  visitor_id uuid not null references public.science_visitors(id), family_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  first_attempt_id uuid references public.science_attempts(id), reason text not null,
  seen_at timestamptz not null default now(), primary key(visitor_id,family_id)
);
create index science_exposures_user on public.science_exposures(user_id,family_id);
create table public.science_shares (
  id uuid primary key default gen_random_uuid(), attempt_id uuid not null unique references public.science_attempts(id),
  enabled boolean not null default true, nickname text not null check(length(nickname) between 1 and 30),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.science_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  revision_id uuid not null references public.science_items(id), created_at timestamptz not null default now(),
  primary key(user_id,revision_id)
);
create table public.science_feedback (
  id uuid primary key default gen_random_uuid(), revision_id uuid not null references public.science_items(id),
  visitor_id uuid not null references public.science_visitors(id), user_id uuid references auth.users(id) on delete set null,
  category text not null check(category in ('answer','ambiguous','explanation','source','rights','typo','good')),
  body text not null default '' check(length(body)<=2000), evidence text not null default '' check(length(evidence)<=2000),
  state text not null default 'pending' check(state in ('pending','accepted','rejected','withdrawn')),
  resolved_by uuid references auth.users(id), resolution text, created_at timestamptz not null default now(), resolved_at timestamptz,
  unique(visitor_id,revision_id,category), check(resolved_by is null or resolved_by is distinct from user_id)
);
create table public.science_submission_drafts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id),
  domain text not null, subdomain text not null, content jsonb not null,
  state text not null default 'draft' check(state in ('draft','submitted','changes_requested','lab','adopted','rejected')),
  revision_id uuid references public.science_items(id), license_version text, license_accepted_at timestamptz,
  review_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.science_trust_evidence (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  domain text not null, role text not null check(role in ('author','reviewer')),
  positive boolean not null, source_key text not null unique, reason text not null,
  reviewer_id uuid not null references auth.users(id), created_at timestamptz not null default now(), check(user_id<>reviewer_id)
);
create table public.science_badges (
  user_id uuid not null references auth.users(id) on delete cascade, code text not null,
  evidence jsonb not null, awarded_at timestamptz not null default now(), primary key(user_id,code)
);
create table public.science_events (
  id uuid primary key default gen_random_uuid(), dedupe_key text not null unique, event_name text not null,
  visitor_id uuid references public.science_visitors(id), user_id uuid references auth.users(id) on delete set null,
  attempt_id uuid references public.science_attempts(id), payload jsonb not null default '{}', created_at timestamptz not null default now()
);
create index science_events_time on public.science_events(event_name,created_at);
create table public.science_outbox (
  id uuid primary key default gen_random_uuid(), dedupe_key text not null unique,
  user_id uuid references auth.users(id) on delete cascade, kind text not null, payload jsonb not null default '{}',
  state text not null default 'pending' check(state in ('pending','processing','accepted','failed','cancelled','blocked')),
  attempts int not null default 0, available_at timestamptz not null default now(), locked_at timestamptz,
  error_code text, provider_id text, created_at timestamptz not null default now(), processed_at timestamptz
);
create table public.science_jobs (
  id uuid primary key default gen_random_uuid(), kind text not null, state text not null,
  input_version text, observed_from timestamptz, observed_to timestamptz,
  summary jsonb not null default '{}', started_at timestamptz not null default now(), finished_at timestamptz
);
create table public.science_audit (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id),
  action text not null, target text not null, reason text not null, detail jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.science_config (
  key text primary key, value jsonb not null, updated_at timestamptz not null default now()
);
insert into public.science_config(key,value) values
  ('release', '{"newAttempts":false,"fullLength":50,"experiment":"entry-route-v1","labSubmissions":false,"licenseVersion":null,"mailDelivery":false}');
create table public.science_rate_limits (
  key text not null, window_start timestamptz not null, hits int not null default 1,
  primary key(key,window_start)
);

-- New records and answer keys are reachable only through the application's checked server operations.
do $$ declare item record; begin
  for item in select tablename from pg_tables where schemaname='public' and tablename like 'science\_%' escape '\' loop
    execute format('alter table public.%I enable row level security', item.tablename);
    execute format('revoke all on table public.%I from anon, authenticated, public', item.tablename);
    execute format('grant all on table public.%I to service_role', item.tablename);
  end loop;
end $$;

create function public.science_owns(p_attempt uuid,p_visitor uuid,p_user uuid)
returns boolean language sql stable set search_path=public as $$
  select exists(select 1 from science_attempts a where a.id=p_attempt and
    ((a.user_id is not null and a.user_id=p_user) or (a.user_id is null and a.visitor_id=p_visitor)));
$$;

create function public.science_create_attempt(p_visitor uuid,p_user uuid,p_definition jsonb,p_release uuid,p_model text,p_week text default null)
returns public.science_attempts language plpgsql set search_path=public as $$
declare v science_visitors; a science_attempts; kind text; needs_account boolean;
begin
  select * into v from science_visitors where id=p_visitor for update;
  if not found or (v.user_id is not null and v.user_id is distinct from p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  if p_user is not null then
    perform pg_advisory_xact_lock(hashtextextended('start:'||p_user,0));
    if exists(select 1 from science_attempts where user_id=p_user and state='active') then raise exception 'active_attempt' using errcode='40001'; end if;
  end if;
  kind:=p_definition->>'kind';
  needs_account:=case v.route_group when 'A' then kind='domain' when 'B' then kind='full' else kind in ('full','domain') end;
  if needs_account and (p_user is null or not exists(select 1 from science_entitlements where user_id=p_user)) then raise exception 'registration_required'; end if;
  if kind in ('trial','full','domain') and not exists(select 1 from science_releases where id=p_release and state='active') then raise exception 'bank_unavailable'; end if;
  if kind='weekly' and not exists(select 1 from science_weekly_sets where id=p_week and now()>=starts_at and now()<ends_at) then raise exception 'week_closed'; end if;
  insert into science_attempts(visitor_id,user_id,definition,release_id,model_version,kind,total,domain,week_id)
    values(p_visitor,p_user,p_definition,p_release,p_model,kind,(p_definition->>'count')::int,p_definition->>'domain',p_week) returning * into a;
  if kind='weekly' and exists(select 1 from science_attempts where id<>a.id and week_id=p_week and state='completed' and (visitor_id=p_visitor or (p_user is not null and user_id=p_user))) then
    update science_attempts set competitive=false where id=a.id returning * into a;
  end if;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id,payload) values('started:'||a.id,'attempt_started',p_visitor,p_user,a.id,jsonb_build_object('kind',kind,'group',v.route_group,'experiment',v.experiment));
  return a;
end $$;

create function public.science_issue(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_revision uuid,p_order jsonb,
  p_predicted double precision,p_probability double precision,p_reason text,p_candidates int)
returns public.science_issued language plpgsql set search_path=public as $$
declare a science_attempts; q science_items; issued science_issued; params science_release_items; known boolean; eligible boolean;
begin
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal;
  if found then return issued; end if;
  if a.state<>'active' or a.ordinal<>p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  select * into q from science_items where id=p_revision;
  if not found or not q.rights_checked or (q.status not in ('published','lab') and not (a.kind='weekly' and exists(select 1 from science_revision_updates where source_revision=q.id))) or (q.expires_at is not null and q.expires_at<=now()) then raise exception 'item_unavailable'; end if;
  if a.kind not in ('lab','weekly') and (q.status<>'published' or not q.quality_passed) then raise exception 'item_unavailable'; end if;
  if a.kind='lab' and q.author_id is null then raise exception 'not_a_submission'; end if;
  if a.kind='weekly' then
    if not exists(select 1 from science_weekly_sets w where w.id=a.week_id and w.revision_ids[p_ordinal+1]=p_revision) then raise exception 'wrong_weekly_item'; end if;
  else
    select * into params from science_release_items where release_id=a.release_id and revision_id=p_revision;
    if a.kind<>'lab' and not found then raise exception 'item_not_in_release'; end if;
  end if;
  -- Serialize novelty checks across registered devices as well as anonymous tabs.
  perform pg_advisory_xact_lock(hashtextextended(coalesce(p_user::text,p_visitor::text),0));
  select exists(select 1 from science_exposures e where e.family_id=q.family_id and (e.visitor_id=p_visitor or (p_user is not null and e.user_id=p_user))) or (q.author_id is not null and q.author_id=p_user) into known;
  if known and a.kind in ('trial','full','domain') then raise exception 'already_seen' using errcode='40001'; end if;
  eligible := a.kind in ('trial','full','domain') and not known;
  if a.kind='weekly' and known then update science_attempts set competitive=false where id=a.id; end if;
  insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible,exclusion_reason)
  values(p_attempt,p_ordinal,q.id,q.family_id,p_order,jsonb_build_object('content',q.content,'domain',q.domain,'subdomain',q.subdomain,'a',coalesce(params.a,1),'b',coalesce(params.b,0),'c',coalesce(params.c,.25),'authorId',q.author_id,'creditName',q.credit_name,'aiAssisted',q.ai_assisted),p_predicted,p_probability,p_reason,p_candidates,eligible,
    case when known then 'previously_seen_or_author' when not eligible then a.kind else null end) returning * into issued;
  insert into science_exposures(visitor_id,family_id,user_id,first_attempt_id,reason) values(p_visitor,q.family_id,p_user,p_attempt,a.kind) on conflict(visitor_id,family_id) do nothing;
  return issued;
end $$;

create function public.science_commit_answer(p_attempt uuid,p_visitor uuid,p_user uuid,p_ordinal int,p_token uuid,p_operation uuid,p_selected int,p_result jsonb default null)
returns public.science_attempts language plpgsql set search_path=public as $$
declare a science_attempts; issued science_issued; previous science_answers; correct boolean;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or not science_owns(p_attempt,p_visitor,p_user) then raise exception 'not_found' using errcode='P0002'; end if;
  select * into previous from science_answers where attempt_id=p_attempt and operation_id=p_operation;
  if found then
    if previous.ordinal<>p_ordinal or previous.selected_index<>p_selected then raise exception 'operation_reused' using errcode='40001'; end if;
    return a;
  end if;
  if a.state<>'active' or a.ordinal<>p_ordinal then raise exception 'stale_attempt' using errcode='40001'; end if;
  if p_selected is null or p_selected not between 0 and 3 then raise exception 'invalid_choice'; end if;
  if a.kind='weekly' and exists(select 1 from science_weekly_sets where id=a.week_id and now()>=ends_at) then update science_attempts set competitive=false where id=a.id; end if;
  select * into issued from science_issued where attempt_id=p_attempt and ordinal=p_ordinal and token=p_token;
  if not found then raise exception 'not_issued' using errcode='P0002'; end if;
  correct := (issued.choice_order->>p_selected)::int=(issued.snapshot->'content'->>'correctIndex')::int;
  if p_ordinal+1=a.total and (p_result is null or coalesce((p_result->>'originalAnswerCount')::int,(p_result->>'answerCount')::int)<>a.total or p_result->>'version'<>a.model_version) then raise exception 'result_required'; end if;
  if p_ordinal+1=a.total and coalesce((p_result->>'correctionEpoch')::int,0)<>science_correction_epoch() then raise exception 'result_recalculation_required' using errcode='40001'; end if;
  insert into science_answers(attempt_id,ordinal,operation_id,selected_index,is_correct) values(p_attempt,p_ordinal,p_operation,p_selected,correct);
  update science_attempts set ordinal=p_ordinal+1,
    state=case when p_ordinal+1=total then 'completed' else 'active' end,
    completed_at=case when p_ordinal+1=total then now() else null end,
    result=case when p_ordinal+1=total then p_result else null end where id=p_attempt returning * into a;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id,payload)
    values('answer:'||p_attempt||':'||p_ordinal,'answer_committed',a.visitor_id,a.user_id,a.id,jsonb_build_object('ordinal',p_ordinal)) on conflict do nothing;
  if a.state='completed' then
    insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id) values('completed:'||a.id,'attempt_completed',a.visitor_id,a.user_id,a.id) on conflict do nothing;
    insert into science_outbox(dedupe_key,user_id,kind,payload) values('completion:'||a.id,a.user_id,'attempt_completed',jsonb_build_object('attemptId',a.id)) on conflict do nothing;
  end if;
  return a;
end $$;

create function public.science_claim_visitor(p_visitor uuid,p_hash text,p_user uuid)
returns boolean language plpgsql set search_path=public as $$
declare v science_visitors; original science_visitors;
begin
  select * into v from science_visitors where id=p_visitor and token_hash=p_hash for update;
  if not found or (v.user_id is not null and v.user_id<>p_user) then raise exception 'invalid_owner'; end if;
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'email_unverified'; end if;
  select * into original from science_visitors where user_id=p_user order by created_at limit 1;
  if found and original.id<>v.id then
    insert into science_events(dedupe_key,event_name,visitor_id,user_id,payload) values('merge:'||v.id,'assignment_merged',v.id,p_user,jsonb_build_object('originalGroup',v.route_group,'canonicalGroup',original.route_group)) on conflict do nothing;
  end if;
  -- Both devices' active records remain resumable; new starts are serialized per user.
  update science_visitors set user_id=p_user,verified_at=coalesce(verified_at,now()),route_group=coalesce(original.route_group,route_group),full_length=coalesce(original.full_length,full_length) where id=p_visitor;
  update science_attempts set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_exposures set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_events set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_feedback set user_id=p_user where visitor_id=p_visitor and user_id is null;
  insert into science_profiles(user_id) values(p_user) on conflict do nothing;
  insert into science_entitlements(user_id,source) values(p_user,'verified_email') on conflict do nothing;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id) values('verified:'||p_user,'email_verified',p_visitor,p_user) on conflict do nothing;
  return true;
end $$;

create function public.science_rate_limit(p_key text,p_seconds int,p_limit int)
returns boolean language plpgsql set search_path=public as $$
declare start_at timestamptz; count_hits int;
begin
  if p_seconds<1 or p_limit<1 then raise exception 'invalid_limit'; end if;
  start_at:=to_timestamp(floor(extract(epoch from now())/p_seconds)*p_seconds);
  insert into science_rate_limits(key,window_start) values(p_key,start_at)
    on conflict(key,window_start) do update set hits=science_rate_limits.hits+1 returning hits into count_hits;
  return count_hits<=p_limit;
end $$;

-- No caller-supplied IDs can reach these service-only functions from the browser.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'science\_%' escape '\' loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;

commit;
