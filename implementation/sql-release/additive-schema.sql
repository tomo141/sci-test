begin;
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('science-overhaul-install',0));
do $$ begin
  if to_regclass('public.science_items') is not null then raise exception 'science_schema_already_exists'; end if;
end $$;
create table science_migration_history(name text primary key,sha256 text not null,applied_at timestamptz not null default now());
alter table science_migration_history enable row level security;
revoke all on science_migration_history from public,anon,authenticated;
grant all on science_migration_history to service_role;
-- 0004_exam_modes_and_score_kinds.sql
alter table public.exam_sessions
  add column if not exists exam_mode text not null default 'overall' check (exam_mode in ('overall','domain')),
  add column if not exists target_domain text;

alter table public.score_history
  add column if not exists score_kind text not null default 'overall' check (score_kind in ('overall','domain')),
  add column if not exists domain text;

create index if not exists score_history_score_kind_domain_score_idx
  on public.score_history (score_kind, domain, score desc, answer_count desc);


insert into science_migration_history(name,sha256) values('0004_exam_modes_and_score_kinds.sql','651d2250079f2a1642aeed14012a46ff21c41ad0713b695cb303a23caa978603');

-- 0005_subdomain_exam.sql
alter table public.exam_sessions
  drop constraint if exists exam_sessions_exam_mode_check;
alter table public.exam_sessions
  add constraint exam_sessions_exam_mode_check
    check (exam_mode in ('overall','domain','subdomain'));
alter table public.exam_sessions
  add column if not exists target_subdomain text;

alter table public.score_history
  drop constraint if exists score_history_score_kind_check;
alter table public.score_history
  add constraint score_history_score_kind_check
    check (score_kind in ('overall','domain','subdomain'));
alter table public.score_history
  add column if not exists subdomain text;

create index if not exists score_history_subdomain_score_idx
  on public.score_history (score_kind, domain, subdomain, score desc, answer_count desc);

create table if not exists public.subdomain_release_status (
  domain text not null,
  subdomain text not null,
  is_released boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (domain, subdomain)
);

alter table public.subdomain_release_status enable row level security;

create policy "public can read subdomain release status"
  on public.subdomain_release_status for select
  using (true);

create policy "admins manage subdomain release status"
  on public.subdomain_release_status for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.subdomain_release_status (domain, subdomain, is_released)
select domain, unnest(subdomains), false
from (
  values
    ('数学', array['数と代数','線形代数','解析・微分積分','幾何・位相','確率・統計','論理・集合論','離散数学・組合せ','数値解析・最適化','情報数理','関数・数学基礎']::text[]),
    ('物理', array['力学','電磁気学','波動・光学・音響','熱・統計力学','量子力学','相対論・宇宙論','素粒子・場の理論','物性・固体物理','計測・プラズマ・重力波','物理の基礎・法則']::text[]),
    ('化学', array['有機化学','無機化学','物理化学','分析化学・分光','酸塩基・酸化還元・電気化学','化学結合・結晶・固体','反応速度・触媒・光化学','元素・周期表・原子','物質・化学式・量','理論・材料・高分子化学']::text[]),
    ('生物', array['分子生物学','遺伝学・ゲノム','細胞生物学','生化学・代謝','生理学・人体','免疫学','神経科学・行動','進化・発生','生態・分類','微生物・ウイルス・バイオテク']::text[]),
    ('地学', array['天文・宇宙','気象・大気','地震・地球物理','海洋・水文','地質・堆積・年代','地球化学・炭素循環','鉱物・岩石・結晶','プレート・地球内部・地殻','古気候・気候科学','資源・環境・防災・リモセン']::text[]),
    ('工学', array['機械工学','電気・電子工学','土木・地盤・防災','材料工学','制御・システム','情報通信工学','熱・流体工学','構造・材料力学','製造・生産・計測','化学・バイオ・微細加工']::text[]),
    ('農学', array['育種・分子育種','栽培・作物学','土壌・植物栄養','畜産・飼料','病害虫・植物病理','水産','食品科学','林学・草地・生態','園芸','農業工学・経済・農村計画']::text[]),
    ('情報・計算機科学', array['アルゴリズム・データ構造','データベース','ネットワーク・分散システム','プログラミング・言語・コンパイラ','セキュリティ・暗号','OS・ハードウェア・並列','計算理論・形式手法','AI・機械学習','Web・HCI・可視化','情報理論・倫理・その他']::text[]),
    ('医歯薬学', array['薬学・薬理','解剖学','生理学','生化学・分子医学','免疫学','微生物・感染症','病理・腫瘍学','歯学','臨床各科・診断','公衆衛生・法医・倫理']::text[]),
    ('人文社会科学', array['哲学・倫理学','社会学','経済学','心理学・認知科学','政治学・国際関係','歴史学・考古学','法学','地理学・人口学','統計学・科学哲学','言語・文学・教育・文化']::text[])
) as taxonomy(domain, subdomains)
on conflict (domain, subdomain) do nothing;


insert into science_migration_history(name,sha256) values('0005_subdomain_exam.sql','5b2a49cd98beb233ab12592780e185411954bf26c2a301afe8683d825623df7c');

-- 0006_science_overhaul.sql
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
  perform 1 from science_config where key='correction_epoch' for share;
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
  perform 1 from science_config where key='correction_epoch' for share;
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



insert into science_migration_history(name,sha256) values('0006_science_overhaul.sql','9ee7078f1ea5a91d2ca5251fc2702e03e9f980e030ed095c67903afcd17e4708');

-- 0008_science_account_operations.sql
create function public.science_update_consents(p_user uuid,p_preferences jsonb,p_operation uuid)
returns boolean language plpgsql set search_path=public as $$
declare v_topic text; wanted boolean; old boolean; previous jsonb;
begin
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'email_unverified'; end if;
  perform pg_advisory_xact_lock(hashtextextended('consent:'||p_user,0));
  select payload into previous from science_events where dedupe_key='consents:'||p_user||':'||p_operation;
  if found then
    if previous<>p_preferences then raise exception 'operation_reused' using errcode='40001'; end if;
    return true;
  end if;
  if jsonb_typeof(p_preferences)<>'object' or exists(select 1 from jsonb_object_keys(p_preferences) k where k not in ('science','weekly','domain_opening')) then raise exception 'invalid_topics'; end if;
  for v_topic in select jsonb_object_keys(p_preferences) loop
    if jsonb_typeof(p_preferences->v_topic)<>'boolean' then raise exception 'invalid_consent'; end if;
    wanted:=(p_preferences->>v_topic)::boolean;
    select enabled into old from science_consents where user_id=p_user and science_consents.topic=v_topic;
    insert into science_consents(user_id,topic,enabled,version) values(p_user,v_topic,wanted,'science-mail-v1')
      on conflict(user_id,topic) do update set enabled=excluded.enabled,version=excluded.version,updated_at=now();
    if wanted is distinct from coalesce(old,false) then
      insert into science_events(dedupe_key,event_name,user_id,payload) values('consent:'||p_user||':'||p_operation||':'||v_topic,case when wanted then 'mail_consent_granted' else 'mail_consent_revoked' end,p_user,jsonb_build_object('topic',v_topic,'version','science-mail-v1'));
    end if;
    if not wanted then
      update science_outbox set state='cancelled',processed_at=now() where user_id=p_user and payload->>'topic'=v_topic and state in ('pending','failed','blocked');
    end if;
    if v_topic='science' then
      update marketing_consents set consented=wanted,consented_at=case when wanted then now() else consented_at end where user_id=p_user;
      if wanted and not coalesce(old,false) then
        insert into science_outbox(dedupe_key,user_id,kind,payload) values('welcome:'||p_user,p_user,'mail',jsonb_build_object('topic','science','template','welcome')) on conflict do nothing;
        insert into science_outbox(dedupe_key,user_id,kind,payload,available_at) values('welcome2:'||p_user,p_user,'mail',jsonb_build_object('topic','science','template','next-exam'),now()+interval '3 days') on conflict do nothing;
      end if;
    end if;
  end loop;
  insert into science_events(dedupe_key,event_name,user_id,payload) values('consents:'||p_user||':'||p_operation,'consent_preferences_updated',p_user,p_preferences);
  return true;
