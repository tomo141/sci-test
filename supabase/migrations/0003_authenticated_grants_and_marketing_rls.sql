-- SQL editor 手動適用時は authenticated ロールへのテーブル権限が不足しやすい。
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- marketing_consents の FOR ALL 単一ポリシーは upsert で拒否されることがあるため分割する。
drop policy if exists "own marketing consent" on public.marketing_consents;

create policy "marketing_consents select own"
  on public.marketing_consents
  for select
  using (user_id = auth.uid() or public.is_admin());

create policy "marketing_consents insert own"
  on public.marketing_consents
  for insert
  with check (user_id = auth.uid() or public.is_admin());

create policy "marketing_consents update own"
  on public.marketing_consents
  for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
