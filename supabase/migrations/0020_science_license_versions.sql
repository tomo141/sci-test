begin;
create table science_license_versions(
  version text primary key check(version~'^[a-zA-Z0-9._-]{1,100}$'),
  operator_name text not null check(length(trim(operator_name))>=2),terms jsonb not null,
  sha256 text not null check(sha256~'^[0-9a-f]{64}$'),
  published_at timestamptz,active boolean not null default false,
  operator_approved_at timestamptz,legal_review_ref text,
  check(not active or published_at is not null),
  check(published_at is null or (operator_approved_at is not null and coalesce(length(trim(legal_review_ref)),0)>=5))
);
alter table science_license_versions enable row level security;
revoke all on science_license_versions from public,anon,authenticated;
grant all on science_license_versions to service_role;
alter table science_license_acceptances add column terms_sha256 text;
create function science_freeze_published_license() returns trigger language plpgsql set search_path=public as $$
begin
  if old.published_at is not null and (tg_op='DELETE' or (to_jsonb(new)-'active') is distinct from (to_jsonb(old)-'active')) then raise exception 'published_license_is_immutable'; end if;
  if tg_op='DELETE' then return old; end if;return new;
end $$;
create trigger science_license_immutable before update or delete on science_license_versions for each row execute function science_freeze_published_license();
create function science_check_license_acceptance() returns trigger language plpgsql set search_path=public as $$
declare terms science_license_versions;
begin
  select * into terms from science_license_versions where version=new.license_version and active and published_at is not null for share;
  if not found then raise exception 'submission_not_open'; end if;
  if new.representations->>'licenseHash' is distinct from terms.sha256 then raise exception 'terms_changed' using errcode='40001'; end if;
  new.terms_sha256:=terms.sha256;return new;
end $$;
create trigger science_acceptance_terms before insert on science_license_acceptances for each row execute function science_check_license_acceptance();
revoke all on function science_freeze_published_license(),science_check_license_acceptance() from public,anon,authenticated;
grant execute on function science_freeze_published_license(),science_check_license_acceptance() to service_role;
commit;