end $$;
revoke all on function public.science_update_consents(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.science_update_consents(uuid,jsonb,uuid) to service_role;

create view public.science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,i.eligible,i.exclusion_reason,
    i.snapshot->>'domain' as domain,i.snapshot->>'subdomain' as subdomain,
    (i.snapshot->>'a')::double precision as a,(i.snapshot->>'b')::double precision as b,(i.snapshot->>'c')::double precision as c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=r.attempt_id;
revoke all on table public.science_responses from public,anon,authenticated;
grant select on table public.science_responses to service_role;


insert into science_migration_history(name,sha256) values('0008_science_account_operations.sql','6044462c2bb019c045df781f38e6260ee5d89c976bd4b4e925100059d33ff037');

-- 0009_science_results_and_badges.sql
create view public.science_personal_bests with(security_invoker=true) as
  select * from (
    select id,kind,domain,total,model_version,started_at,result,
      case when user_id is not null then 'user:'||user_id else 'visitor:'||visitor_id end as owner_key,
      row_number() over(partition by case when user_id is not null then 'user:'||user_id else 'visitor:'||visitor_id end,kind,coalesce(domain,''),total,model_version
        order by coalesce((result->>'total')::numeric,(result->'domains'->domain->>'score')::numeric) desc nulls last,completed_at,id) as best_order
    from science_attempts where state='completed' and not needs_recalculation and kind in ('trial','full','domain')
  ) ranked where best_order=1;
revoke all on table public.science_personal_bests from public,anon,authenticated;
grant select on table public.science_personal_bests to service_role;

create function public.science_award_badges(p_user uuid)
returns void language plpgsql set search_path=public as $$
begin
  if (select count(distinct domain) from science_responses where user_id=p_user and eligible)>=10 then
    insert into science_badges(user_id,code,evidence) values(p_user,'ten-domains','{"rule":"eligible answers in ten domains"}') on conflict do nothing;
  end if;
  if exists(select 1 from science_attempts where user_id=p_user and kind='full' and state='completed') then
    insert into science_badges(user_id,code,evidence) values(p_user,'first-full','{"rule":"completed full exam"}') on conflict do nothing;
  end if;
  if (select count(distinct week_id) from science_attempts where user_id=p_user and kind='weekly' and state='completed')>=3 then
    insert into science_badges(user_id,code,evidence) values(p_user,'weekly-three','{"rule":"completed in three distinct weeks"}') on conflict do nothing;
  end if;
  if (select count(distinct family_id) from science_responses where user_id=p_user and kind='lab')>=20 then
    insert into science_badges(user_id,code,evidence) values(p_user,'lab-explorer','{"rule":"answered twenty distinct lab families; participation only"}') on conflict do nothing;
  end if;
  if exists(select 1 from science_feedback where user_id=p_user and state='accepted' and resolved_by<>p_user and category<>'good') then
    insert into science_badges(user_id,code,evidence) values(p_user,'improvement','{"rule":"independently accepted improvement"}') on conflict do nothing;
  end if;
end $$;
revoke all on function public.science_award_badges(uuid) from public,anon,authenticated;
grant execute on function public.science_award_badges(uuid) to service_role;


insert into science_migration_history(name,sha256) values('0009_science_results_and_badges.sql','e4d59384d82344a54529cfafe78919a486502ec31e1f1ad8363e7128cc31d0b0');

-- 0010_science_rankings.sql
create function public.science_rankings(p_kind text,p_start timestamptz,p_end timestamptz,p_length int,p_model text,p_week text default null)
returns table(place bigint,nickname text,profile_id uuid,share_id uuid,score numeric,exam_length int,effective_length int)
language sql stable set search_path=public as $$
  with eligible as (
    select a.*,row_number() over(partition by a.user_id order by a.completed_at,a.id) as attempt_order
    from science_attempts a
    where a.kind=p_kind and a.state='completed' and a.competitive and a.user_id is not null
      and a.completed_at>=p_start and a.completed_at<p_end and a.total=p_length
      and a.model_version=p_model and (p_kind<>'weekly' or a.week_id=p_week)
  ), visible as (
    select p.nickname,case when p.is_public then p.public_id else null end as profile_id,s.id as share_id,
      case when p_kind='weekly' then (a.result->>'correctCount')::numeric else (a.result->>'total')::numeric end as score,a.total,coalesce((a.result->>'answerCount')::int,a.total) effective_length
    from eligible a join science_profiles p on p.user_id=a.user_id and p.ranking_opt_in
      left join science_shares s on s.attempt_id=a.id and s.enabled
    where a.attempt_order=1 and not a.needs_recalculation
  )
  select rank() over(order by visible.score desc) as place,visible.nickname,visible.profile_id,visible.share_id,visible.score,visible.total,visible.effective_length
  from visible where visible.score is not null and visible.effective_length>0 order by visible.score desc,visible.nickname,visible.profile_id limit 100;
$$;
revoke all on function public.science_rankings(text,timestamptz,timestamptz,int,text,text) from public,anon,authenticated;
grant execute on function public.science_rankings(text,timestamptz,timestamptz,int,text,text) to service_role;


insert into science_migration_history(name,sha256) values('0010_science_rankings.sql','2ff9d6a30a4cab347dfe285ba733bf38e2f9cdd7844e8b4f221ee54c91387c2e');

-- 0011_science_community.sql
alter table science_submission_drafts add column revision int not null default 0;
alter table science_submission_drafts add column parent_revision_id uuid references science_items(id);
alter table science_submission_drafts add column author_credit text not null default '' check(length(author_credit)<=30);
alter table science_submission_drafts add column ai_assisted boolean not null default false;
alter table science_items add column credit_name text not null default '' check(length(credit_name)<=30);
alter table science_items add column ai_assisted boolean not null default false;
create table science_license_acceptances (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  draft_id uuid not null references science_submission_drafts(id), license_version text not null,
  revision_id uuid not null references science_items(id),
  representations jsonb not null, accepted_at timestamptz not null default now(), unique(revision_id)
);
create table science_current_estimates (
  user_id uuid primary key references auth.users(id) on delete cascade, version text not null,
  result jsonb not null, through_at timestamptz, updated_at timestamptz not null default now()
);
alter table science_license_acceptances enable row level security;
alter table science_current_estimates enable row level security;
revoke all on science_license_acceptances,science_current_estimates from public,anon,authenticated;
grant all on science_license_acceptances,science_current_estimates to service_role;

create function science_submit_draft(p_draft uuid,p_user uuid,p_revision int,p_family text,p_license text,p_representations jsonb)
returns uuid language plpgsql set search_path=public as $$
declare d science_submission_drafts; q uuid; settings jsonb; next_version int;
begin
  select value into settings from science_config where key='release';
  if not coalesce((settings->>'labSubmissions')::boolean,false) or p_license is distinct from settings->>'licenseVersion' then raise exception 'submission_not_open'; end if;
  select * into d from science_submission_drafts where id=p_draft and author_id=p_user for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if p_family<>'community:'||d.id then raise exception 'invalid_family'; end if;
  if d.state not in ('draft','changes_requested') or d.revision<>p_revision then raise exception 'stale_draft' using errcode='40001'; end if;
  if not coalesce((p_representations->>'rights')::boolean,false) or not coalesce((p_representations->>'adultOrGuardianConsent')::boolean,false) then raise exception 'representations_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('family:'||p_family,0));
  select coalesce(max(version),0)+1 into next_version from science_items where family_id=p_family;
  insert into science_items(family_id,version,author_id,domain,subdomain,content,status,license_version,credit_name,ai_assisted)
    values(p_family,next_version,p_user,d.domain,d.subdomain,d.content,'submitted',p_license,d.author_credit,d.ai_assisted) returning id into q;
  update science_submission_drafts set state='submitted',revision=revision+1,revision_id=q,license_version=p_license,license_accepted_at=now(),updated_at=now() where id=d.id;
  insert into science_license_acceptances(user_id,draft_id,revision_id,license_version,representations) values(p_user,d.id,q,p_license,p_representations);
  insert into science_exposures(visitor_id,family_id,user_id,reason)
    select id,p_family,p_user,'author' from science_visitors where user_id=p_user on conflict do nothing;
  insert into science_events(dedupe_key,event_name,user_id,payload) values('submitted:'||q,'question_submitted',p_user,jsonb_build_object('revisionId',q));
  return q;
end $$;

create function science_review_submission(p_draft uuid,p_admin uuid,p_decision text,p_reason text,p_checks jsonb)
returns boolean language plpgsql set search_path=public as $$
declare d science_submission_drafts; target_state text;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'forbidden'; end if;
  if p_decision not in ('lab','adopted','changes_requested','rejected') or length(trim(p_reason))<5 then raise exception 'invalid_review'; end if;
  select * into d from science_submission_drafts where id=p_draft for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  if d.state not in ('submitted','lab') then raise exception 'stale_draft' using errcode='40001'; end if;
  if p_decision='adopted' and d.author_id=p_admin then raise exception 'independent_review_required'; end if;
  if p_decision in ('lab','adopted') and (not coalesce((p_checks->>'rights')::boolean,false) or not coalesce((p_checks->>'source')::boolean,false) or not coalesce((p_checks->>'uniqueAnswer')::boolean,false) or not coalesce((p_checks->>'explanation')::boolean,false)) then raise exception 'checks_required'; end if;
  target_state:=case p_decision when 'lab' then 'lab' when 'adopted' then 'published' when 'rejected' then 'retired' else 'held' end;
  update science_items set status=target_state,rights_checked=p_decision in ('lab','adopted'),quality_passed=p_decision='adopted',review_evidence=jsonb_build_object('checks',p_checks,'reason',p_reason,'reviewer',p_admin,'reviewedAt',now()) where id=d.revision_id;
  update science_submission_drafts set state=p_decision,review_note=p_reason,updated_at=now() where id=d.id;
  if p_decision='adopted' then
    insert into science_trust_evidence(user_id,domain,role,positive,source_key,reason,reviewer_id) values(d.author_id,d.domain,'author',true,'adopted:'||d.revision_id,p_reason,p_admin) on conflict do nothing;
    insert into science_events(dedupe_key,event_name,user_id,payload) values('adopted:'||d.revision_id,'question_adopted',d.author_id,jsonb_build_object('revisionId',d.revision_id)) on conflict do nothing;
  end if;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'submission_'||p_decision,d.id::text,p_reason,p_checks);
  insert into science_outbox(dedupe_key,user_id,kind,payload) values('submission:'||d.id||':'||p_decision,d.author_id,'submission_status',jsonb_build_object('draftId',d.id,'state',p_decision)) on conflict do nothing;
  return true;
