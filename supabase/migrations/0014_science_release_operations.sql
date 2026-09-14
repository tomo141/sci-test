begin;
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
commit;
