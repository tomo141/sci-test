create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketing_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consented boolean not null default false,
  consented_at timestamptz,
  training_unlocked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index marketing_consents_user_id_key on public.marketing_consents(user_id);

create table public.education_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  highest_education text,
  specialty text
);

create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id text,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  completed_10_at timestamptz,
  completed_50_at timestamptz,
  latest_score numeric,
  score_low numeric,
  score_high numeric,
  diagnostic_accuracy text
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  question_text text not null,
  domain text not null,
  ability_axis text not null,
  difficulty_initial int not null check (difficulty_initial between 100 and 900),
  difficulty_internal numeric not null,
  discrimination numeric not null default 1,
  status text not null default 'draft' check (status in ('draft','published','reduced','archived')),
  quality_score numeric not null default 1,
  currentness_type text default 'evergreen',
  expires_at date,
  created_at timestamptz not null default now()
);

create table public.question_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_index int not null,
  choice_text text not null,
  is_correct boolean not null default false
);

create unique index question_choices_question_id_choice_index_key on public.question_choices(question_id, choice_index);

create table public.question_sources (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  source_url text,
  source_note text,
  evidence_memo text
);

create unique index question_sources_question_id_key on public.question_sources(question_id);

create table public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.exam_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  question_id uuid not null references public.questions(id),
  selected_choice_index int not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  response_time_ms int,
  served_difficulty numeric,
  predicted_correct_probability numeric,
  selection_reason text,
  score_before numeric,
  score_after numeric
);

create table public.question_statistics (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer_count int not null default 0,
  correct_rate numeric,
  average_response_time_ms numeric,
  good_count int not null default 0,
  bad_count int not null default 0,
  good_weight numeric not null default 0,
  bad_weight numeric not null default 0,
  high_scorer_bad_weight numeric not null default 0
);

create table public.question_feedback (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  feedback text not null check (feedback in ('good','bad')),
  reasons text[],
  comment text,
  feedback_weight numeric not null,
  created_at timestamptz not null default now()
);

create table public.proficiency_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  session_id uuid references public.exam_sessions(id) on delete cascade,
  scope text not null,
  scope_key text not null,
  ability numeric not null,
  answer_count int not null,
  standard_error numeric not null,
  updated_at timestamptz not null default now()
);

create table public.score_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.exam_sessions(id) on delete set null,
  score numeric not null,
  score_low numeric,
  score_high numeric,
  answer_count int not null,
  created_at timestamptz not null default now()
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null,
  condition jsonb not null default '{}'::jsonb
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  kind text not null,
  domain text,
  user_id uuid references public.profiles(id) on delete cascade,
  public_nickname text not null,
  score numeric not null,
  answer_count int not null,
  diagnostic_accuracy numeric,
  best_domain text,
  title text,
  rank int,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.event_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id text,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.marketing_consents enable row level security;
alter table public.education_profiles enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.exam_answers enable row level security;
alter table public.questions enable row level security;
alter table public.question_choices enable row level security;
alter table public.question_sources enable row level security;
alter table public.question_statistics enable row level security;
alter table public.question_feedback enable row level security;
alter table public.proficiency_estimates enable row level security;
alter table public.score_history enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.event_logs enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nickname, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'nickname', ''),
    case when lower(coalesce(new.email, '')) = any(string_to_array(lower(coalesce(current_setting('app.admin_emails', true), '')), ',')) then 'admin' else 'user' end
  )
  on conflict (id) do nothing;

  insert into public.marketing_consents (user_id, consented, consented_at, training_unlocked_at)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false) then now() else null end,
    case when coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false) then now() else null end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "insert own profile" on public.profiles for insert with check (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid());
create policy "own marketing consent" on public.marketing_consents for all using (user_id = auth.uid() or public.is_admin());
create policy "own education" on public.education_profiles for all using (user_id = auth.uid() or public.is_admin());
create policy "own exam sessions" on public.exam_sessions for select using (user_id = auth.uid() or public.is_admin());
create policy "insert own exam sessions" on public.exam_sessions for insert with check (user_id = auth.uid() or public.is_admin());
create policy "update own exam sessions" on public.exam_sessions for update using (user_id = auth.uid() or public.is_admin());
create policy "own answers" on public.exam_answers for select using (user_id = auth.uid() or public.is_admin());
create policy "insert own answers" on public.exam_answers for insert with check (user_id = auth.uid() or public.is_admin());
create policy "published questions readable" on public.questions for select using (status = 'published' or public.is_admin());
create policy "published choices readable" on public.question_choices for select using (exists (select 1 from public.questions q where q.id = question_id and q.status = 'published') or public.is_admin());
create policy "admin question sources" on public.question_sources for all using (public.is_admin());
create policy "admin question statistics" on public.question_statistics for all using (public.is_admin());
create policy "qualified feedback own select" on public.question_feedback for select using (user_id = auth.uid() or public.is_admin());
create policy "qualified feedback own insert" on public.question_feedback for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.exam_sessions s
    where s.user_id = auth.uid()
    and s.completed_50_at is not null
  )
);
create policy "own estimates" on public.proficiency_estimates for all using (user_id = auth.uid() or public.is_admin());
create policy "own score history" on public.score_history for all using (user_id = auth.uid() or public.is_admin());
create policy "badges readable" on public.badges for select using (true);
create policy "own user badges" on public.user_badges for select using (user_id = auth.uid() or public.is_admin());
create policy "leaderboard public" on public.leaderboard_snapshots for select using (true);
create policy "admin audit only" on public.admin_audit_logs for all using (public.is_admin());
create policy "admin event logs only" on public.event_logs for select using (public.is_admin());
create policy "own event logs insert" on public.event_logs for insert with check (user_id = auth.uid() or user_id is null);