end $$;

create function science_resolve_feedback(p_feedback uuid,p_admin uuid,p_state text,p_reason text,p_quality text,p_hold boolean)
returns boolean language plpgsql set search_path=public as $$
declare f science_feedback; q science_items;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'forbidden'; end if;
  if p_state not in ('accepted','rejected') or p_quality not in ('positive','negative','none') or length(trim(p_reason))<5 then raise exception 'invalid_review'; end if;
  if (p_quality='positive' and p_state<>'accepted') or (p_quality='negative' and p_state<>'rejected') then raise exception 'invalid_quality_verdict'; end if;
  select * into f from science_feedback where id=p_feedback for update;
  if not found then raise exception 'not_found' using errcode='P0002'; end if;
  select * into q from science_items where id=f.revision_id;
  if f.user_id=p_admin or q.author_id=p_admin then raise exception 'independent_review_required'; end if;
  if f.state<>'pending' then raise exception 'already_resolved' using errcode='40001'; end if;
  update science_feedback set state=p_state,resolved_by=p_admin,resolution=p_reason,resolved_at=now() where id=f.id;
  if f.user_id is not null and p_quality<>'none' then
    insert into science_trust_evidence(user_id,domain,role,positive,source_key,reason,reviewer_id)
      values(f.user_id,q.domain,'reviewer',p_quality='positive','feedback:'||f.id,p_reason,p_admin) on conflict do nothing;
  end if;
  if p_hold then update science_items set status='held' where id=q.id; end if;
  insert into science_events(dedupe_key,event_name,user_id,payload) values('resolved:'||f.id,'feedback_resolved',f.user_id,jsonb_build_object('state',p_state,'revisionId',q.id));
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'feedback_resolved',f.id::text,p_reason,jsonb_build_object('state',p_state,'qualityVerdict',p_quality,'held',p_hold));
  return true;
end $$;

create function science_immutable_content()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.content is distinct from old.content or new.family_id is distinct from old.family_id or new.version is distinct from old.version or new.domain is distinct from old.domain or new.subdomain is distinct from old.subdomain then raise exception 'create_a_new_revision'; end if;
  return new;
end $$;
create trigger science_items_immutable before update on science_items for each row execute function science_immutable_content();

do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('science_submit_draft','science_review_submission','science_resolve_feedback','science_immutable_content') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;


insert into science_migration_history(name,sha256) values('0011_science_community.sql','9689274c0272d990ee218daa093c129e920d23a03973a47bc4f0bc2e9090b9ff');

