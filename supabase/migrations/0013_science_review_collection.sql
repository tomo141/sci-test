begin;
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
commit;
