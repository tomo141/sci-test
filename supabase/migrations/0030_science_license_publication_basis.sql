begin;
-- The operator adopted the full terms on 2026-09-16 without an external legal review.
-- Preserve that distinction instead of putting an operator decision into legal_review_ref.
alter table science_license_versions add column publication_basis text not null default 'external_review'
  check (publication_basis in ('external_review','operator_acceptance'));
alter table science_license_versions add column operator_approval_ref text;
do $$
declare guard_name text; guard_count int;
begin
  select count(*),min(conname) into guard_count,guard_name from pg_constraint
    where conrelid='science_license_versions'::regclass and contype='c'
      and pg_get_constraintdef(oid) like '%legal_review_ref%';
  if guard_count<>1 then raise exception 'license_publication_guard_not_identified'; end if;
  execute format('alter table science_license_versions drop constraint %I',guard_name);
end $$;
alter table science_license_versions add constraint science_license_publication_approved check (
  published_at is null or (
    operator_approved_at is not null and (
      (publication_basis='external_review' and coalesce(length(trim(legal_review_ref)),0)>=5)
      or (publication_basis='operator_acceptance' and coalesce(length(trim(operator_approval_ref)),0)>=5 and legal_review_ref is null)
    )
  )
);
commit;
