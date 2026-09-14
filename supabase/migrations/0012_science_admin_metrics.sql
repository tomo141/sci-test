begin;
create function science_admin_metrics()
returns table(label text,value bigint) language sql stable set search_path=public as $$
  select '確認済みアカウント',count(*) from science_profiles
  union all select '科学メールの配信同意',count(*) from science_consents where topic='science' and enabled
  union all select '完了した受験',count(*) from science_attempts where state='completed'
  union all select '公開中の共有結果',count(*) from science_shares where enabled
  union all select '確認待ちの投稿',count(*) from science_submission_drafts where state='submitted'
  union all select '確認待ちの改善報告',count(*) from science_feedback where state='pending'
  union all select '正式問題のリビジョン',count(*) from science_items where status='published' and quality_passed and rights_checked
  union all select '停止・失敗中の配信処理',count(*) from science_outbox where state in ('blocked','failed');
$$;
revoke all on function science_admin_metrics() from public,anon,authenticated;
grant execute on function science_admin_metrics() to service_role;
commit;