-- 0012_science_admin_metrics.sql
create function science_admin_metrics()
returns table(label text,value bigint) language sql stable set search_path=public as $$
  select '確認済みアカウント',count(*) from science_profiles
  union all select '科学メールの配信同意',count(*) from science_consents where topic='science' and enabled
  union all select '完了した受験',count(*) from science_attempts where state='completed'
  union all select '公開中の共有結果',count(*) from science_shares where enabled
  union all select '確認待ちの投稿',count(*) from science_submission_drafts where state='submitted'
  union all select '確認待ちの改善報告',count(*) from science_feedback where state='pending'
  union all select '正式問題のリビジョン',count(*) from science_items where status='published' and quality_passed and rights_checked
  union all select '停止・失敗中の配信処理',count(*) from science_outbox where state in ('blocked','failed');
$$;
revoke all on function science_admin_metrics() from public,anon,authenticated;
grant execute on function science_admin_metrics() to service_role;


insert into science_migration_history(name,sha256) values('0012_science_admin_metrics.sql','aed7aa32917b9a2a7bedbd5fb8936af8cd1a32984c1f1bc3a1d133e64090af33');

-- 0013_science_review_collection.sql
create table science_review_marks(
  user_id uuid not null references auth.users(id) on delete cascade,revision_id uuid not null references science_items(id),
  streak int not null default 0 check(streak between 0 and 5),reviewed_at timestamptz not null default now(),due_at timestamptz not null,
  operation_id uuid not null unique,primary key(user_id,revision_id)
);
alter table science_review_marks enable row level security;
revoke all on science_review_marks from public,anon,authenticated;
grant all on science_review_marks to service_role;
create function science_review_collection(p_user uuid,p_mode text,p_page int)
returns table(revision_id uuid,attempt_id uuid,ordinal int,domain text,content jsonb,is_correct boolean,selected_index int,bookmarked boolean,total bigint)
language sql stable set search_path=public as $$
  with available as (
    select distinct on(i.family_id) i.revision_id,i.attempt_id,i.ordinal,i.snapshot->>'domain' domain,i.snapshot->'content' content,r.is_correct,(i.choice_order->>r.selected_index)::int selected_index,
      (b.user_id is not null) bookmarked,r.answered_at,m.due_at
    from science_issued i join science_answers r using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
    left join science_bookmarks b on b.revision_id=i.revision_id and b.user_id=p_user
    left join science_review_marks m on m.revision_id=i.revision_id and m.user_id=p_user
    where a.user_id=p_user and (a.state='completed' or a.kind='lab')
    order by i.family_id,r.answered_at desc,i.attempt_id
  ),filtered as (
    select * from available where (p_mode='bookmarks' and bookmarked) or (p_mode='mistakes' and not is_correct and (due_at is null or due_at<=now()))
  )
  select revision_id,attempt_id,ordinal,domain,content,is_correct,selected_index,bookmarked,count(*) over() from filtered order by coalesce(due_at,answered_at),revision_id limit 5 offset greatest(0,least(p_page,10000))*5;
$$;
create function science_mark_review(p_user uuid,p_revision uuid,p_remembered boolean,p_operation uuid)
returns boolean language plpgsql set search_path=public as $$
declare n int; previous science_review_marks;
begin
  if not exists(select 1 from science_issued i join science_answers r using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id where a.user_id=p_user and i.revision_id=p_revision and (a.state='completed' or a.kind='lab')) then raise exception 'not_found' using errcode='P0002'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user||':'||p_revision,0));
  select * into previous from science_review_marks where user_id=p_user and revision_id=p_revision for update;
  if previous.operation_id=p_operation then return true; end if;
  n:=case when p_remembered then least(5,coalesce(previous.streak,0)+1) else 0 end;
  insert into science_review_marks(user_id,revision_id,streak,reviewed_at,due_at,operation_id)
    values(p_user,p_revision,n,now(),now()+make_interval(days=>(array[1,3,7,14,30,60])[n+1]),p_operation)
    on conflict(user_id,revision_id) do update set streak=excluded.streak,reviewed_at=excluded.reviewed_at,due_at=excluded.due_at,operation_id=excluded.operation_id;
  return true;
end $$;
revoke all on function science_review_collection(uuid,text,int),science_mark_review(uuid,uuid,boolean,uuid) from public,anon,authenticated;
grant execute on function science_review_collection(uuid,text,int),science_mark_review(uuid,uuid,boolean,uuid) to service_role;


insert into science_migration_history(name,sha256) values('0013_science_review_collection.sql','9ecf9a065eb2153b469bd7a62d6ab13ef2d832f4fc925be8b89a18b7729ef205');

-- 0014_science_release_operations.sql
create function science_valid_content(value jsonb) returns boolean language sql immutable as $$
  select coalesce(jsonb_typeof(value)='object' and jsonb_typeof(value->'choices')='array'
    and jsonb_array_length(value->'choices')=4 and length(trim(value->>'question'))>0 and length(trim(value->>'explanation'))>0
    and jsonb_typeof(value->'correctIndex')='number' and value->>'correctIndex' in ('0','1','2','3')
    and (select count(*)=4 and count(distinct lower(trim(c)))=4 and min(length(trim(c)))>0 from jsonb_array_elements_text(value->'choices') as t(c)),false);
$$;
alter table science_items add constraint science_complete_content check(science_valid_content(content));
create function science_guard_release_items() returns trigger language plpgsql set search_path=public as $$
declare r uuid;
begin
  r:=case when tg_op='DELETE' then old.release_id else new.release_id end;
  if exists(select 1 from science_releases where id=r and state<>'candidate') then raise exception 'release_is_frozen'; end if;
  if tg_op='UPDATE' and old.release_id<>new.release_id then raise exception 'release_is_frozen'; end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger science_release_items_frozen before insert or update or delete on science_release_items for each row execute function science_guard_release_items();
create function science_activate_release(p_release uuid,p_actor uuid,p_reason text)
returns boolean language plpgsql set search_path=public as $$
declare r science_releases;previous_id uuid;d text;domain_count int;
begin
  if length(trim(p_reason))<5 then raise exception 'reason_required'; end if;
  if p_actor is not null and not exists(select 1 from science_admins where user_id=p_actor) then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtextextended('science-active-release',0));
  select * into r from science_releases where id=p_release for update;
  if not found or r.state not in ('candidate','retired') then raise exception 'invalid_release'; end if;
  select id into previous_id from science_releases where state='active';
  if p_actor is null and (r.state<>'candidate' or r.validation->>'automaticBUpdate' is distinct from 'passed' or r.settings->>'parentRelease' is distinct from previous_id::text) then raise exception 'automatic_validation_required'; end if;
  if exists(select q.family_id from science_release_items ri join science_items q on q.id=ri.revision_id where ri.release_id=r.id group by q.family_id having count(*)>1) then raise exception 'duplicate_family'; end if;
  if exists(select 1 from science_release_items ri join science_items q on q.id=ri.revision_id where ri.release_id=r.id and (q.status<>'published' or not q.quality_passed or not q.rights_checked or q.expires_at<=now())) then raise exception 'item_not_approved'; end if;
  foreach d in array array['数学','物理','化学','生物','地学','工学','農学','情報・計算機科学','医歯薬学','人文社会科学'] loop
    select count(*) into domain_count from science_release_items ri join science_items q on q.id=ri.revision_id where ri.release_id=r.id and q.domain=d;
    if domain_count<100 then raise exception 'domain_capacity_below_100'; end if;
  end loop;
  update science_releases set state='retired' where state='active';
  update science_releases set state='active',activated_at=now() where id=r.id;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_actor,'release_activated',r.id::text,p_reason,jsonb_build_object('previous',previous_id,'validation',r.validation));
  return true;
