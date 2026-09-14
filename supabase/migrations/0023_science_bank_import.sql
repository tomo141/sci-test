begin;
create index if not exists science_legacy_answer_lookup on exam_answers(question_id,user_id);
create table science_bank_import_items(
  release_id uuid not null references science_releases(id),revision_id uuid not null references science_items(id),
  usage text not null check(usage in ('formal','weekly-reserve')),content_sha256 text not null check(content_sha256~'^[0-9a-f]{64}$'),
  primary key(release_id,revision_id)
);
alter table science_bank_import_items enable row level security;
revoke all on science_bank_import_items from public,anon,authenticated;
grant all on science_bank_import_items to service_role;
create view science_reserved_weekly_families with(security_invoker=true) as
  select q.family_id from science_release_items r join science_items q on q.id=r.revision_id
  union select q.family_id from science_weekly_sets w cross join lateral unnest(w.revision_ids) v(id) join science_items q on q.id=v.id;
revoke all on science_reserved_weekly_families from public,anon,authenticated;
grant select on science_reserved_weekly_families to service_role;

create function science_import_bank_batch(p_release uuid,p_actor uuid,p_manifest text,p_rows jsonb)
returns jsonb language plpgsql set search_path=public as $$
declare r science_releases;entry jsonb;item science_items;alias_id uuid;v record;n int:=0;missing int:=0;
begin
  if p_actor is null or not exists(select 1 from science_admins where user_id=p_actor) then raise exception 'forbidden'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows) not between 1 and 100 then raise exception 'invalid_batch'; end if;
  perform 1 from science_config where key='correction_epoch' for update;
  select * into r from science_releases where id=p_release for update;
  if not found or r.state<>'candidate' or r.settings->>'importManifest' is distinct from p_manifest or p_manifest !~ '^[0-9a-f]{64}$' then raise exception 'invalid_import'; end if;
  for entry in select value from jsonb_array_elements(p_rows) loop
    if entry->>'id' is null or (r.settings->'expectedRevisions' @> jsonb_build_array(entry->>'id')) is not true then raise exception 'unexpected_revision'; end if;
    if entry->'review_evidence'->>'releaseApproval' is distinct from 'approved'
      or entry->'review_evidence'->>'sourceChecked' is distinct from 'true'
      or entry->'review_evidence'->>'uniqueAnswerChecked' is distinct from 'true'
      or entry->'review_evidence'->>'distractorRationalesChecked' is distinct from 'true'
      or coalesce(length(trim(entry->'review_evidence'->>'rightsBasis')),0)<10
      or coalesce(entry->'review_evidence'->>'contentSha256','') !~ '^[0-9a-f]{64}$'
      or not science_valid_content(entry->'content')
      or coalesce(jsonb_array_length(entry->'content'->'sources'),0)<1
      or coalesce(jsonb_array_length(entry->'content'->'distractorRationales'),0)<>4
      or entry->'parameters'->>'a' is distinct from '1' or entry->'parameters'->>'c' is distinct from '0.25'
      or entry->>'use' not in ('formal','weekly-reserve') then raise exception 'review_evidence_required'; end if;
    insert into science_items(id,family_id,version,legacy_id,domain,subdomain,content,status,quality_passed,rights_checked,review_evidence)
      values((entry->>'id')::uuid,entry->>'family_id',(entry->>'version')::int,
        (select id from questions where id=(entry->>'legacy_id')::uuid),entry->>'domain',entry->>'subdomain',entry->'content','draft',true,true,entry->'review_evidence')
      on conflict(id) do nothing;
    select * into item from science_items where id=(entry->>'id')::uuid;
    if item.family_id is distinct from entry->>'family_id' or item.version is distinct from (entry->>'version')::int
      or item.domain is distinct from entry->>'domain' or item.subdomain is distinct from entry->>'subdomain'
      or item.content is distinct from entry->'content' or item.review_evidence->>'contentSha256' is distinct from entry->'review_evidence'->>'contentSha256'
      or item.status not in ('draft','published') or not item.quality_passed or not item.rights_checked then raise exception 'immutable_revision_conflict'; end if;
    insert into science_bank_import_items(release_id,revision_id,usage,content_sha256)
      values(r.id,item.id,entry->>'use',entry->'review_evidence'->>'contentSha256') on conflict do nothing;
    if not exists(select 1 from science_bank_import_items x where x.release_id=r.id and x.revision_id=item.id and x.usage=entry->>'use' and x.content_sha256=entry->'review_evidence'->>'contentSha256') then raise exception 'import_usage_conflict'; end if;
    if entry->>'use'='formal' then
      insert into science_release_items(release_id,revision_id,a,b,c,focus,anchor,parameter_evidence)
        values(r.id,item.id,1,(entry->'parameters'->>'b')::double precision,.25,
          (entry->'parameters'->>'focus')::boolean,(entry->'parameters'->>'anchor')::boolean,entry->'parameter_evidence') on conflict do nothing;
      if not exists(select 1 from science_release_items x where x.release_id=r.id and x.revision_id=item.id
        and x.a=1 and x.b=(entry->'parameters'->>'b')::double precision and x.c=.25
        and x.focus=(entry->'parameters'->>'focus')::boolean and x.anchor=(entry->'parameters'->>'anchor')::boolean
        and x.parameter_evidence=entry->'parameter_evidence') then raise exception 'import_parameter_conflict'; end if;
    end if;
    for alias_id in select value::uuid from jsonb_array_elements_text(entry->'legacy_ids') loop
      if exists(select 1 from questions where id=alias_id) then
        insert into science_legacy_families(question_id,family_id,reason) values(alias_id,item.family_id,entry->'review_evidence'->>'reason') on conflict do nothing;
        if not exists(select 1 from science_legacy_families where question_id=alias_id and family_id=item.family_id) then raise exception 'legacy_family_conflict'; end if;
      else missing:=missing+1;end if;
    end loop;
    n:=n+1;
  end loop;
  -- Newly mapped legacy questions must also reach people who signed in before this import.
  for v in select distinct on(sv.user_id) sv.user_id,sv.id from science_visitors sv
    where sv.user_id in(select a.user_id from exam_answers a where a.question_id in(
      select aliases.value::uuid from jsonb_array_elements(p_rows) inputs
        cross join lateral jsonb_array_elements_text(inputs.value->'legacy_ids') aliases))
    order by sv.user_id,sv.created_at,sv.id loop
    if science_private.email_verified(v.user_id) then perform science_reconcile_identity(v.user_id,v.id); end if;
  end loop;
  insert into science_audit(actor_id,action,target,reason,detail) values(p_actor,'bank_batch_imported',r.id::text,'Reviewed candidate batch, publication still gated',jsonb_build_object('rows',n,'legacyAliasesNotPresent',missing,'manifest',p_manifest));
  return jsonb_build_object('rows',n,'legacyAliasesNotPresent',missing);
