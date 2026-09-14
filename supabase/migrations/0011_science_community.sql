begin;
alter table science_submission_drafts add column revision int not null default 0;
alter table science_submission_drafts add column parent_revision_id uuid references science_items(id);
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
  insert into science_items(family_id,version,author_id,domain,subdomain,content,status,license_version)
    values(p_family,next_version,p_user,d.domain,d.subdomain,d.content,'submitted',p_license) returning id into q;
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
commit;