end $$;
create function science_publish_week(p_id text,p_starts timestamptz,p_ends timestamptz,p_revisions uuid[])
returns boolean language plpgsql set search_path=public as $$
begin
  if exists(select 1 from science_weekly_sets where id=p_id) then return false; end if;
  if cardinality(p_revisions)<>10 or p_ends<>p_starts+interval '7 days' or date_trunc('week',p_starts at time zone 'Asia/Tokyo')<>p_starts at time zone 'Asia/Tokyo' then raise exception 'invalid_week'; end if;
  if (select count(distinct domain)=10 and count(distinct family_id)=10 and count(*)=10 from science_items where id=any(p_revisions) and status='published' and quality_passed and rights_checked and (expires_at is null or expires_at>=p_ends)) is not true then raise exception 'invalid_weekly_items'; end if;
  insert into science_weekly_sets(id,starts_at,ends_at,revision_ids) values(p_id,p_starts,p_ends,p_revisions) on conflict do nothing;
  return found;
end $$;
create function science_assignment_event() returns trigger language plpgsql set search_path=public as $$
begin
  insert into science_events(dedupe_key,event_name,visitor_id,payload) values('assigned:'||new.id,'experiment_assigned',new.id,jsonb_build_object('group',new.route_group,'experiment',new.experiment));return new;
end $$;
create trigger science_visitor_assigned after insert on science_visitors for each row execute function science_assignment_event();
create table science_job_leases(kind text primary key,job_id uuid not null references science_jobs(id),expires_at timestamptz not null);
create table science_notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,source_id uuid not null unique references science_outbox(id),kind text not null,payload jsonb not null,created_at timestamptz not null default now());
alter table science_job_leases enable row level security;
alter table science_notifications enable row level security;
revoke all on science_job_leases,science_notifications from public,anon,authenticated;
grant all on science_job_leases,science_notifications to service_role;
create function science_begin_job(p_kind text) returns uuid language plpgsql set search_path=public as $$
declare job uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('job:'||p_kind,0));
  if exists(select 1 from science_job_leases where kind=p_kind and expires_at>now()) then return null; end if;
  insert into science_jobs(kind,state,observed_to) values(p_kind,'running',now()) returning id into job;
  insert into science_job_leases(kind,job_id,expires_at) values(p_kind,job,now()+interval '5 minutes') on conflict(kind) do update set job_id=excluded.job_id,expires_at=excluded.expires_at;
  return job;
end $$;
create function science_end_job(p_job uuid,p_state text,p_summary jsonb) returns boolean language plpgsql set search_path=public as $$
begin
  update science_jobs set state=p_state,summary=p_summary,finished_at=now() where id=p_job and state='running';
  delete from science_job_leases where job_id=p_job;
  return found;
end $$;
create function science_store_current(p_user uuid,p_result jsonb,p_through timestamptz) returns boolean language plpgsql set search_path=public as $$
begin
  insert into science_current_estimates(user_id,version,result,through_at) values(p_user,p_result->>'version',p_result,p_through)
    on conflict(user_id) do update set version=excluded.version,result=excluded.result,through_at=excluded.through_at,updated_at=now()
    where coalesce(science_current_estimates.through_at,'-infinity'::timestamptz)<=coalesce(excluded.through_at,'-infinity'::timestamptz);
  return true;
end $$;
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('science_valid_content','science_guard_release_items','science_activate_release','science_publish_week','science_assignment_event','science_begin_job','science_end_job','science_store_current') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;


insert into science_migration_history(name,sha256) values('0014_science_release_operations.sql','75fcd91e7723eaf1ddc232717fe53c910bd6e4bbb9f49a7e1775cf0d855101b7');

-- 0015_science_experiment_analysis.sql
create function science_experiment_results(p_from timestamptz,p_to timestamptz,p_experiment text)
returns table(route_group text,starters bigint,mature_starters bigint,verified_7d bigint,registrations_7d bigint,share_registrations_7d bigint,completions_7d bigint,shared_7d bigint,withdrawn bigint,mixed_assignment bigint)
language sql stable set search_path=public as $$
  with first_trial as (
    select distinct on(case when a.user_id is null then 'visitor:'||a.visitor_id else 'user:'||a.user_id end)
      a.id,a.visitor_id,a.user_id,a.started_at,v.ref_share,e.payload->>'group' grp
    from science_attempts a join science_visitors v on v.id=a.visitor_id
    join science_events e on e.dedupe_key='started:'||a.id
    left join science_profiles p on p.user_id=a.user_id
    where a.kind='trial' and v.experiment=p_experiment and (p.user_id is null or p.created_at>a.started_at)
    order by case when a.user_id is null then 'visitor:'||a.visitor_id else 'user:'||a.user_id end,a.started_at,a.id
  ),cohort as (
    select f.*,f.started_at<=now()-interval '7 days' mature,
      exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='email_verified' and e.created_at between f.started_at and f.started_at+interval '7 days') verified,
      coalesce((select e.event_name='mail_consent_granted' from science_events e where e.user_id=f.user_id and e.event_name in ('mail_consent_granted','mail_consent_revoked') and e.payload->>'topic'='science' and e.created_at<=f.started_at+interval '7 days' order by e.created_at desc,e.id desc limit 1),false) consented,
      exists(select 1 from science_events e where e.attempt_id=f.id and e.event_name='attempt_completed' and e.created_at<=f.started_at+interval '7 days') completed,
      exists(select 1 from science_events e where e.attempt_id=f.id and e.event_name='share_created' and e.created_at<=f.started_at+interval '7 days') shared,
      exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='mail_consent_revoked' and e.payload->>'topic'='science') withdrawn,
      exists(select 1 from science_events e where e.user_id=f.user_id and e.event_name='assignment_merged' and e.payload->>'originalGroup' is distinct from e.payload->>'canonicalGroup') mixed,
      exists(select 1 from science_shares s join science_attempts a on a.id=s.attempt_id where s.id=f.ref_share and a.user_id is distinct from f.user_id) referred
    from first_trial f where f.started_at>=p_from and f.started_at<p_to
  )
  select g.grp,count(c.id),count(c.id) filter(where mature),count(c.id) filter(where mature and verified),
    count(c.id) filter(where mature and verified and consented),count(c.id) filter(where mature and verified and consented and referred),
    count(c.id) filter(where mature and completed),count(c.id) filter(where mature and shared),count(c.id) filter(where withdrawn),count(c.id) filter(where mixed)
  from (values('A'),('B'),('C'),('D')) g(grp) left join cohort c on c.grp=g.grp group by g.grp order by g.grp;