end $$;

create function science_finish_bank_import(p_release uuid,p_actor uuid,p_manifest text,p_reason text)
returns boolean language plpgsql set search_path=public as $$
declare r science_releases;expected int;
begin
  if p_actor is null or not exists(select 1 from science_admins where user_id=p_actor) then raise exception 'forbidden'; end if;
  perform 1 from science_config where key='correction_epoch' for share;
  perform pg_advisory_xact_lock(hashtextextended('science-active-release',0));
  select * into r from science_releases where id=p_release for update;
  if not found or r.state<>'candidate' or r.settings->>'importManifest' is distinct from p_manifest then raise exception 'invalid_import'; end if;
  expected:=jsonb_array_length(r.settings->'expectedRevisions');
  if expected is null or expected=0 or (select count(*) from science_bank_import_items where release_id=r.id)<>expected then raise exception 'import_incomplete'; end if;
  if exists(select 1 from science_bank_import_items x join science_items q on q.id=x.revision_id where x.release_id=r.id and (q.status not in ('draft','published') or not q.quality_passed or not q.rights_checked)) then raise exception 'item_not_approved'; end if;
  if exists(select q.family_id from science_bank_import_items x join science_items q on q.id=x.revision_id where x.release_id=r.id group by q.family_id having count(*)>1) then raise exception 'duplicate_family'; end if;
  if exists(select 1 from science_bank_import_items x join science_items q on q.id=x.revision_id join science_reserved_weekly_families used on used.family_id=q.family_id where x.release_id=r.id and x.usage='weekly-reserve') then raise exception 'weekly_family_already_used'; end if;
  if exists(select d from unnest(array['数学','物理','化学','生物','地学','工学','農学','情報・計算機科学','医歯薬学','人文社会科学']) d
    where (select count(*) from science_bank_import_items x join science_items q on q.id=x.revision_id where x.release_id=r.id and x.usage='weekly-reserve' and q.domain=d)<2) then raise exception 'weekly_reserve_below_two'; end if;
  update science_items set status='published' where status='draft' and id in(select revision_id from science_bank_import_items where release_id=r.id);
  perform science_activate_release(r.id,p_actor,p_reason);
  return true;
end $$;
revoke all on function science_import_bank_batch(uuid,uuid,text,jsonb),science_finish_bank_import(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function science_import_bank_batch(uuid,uuid,text,jsonb),science_finish_bank_import(uuid,uuid,text,text) to service_role;
commit;
