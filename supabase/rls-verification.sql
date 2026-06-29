-- Run this after applying migrations in a disposable Supabase project.
-- It documents the checks required before production launch.

-- 1. Public users can read published questions only.
select id, title from public.questions where status = 'published' limit 5;

-- 2. A logged-in non-admin user must only see their own profile.
-- In Supabase SQL editor, use the Auth/RLS impersonation tools or API tests
-- to verify profiles where id <> auth.uid() are not returned.

-- 3. A logged-in non-admin user must not read another user's email/full_name/education profile.
-- Expected: zero rows through anon/authenticated client when querying other user ids.

-- 4. A logged-in user may insert score_history only for their own user_id.
-- Expected: own user_id succeeds, another user_id fails with RLS.

-- 5. Question feedback requires a session with completed_50_at.
-- Expected: user without completed_50_at cannot insert question_feedback.

-- 6. marketing-consents.csv route requires profiles.role = 'admin'.
-- Expected: non-admin receives 403, admin receives CSV with only consented users.