$$;
revoke all on function science_experiment_results(timestamptz,timestamptz,text) from public,anon,authenticated;
grant execute on function science_experiment_results(timestamptz,timestamptz,text) to service_role;


insert into science_migration_history(name,sha256) values('0015_science_experiment_analysis.sql','503344b2c6bbdcb781ca889541b0a7fbdd956636d2bc61b67a2583393a969e37');

-- 0016_science_calibration_candidates.sql
create table science_calibration_candidates(
  id uuid primary key default gen_random_uuid(),revision_id uuid not null references science_items(id),release_id uuid not null references science_releases(id),
  data_version text not null,observed_from timestamptz,observed_to timestamptz not null,fit jsonb not null,
  state text not null check(state in ('collecting','rejected','qualified','applied')),created_at timestamptz not null default now(),unique(revision_id,release_id,data_version)
);
alter table science_calibration_candidates enable row level security;
revoke all on science_calibration_candidates from public,anon,authenticated;
grant all on science_calibration_candidates to service_role;
create function science_apply_calibration(p_parent uuid,p_candidates uuid[],p_job uuid)
returns uuid language plpgsql set search_path=public as $$
declare r uuid;parent science_releases;fit_candidate science_calibration_candidates;
begin
  perform pg_advisory_xact_lock(hashtextextended('science-active-release',0));
  select * into parent from science_releases where id=p_parent and state='active';
  if not found or cardinality(p_candidates)<1 then raise exception 'stale_calibration'; end if;
  if not exists(select 1 from science_jobs where id=p_job and state='running') then raise exception 'job_required'; end if;
  if not coalesce((select (value->>'automaticCalibration')::boolean from science_config where key='release'),false) then raise exception 'automatic_calibration_disabled'; end if;
  if (select count(*) from science_calibration_candidates where id=any(p_candidates) and release_id=p_parent and state='qualified' and (fit->>'eligible')::boolean)=cardinality(p_candidates) is not true then raise exception 'validation_required'; end if;
  insert into science_releases(name,model_version,settings,validation)
    values('Difficulty calibration '||current_date,parent.model_version,parent.settings||jsonb_build_object('parentRelease',p_parent),jsonb_build_object('automaticBUpdate','passed','jobId',p_job,'candidates',p_candidates)) returning id into r;
  insert into science_release_items(release_id,revision_id,a,b,c,focus,anchor,parameter_evidence)
    select r,revision_id,a,b,c,focus,anchor,parameter_evidence from science_release_items where release_id=p_parent;
  for fit_candidate in select * from science_calibration_candidates where id=any(p_candidates) loop
    if not exists(select 1 from science_release_items where release_id=r and revision_id=fit_candidate.revision_id and not anchor and abs(b-(fit_candidate.fit->>'b')::float8)<=.500001 and a=(fit_candidate.fit->>'a')::float8 and science_release_items.c=(fit_candidate.fit->>'c')::float8) then raise exception 'parameter_guard_failed'; end if;
    update science_release_items set b=(fit_candidate.fit->>'b')::float8,focus=false,parameter_evidence=fit_candidate.fit||jsonb_build_object('candidateId',fit_candidate.id) where release_id=r and revision_id=fit_candidate.revision_id;
  end loop;
  -- Move the freed focus slots to questions with the least accumulated evidence in each domain.
  with slots as (select q.domain,count(*) n from science_calibration_candidates c join science_items q on q.id=c.revision_id where c.id=any(p_candidates) group by q.domain),
  ranked as (select ri.revision_id,row_number() over(partition by q.domain order by coalesce((ri.parameter_evidence->>'count')::int,0),q.id) rank,s.n
    from science_release_items ri join science_items q on q.id=ri.revision_id join slots s on s.domain=q.domain
    where ri.release_id=r and not ri.anchor and not ri.focus and ri.revision_id not in (select revision_id from science_calibration_candidates where id=any(p_candidates)))
  update science_release_items set focus=true where release_id=r and revision_id in (select revision_id from ranked where rank<=n);
  perform science_activate_release(r,null,'Held-out difficulty prediction, coverage and score-change guards passed');
  update science_calibration_candidates set state='applied' where id=any(p_candidates);
  return r;
end $$;
revoke all on function science_apply_calibration(uuid,uuid[],uuid) from public,anon,authenticated;
grant execute on function science_apply_calibration(uuid,uuid[],uuid) to service_role;


insert into science_migration_history(name,sha256) values('0016_science_calibration_candidates.sql','cc97af1cbbe16fb8bb6cbae0fbc3dd57fd0dbca8640da43f867dab164992574b');

-- 0017_science_corrections.sql
insert into science_config(key,value) values('correction_epoch','0');
create table science_correction_proposals(
  id uuid primary key default gen_random_uuid(),source_revision uuid not null references science_items(id),
  replacement_revision uuid not null unique references science_items(id),
  mode text not null check(mode in ('exclude','explanation')),
  reason text not null check(length(reason) between 5 and 2000),
  created_by uuid references auth.users(id),approved_by uuid references auth.users(id),
  state text not null default 'pending' check(state in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),approved_at timestamptz,
  check(source_revision<>replacement_revision),check(approved_by is null or approved_by is distinct from created_by)
);
create unique index science_one_correction on science_correction_proposals(source_revision) where state='approved';
create table science_result_revisions(
  attempt_id uuid not null references science_attempts(id),revision int not null,
  result jsonb not null,created_at timestamptz not null default now(),primary key(attempt_id,revision)
);
alter table science_correction_proposals enable row level security;
alter table science_result_revisions enable row level security;
revoke all on science_correction_proposals,science_result_revisions from public,anon,authenticated;
grant all on science_correction_proposals,science_result_revisions to service_role;

create view science_revision_updates with(security_invoker=true) as
  with recursive chain as (
    select source_revision, replacement_revision, mode='exclude' excluded,reason,approved_at,1 depth
    from science_correction_proposals where state='approved'
    union all
    select c.source_revision,p.replacement_revision,c.excluded or p.mode='exclude',c.reason||E'\n'||p.reason,p.approved_at,c.depth+1
    from chain c join science_correction_proposals p on p.source_revision=c.replacement_revision and p.state='approved'
  )
  select distinct on(source_revision) c.source_revision,c.replacement_revision,c.excluded,c.reason,c.approved_at,i.content,i.credit_name
  from chain c join science_items i on i.id=c.replacement_revision order by source_revision,depth desc;
revoke all on science_revision_updates from public,anon,authenticated;
grant select on science_revision_updates to service_role;

create function science_correction_epoch() returns int language sql stable set search_path=public as $$
  select value::text::int from science_config where key='correction_epoch';
$$;

