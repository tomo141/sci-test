-- Run after the verified overhaul deployment owns the existing production domains.
-- Opens examinations only; leaves MyASP, marketing delivery, and submissions unchanged.
begin;
set local statement_timeout='30s';
select pg_advisory_xact_lock(hashtextextended('science-overhaul-release',0));
do $$ begin
  if not exists(select 1 from science_migration_history where name='0007_legacy_security_and_identity.sql' and sha256='63b603296e8d3bbdf5fd8780b129c7072aec34cd1b156d3c189a6d5b373206c8') then raise exception 'security_cutover_required'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m') and (has_table_privilege('anon',c.oid,'SELECT') or has_table_privilege('authenticated',c.oid,'SELECT'))) then raise exception 'browser_table_access_remaining'; end if;
  if exists(select 1 from profiles p left join science_profiles s on s.user_id=p.id where s.user_id is null) then raise exception 'profile_inheritance_incomplete'; end if;
  if exists(select 1 from marketing_consents m left join science_entitlements e on e.user_id=m.user_id where m.training_unlocked_at is not null and e.user_id is null) then raise exception 'entitlement_inheritance_incomplete'; end if;
  if exists(select 1 from marketing_consents m left join science_consents s on s.user_id=m.user_id and s.topic='science' where s.user_id is null or (s.version='legacy-consent' and s.enabled is distinct from m.consented)) then raise exception 'consent_inheritance_incomplete'; end if;
  if not exists(select 1 from science_releases where id='c3370bed-460e-4e40-af4f-7a7e13565c77' and state='active') then raise exception 'reviewed_bank_required'; end if;
  if not exists(select 1 from science_weekly_sets where now()>=starts_at and now()<ends_at and cardinality(revision_ids)=10) then raise exception 'current_week_required'; end if;
  if not exists(select 1 from science_config where key='release' and value->>'newAttempts'='false' and value->>'fullLength'='50' and value->>'mailDelivery'='false' and value->>'myaspSync'='false') then raise exception 'unexpected_release_state'; end if;
end $$;
update science_config set value=jsonb_set(value,'{newAttempts}','true'),updated_at=now() where key='release';
insert into science_audit(action,target,reason,detail) values('examinations_opened','release','Approved production overhaul; OTP sign-in, MyASP connection, migration hashes and legacy preservation verified',jsonb_build_object('deployment','BsQmFtZtv4T3fWndZSuTCmCrKfLT','commit','8bc5b1d','fullLength',50,'marketingDelivery',false));
commit;
select value,updated_at from science_config where key='release';
