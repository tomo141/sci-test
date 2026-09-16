begin;
-- Optional reference judgements. They are not credentials or score adjustments.
alter table science_submission_drafts add column level_reference jsonb;
create function science_valid_level_reference(value jsonb) returns boolean language sql immutable as $$
  select value is null or coalesce(jsonb_typeof(value)='object'
    and value->>'version'='science-knowledge-stages-v1-20260916'
    and value->>'targetProbability'='0.7'
    and value ? 'level' and (value->'level'='null'::jsonb or value->>'level' in ('primary','lower_secondary','upper_secondary','undergraduate_core','bachelor','master','doctor_research'))
    and value->>'confidence' in ('confident','uncertain','unknown'),false);
$$;
alter table science_submission_drafts add constraint science_draft_level_valid check(science_valid_level_reference(level_reference));
create table science_item_level_references (
  revision_id uuid primary key references science_items(id) on delete cascade,
  draft_id uuid not null references science_submission_drafts(id), draft_revision int not null,
  domain text not null, subdomain text not null,
  reference jsonb not null check(science_valid_level_reference(reference)), created_at timestamptz not null default now()
);
create function science_snapshot_level_reference() returns trigger language plpgsql set search_path=public as $$
begin
  if new.revision_id is distinct from old.revision_id and new.revision_id is not null and new.level_reference is not null then
    insert into science_item_level_references(revision_id,draft_id,draft_revision,domain,subdomain,reference)
      values(new.revision_id,new.id,new.revision,new.domain,new.subdomain,new.level_reference);
  end if;
  return new;
end $$;
create trigger science_draft_level_snapshot after update of revision_id on science_submission_drafts for each row execute function science_snapshot_level_reference();

create table science_level_assessments (
  id uuid primary key default gen_random_uuid(), operation_id uuid not null,
  visitor_id uuid not null references science_visitors(id) on delete cascade,
  attempt_id uuid not null references science_attempts(id) on delete cascade,
  domain text not null check(domain in ('数学','物理','化学','生物','地学','工学','農学','情報・計算機科学','医歯薬学','人文社会科学')),
  subdomain text check(subdomain is null or length(trim(subdomain)) between 1 and 100),
  definition_version text not null check(definition_version='science-knowledge-stages-v1-20260916'),
  level text check(level in ('primary','lower_secondary','upper_secondary','undergraduate_core','bachelor','master','doctor_research')),
  created_at timestamptz not null default now(), unique(visitor_id,operation_id)
);
create index science_level_assessments_owner on science_level_assessments(visitor_id,created_at desc);
create index science_level_assessments_scope on science_level_assessments(domain,subdomain,definition_version,created_at);
-- Resolve account ownership through the visitor, so verified claiming also carries prior self-reports.
create function science_level_history(p_visitor uuid,p_user uuid) returns setof science_level_assessments
language sql stable set search_path=public as $$
  select distinct on (a.domain,coalesce(a.subdomain,''),a.definition_version) a.* from science_level_assessments a join science_visitors v on v.id=a.visitor_id
    where (v.id=p_visitor and (v.user_id is null or v.user_id=p_user)) or (p_user is not null and v.user_id=p_user)
    order by a.domain,coalesce(a.subdomain,''),a.definition_version,a.created_at desc,a.id desc;
$$;
alter table science_level_assessments enable row level security;
alter table science_item_level_references enable row level security;
revoke all on science_level_assessments,science_item_level_references from public,anon,authenticated,service_role;
grant select,insert,delete on science_level_assessments,science_item_level_references to service_role;
revoke all on function science_valid_level_reference(jsonb),science_snapshot_level_reference(),science_level_history(uuid,uuid) from public,anon,authenticated;
grant execute on function science_valid_level_reference(jsonb),science_snapshot_level_reference(),science_level_history(uuid,uuid) to service_role;
commit;