create function science_propose_correction(p_source uuid,p_admin uuid,p_content jsonb,p_mode text,p_reason text)
returns uuid language plpgsql set search_path=public as $$
declare q science_items; replacement uuid; proposal uuid;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  select * into q from science_items where id=p_source for update;
  if not found or q.status not in ('published','lab','held') then raise exception 'not_found'; end if;
  if p_mode not in ('exclude','explanation') or length(trim(p_reason))<5 or not science_valid_content(p_content) then raise exception 'invalid_correction'; end if;
  if p_mode='explanation' and (p_content->'question'<>q.content->'question' or p_content->'choices'<>q.content->'choices' or p_content->'correctIndex'<>q.content->'correctIndex') then raise exception 'scoring_change_requires_exclusion'; end if;
  perform pg_advisory_xact_lock(hashtextextended('family:'||q.family_id,0));
  insert into science_items(family_id,version,legacy_id,author_id,domain,subdomain,content,status,license_version,credit_name,ai_assisted)
    select q.family_id,coalesce(max(version),0)+1,q.legacy_id,q.author_id,q.domain,q.subdomain,p_content,'draft',q.license_version,q.credit_name,q.ai_assisted from science_items where family_id=q.family_id returning id into replacement;
  insert into science_correction_proposals(source_revision,replacement_revision,mode,reason,created_by) values(p_source,replacement,p_mode,p_reason,p_admin) returning id into proposal;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'correction_proposed',p_source::text,p_reason,jsonb_build_object('proposal',proposal));
  return proposal;
end $$;

create function science_approve_correction(p_id uuid,p_admin uuid,p_checks jsonb)
returns int language plpgsql set search_path=public as $$
declare p science_correction_proposals;q science_items;epoch int;
begin
  if not exists(select 1 from science_admins where user_id=p_admin) then raise exception 'admin_required'; end if;
  select * into p from science_correction_proposals where id=p_id for update;
  if not found or p.state<>'pending' then raise exception 'not_pending'; end if;
  if p.created_by=p_admin then raise exception 'independent_review_required'; end if;
  if not coalesce((p_checks->>'rights')::boolean,false) or not coalesce((p_checks->>'source')::boolean,false) or not coalesce((p_checks->>'uniqueAnswer')::boolean,false) or not coalesce((p_checks->>'explanation')::boolean,false) then raise exception 'review_required'; end if;
  -- Lock the epoch against final answer/result commits before changing effective records.
  perform 1 from science_config where key='correction_epoch' for update;
  select * into q from science_items where id=p.source_revision for update;
  if q.author_id=p_admin then raise exception 'independent_review_required'; end if;
  update science_correction_proposals set state='approved',approved_by=p_admin,approved_at=now() where id=p.id;
  update science_items set status=case when q.status='lab' then 'lab' else 'published' end,quality_passed=true,rights_checked=true,
    review_evidence=jsonb_build_object('proposal',p.id,'reviewer',p_admin,'checks',p_checks) where id=p.replacement_revision;
  update science_items set status='held' where id=p.source_revision;
  update science_config set value=to_jsonb(value::text::int+1),updated_at=now() where key='correction_epoch' returning value::text::int into epoch;
  update science_attempts a set needs_recalculation=true where a.state='completed' and exists(
    select 1 from science_issued i join science_revision_updates c on c.source_revision=i.revision_id where i.attempt_id=a.id);
  delete from science_current_estimates where user_id in (select distinct user_id from science_attempts where needs_recalculation);
  update science_review_marks set streak=0,due_at=now() where revision_id in (select source_revision from science_revision_updates);
  insert into science_audit(actor_id,action,target,reason,detail) values(p_admin,'correction_approved',p.source_revision::text,p.reason,jsonb_build_object('proposal',p.id,'epoch',epoch));
  return epoch;
end $$;

create function science_result_history() returns trigger language plpgsql set search_path=public as $$
begin
  if new.result is not null and (tg_op='INSERT' or old.result is distinct from new.result) then
    new.result_revision:=case when tg_op='INSERT' or old.result is null then 1 else old.result_revision+1 end;
    insert into science_result_revisions(attempt_id,revision,result) values(new.id,new.result_revision,new.result);
  end if;
  return new;
end $$;
-- AFTER inserts are necessary because a new result references its parent attempt.
create function science_initial_result_history() returns trigger language plpgsql set search_path=public as $$
begin
  if new.result is not null then insert into science_result_revisions(attempt_id,revision,result) values(new.id,new.result_revision,new.result); end if;
  return new;
end $$;
create trigger science_result_update_history before update of result on science_attempts for each row execute function science_result_history();
create trigger science_result_insert_history after insert on science_attempts for each row execute function science_initial_result_history();

create function science_store_corrected_result(p_attempt uuid,p_result jsonb,p_previous int,p_epoch int)
returns boolean language plpgsql set search_path=public as $$
declare a science_attempts;
begin
  perform 1 from science_config where key='correction_epoch' for share;
  if p_epoch<>science_correction_epoch() then return false; end if;
  select * into a from science_attempts where id=p_attempt for update;
  if not found or a.state<>'completed' or not a.needs_recalculation or a.result_revision<>p_previous then return false; end if;
  if (p_result->>'originalAnswerCount')::int<>a.total or (p_result->>'correctionEpoch')::int<>p_epoch or p_result->>'version'<>a.model_version then raise exception 'invalid_result'; end if;
  update science_attempts set result=p_result,needs_recalculation=false where id=a.id;
  if a.user_id is not null then
    insert into science_outbox(dedupe_key,user_id,kind,payload) values('correction:'||a.id||':'||p_epoch,a.user_id,'result_correction',jsonb_build_object('attemptId',a.id,'label',a.definition->>'label')) on conflict do nothing;
  end if;
  return true;
end $$;

create or replace view science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,
    i.eligible and not coalesce(c.excluded,false) eligible,case when c.excluded then 'question_withdrawn' else i.exclusion_reason end exclusion_reason,
    i.snapshot->>'domain' domain,i.snapshot->>'subdomain' subdomain,
    (i.snapshot->>'a')::double precision a,(i.snapshot->>'b')::double precision b,(i.snapshot->>'c')::double precision c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
  left join science_revision_updates c on c.source_revision=i.revision_id;

alter table science_current_estimates add column correction_epoch int not null default 0;
drop function science_store_current(uuid,jsonb,timestamptz);
create function science_store_current(p_user uuid,p_result jsonb,p_through timestamptz,p_epoch int default 0)
returns boolean language plpgsql set search_path=public as $$
begin
  perform 1 from science_config where key='correction_epoch' for share;
  if p_epoch<>science_correction_epoch() then return false; end if;
  insert into science_current_estimates(user_id,version,result,through_at,correction_epoch) values(p_user,p_result->>'version',p_result,p_through,p_epoch)
    on conflict(user_id) do update set version=excluded.version,result=excluded.result,through_at=excluded.through_at,correction_epoch=excluded.correction_epoch,updated_at=now()
    where science_current_estimates.correction_epoch<excluded.correction_epoch or (science_current_estimates.correction_epoch=excluded.correction_epoch and coalesce(science_current_estimates.through_at,'-infinity'::timestamptz)<=coalesce(excluded.through_at,'-infinity'::timestamptz));
  return true;
end $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('science_correction_epoch','science_propose_correction','science_approve_correction','science_result_history','science_initial_result_history','science_store_corrected_result','science_store_current') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;


insert into science_migration_history(name,sha256) values('0017_science_corrections.sql','99593d1e5351eac25e3d46e8a91164bf6bc349dca3a95f6dfa87701d93b665a3');

