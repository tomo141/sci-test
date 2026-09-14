begin;
-- Letter case distinguishes scientific symbols. Normalize width, not case.
-- Keep old migration files immutable; existing question versions are not rewritten.
create or replace function science_valid_content(value jsonb)
returns boolean language sql immutable as $$
  select case when jsonb_typeof(value)='object' and jsonb_typeof(value->'choices')='array' then
    coalesce(jsonb_array_length(value->'choices')=4
      and jsonb_typeof(value->'question')='string' and length(trim(value->>'question'))>0
      and jsonb_typeof(value->'explanation')='string' and length(trim(value->>'explanation'))>0
      and jsonb_typeof(value->'correctIndex')='number' and value->>'correctIndex' in ('0','1','2','3')
      and (select count(*)=4
        and bool_and(jsonb_typeof(choice)='string')
        and count(distinct (trim(normalize(choice#>>'{}',NFKC)) collate "C"))=4
        and min(length(trim(normalize(choice#>>'{}',NFKC))))>0
        from jsonb_array_elements(value->'choices') as t(choice)),false)
    else false end;
$$;
revoke all on function science_valid_content(jsonb) from public,anon,authenticated;
grant execute on function science_valid_content(jsonb) to service_role;
commit;
