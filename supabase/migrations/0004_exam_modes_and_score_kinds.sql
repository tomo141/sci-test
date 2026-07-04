alter table public.exam_sessions
  add column if not exists exam_mode text not null default 'overall' check (exam_mode in ('overall','domain')),
  add column if not exists target_domain text;

alter table public.score_history
  add column if not exists score_kind text not null default 'overall' check (score_kind in ('overall','domain')),
  add column if not exists domain text;

create index if not exists score_history_score_kind_domain_score_idx
  on public.score_history (score_kind, domain, score desc, answer_count desc);