-- 0018_science_quality_watch.sql
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


insert into science_migration_history(name,sha256) values('0018_science_quality_watch.sql','68dff7ff26c16c71e7aed28e38a6d09f4fe23f9d18b7a372e9415a7b8c115196');

-- 0019_science_identity_exposure.sql
-- Several legacy IDs may name one reviewed family. Preserve that history across rewrites.
create table science_legacy_families(
  question_id uuid primary key references questions(id),family_id text not null,
  reason text not null check(length(trim(reason))>=5),created_at timestamptz not null default now()
);
create index science_legacy_family on science_legacy_families(family_id);
create table science_response_exclusions(
  attempt_id uuid not null,ordinal int not null,reason text not null check(reason='previously_seen_after_sign_in'),
  created_at timestamptz not null default now(),primary key(attempt_id,ordinal),
  foreign key(attempt_id,ordinal) references science_issued(attempt_id,ordinal)
);
alter table science_legacy_families enable row level security;
alter table science_response_exclusions enable row level security;
revoke all on science_legacy_families,science_response_exclusions from public,anon,authenticated;
grant all on science_legacy_families,science_response_exclusions to service_role;

create function science_reconcile_identity(p_user uuid,p_visitor uuid) returns int language plpgsql set search_path=public as $$
declare changed int;
begin
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) or not exists(select 1 from science_visitors where id=p_visitor and user_id=p_user) then raise exception 'invalid_owner'; end if;
  perform 1 from science_config where key='correction_epoch' for update;
  insert into science_exposures(visitor_id,user_id,family_id,reason,seen_at)
    select p_visitor,p_user,family_id,'legacy',min(seen_at) from (
      select f.family_id,r.answered_at seen_at from science_legacy_families f join exam_answers r on r.question_id=f.question_id
        join exam_sessions s on s.id=r.session_id where s.user_id=p_user or r.user_id=p_user
      union all
      select f.family_id,r.created_at seen_at from science_legacy_families f join question_feedback r on r.question_id=f.question_id where r.user_id=p_user
    ) previous group by family_id
    on conflict(visitor_id,family_id) do update set seen_at=excluded.seen_at,reason='legacy',first_attempt_id=null
      where excluded.seen_at<science_exposures.seen_at;
  insert into science_response_exclusions(attempt_id,ordinal,reason)
    select i.attempt_id,i.ordinal,'previously_seen_after_sign_in'
      from science_issued i join science_attempts a on a.id=i.attempt_id
      where a.user_id=p_user and i.exclusion_reason is distinct from 'previously_seen_or_author' and exists(
        select 1 from science_exposures e where e.user_id=p_user and e.family_id=i.family_id and e.first_attempt_id is distinct from i.attempt_id
          and (e.seen_at<i.issued_at or (e.seen_at=i.issued_at and (e.first_attempt_id is null or e.first_attempt_id::text<i.attempt_id::text))))
    on conflict do nothing;
  get diagnostics changed=row_count;
  if changed>0 then
    update science_config set value=to_jsonb(value::text::int+1),updated_at=now() where key='correction_epoch';
    update science_attempts a set competitive=false,needs_recalculation=(state='completed') where a.user_id=p_user and exists(select 1 from science_response_exclusions x where x.attempt_id=a.id);
    insert into science_audit(actor_id,action,target,reason,detail) values(p_user,'identity_exposure_reconciled',p_user::text,'Verified sign-in joined earlier exposure histories',jsonb_build_object('excluded',changed));
  end if;
  delete from science_current_estimates where user_id=p_user;
  return changed;
end $$;

create or replace function science_claim_visitor(p_visitor uuid,p_hash text,p_user uuid)
returns boolean language plpgsql set search_path=public as $$
declare v science_visitors;original science_visitors;
begin
  -- Final scoring/issuance take a shared lock first, so this merge cannot race their novelty check.
  perform 1 from science_config where key='correction_epoch' for update;
  select * into v from science_visitors where id=p_visitor and token_hash=p_hash for update;
  if not found or (v.user_id is not null and v.user_id<>p_user) then raise exception 'invalid_owner'; end if;
  if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'email_unverified'; end if;
  if v.user_id=p_user then return true; end if;
  select * into original from science_visitors where user_id=p_user order by created_at,id limit 1;
  if found and original.id<>v.id then
    insert into science_events(dedupe_key,event_name,visitor_id,user_id,payload) values('merge:'||v.id,'assignment_merged',v.id,p_user,jsonb_build_object('originalGroup',v.route_group,'canonicalGroup',original.route_group)) on conflict do nothing;
  end if;
  update science_visitors set user_id=p_user,verified_at=coalesce(verified_at,now()),route_group=coalesce(original.route_group,route_group),full_length=coalesce(original.full_length,full_length),experiment=coalesce(original.experiment,experiment) where id=p_visitor;
  update science_attempts set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_exposures set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_events set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_feedback set user_id=p_user where visitor_id=p_visitor and user_id is null;
  update science_outbox set user_id=p_user where user_id is null and kind='attempt_completed' and payload->>'attemptId' in(select id::text from science_attempts where visitor_id=p_visitor and user_id=p_user);
  insert into science_profiles(user_id) values(p_user) on conflict do nothing;
  insert into science_entitlements(user_id,source) values(p_user,'verified_email') on conflict do nothing;
  insert into science_events(dedupe_key,event_name,visitor_id,user_id) values('verified:'||p_user,'email_verified',p_visitor,p_user) on conflict do nothing;
  perform science_reconcile_identity(p_user,p_visitor);
  return true;
end $$;

create or replace view science_responses with(security_invoker=true) as
  select a.user_id,a.visitor_id,a.kind,a.state,a.release_id,a.model_version,
    r.attempt_id,r.ordinal,r.answered_at,r.is_correct,i.revision_id,i.family_id,
    i.eligible and not coalesce(c.excluded,false) and x.attempt_id is null eligible,
    case when c.excluded then 'question_withdrawn' when x.attempt_id is not null then x.reason else i.exclusion_reason end exclusion_reason,
    i.snapshot->>'domain' domain,i.snapshot->>'subdomain' subdomain,
    (i.snapshot->>'a')::double precision a,(i.snapshot->>'b')::double precision b,(i.snapshot->>'c')::double precision c
  from science_answers r join science_issued i using(attempt_id,ordinal) join science_attempts a on a.id=i.attempt_id
  left join science_revision_updates c on c.source_revision=i.revision_id
  left join science_response_exclusions x on x.attempt_id=i.attempt_id and x.ordinal=i.ordinal;
revoke all on function science_reconcile_identity(uuid,uuid),science_claim_visitor(uuid,text,uuid) from public,anon,authenticated;
grant execute on function science_reconcile_identity(uuid,uuid),science_claim_visitor(uuid,text,uuid) to service_role;


insert into science_migration_history(name,sha256) values('0019_science_identity_exposure.sql','0fa8ae1766a1a49d0a30a41b390b5339ee947c86417fd17a6000cf36e973bbd6');
commit;
select name,sha256,applied_at from science_migration_history order by name;
