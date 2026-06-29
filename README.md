# 全分野科学検定 β版

科学好きのための、全分野科学力の成長可視化・トレーニングができる検定アプリです。Next.js / TypeScript / Tailwind CSS / Supabase を前提に、ローカルプレビューできるβ版として実装しています。

## セットアップ

1. `pnpm install`
2. `.env.example` を `.env.local` にコピーし、必要な値を設定
3. `pnpm dev`
4. `http://localhost:3000` を開く

Supabaseの環境変数が未設定でも、ローカルUIと主要画面は確認できます。設定時だけ認証を有効化する想定です。

## 実装済み画面

- トップページ
- 腕試し受験ページ
- 腕試し速報・結果ページ
- 腕試しカルテページ
- ログインページ
- アカウント登録ページ
- パスワード再設定ページ
- ランキングページ
- トレーニングページ
- マイページ
- 管理画面
- 利用規約
- プライバシーポリシー

## Supabase

マイグレーションは `supabase/migrations/0001_initial_schema.sql` にあります。

含まれる主なテーブル:

- `profiles`
- `marketing_consents`
- `education_profiles`
- `exam_sessions`
- `exam_answers`
- `questions`
- `question_choices`
- `question_sources`
- `question_statistics`
- `question_feedback`
- `proficiency_estimates`
- `score_history`
- `badges`
- `user_badges`
- `leaderboard_snapshots`
- `admin_audit_logs`

RLSは、一般ユーザーが自分のプロフィール・回答・履歴だけを扱い、ランキングは公開用情報だけを表示し、管理者のみ管理データを閲覧できる方針で定義しています。

## 問題インポート

問題JSON schemaは `supabase/seed/question_schema.json`、サンプルは `supabase/seed/sample_questions.json` です。CSV投入時も同じ列構造に揃えてから、`science-bank-publisher` スキルで検証・QC・投入する想定です。

## Vercel / Xserver DNS

Vercelに通常のNext.jsアプリとして接続し、環境変数を設定してください。ドメイン `sci-test.rikei-talk.com` のDNSはXserverのサーバーパネルで管理し、Vercelが提示するCNAMEへ向けます。

詳細な公開手順は `docs/launch-runbook.md` を参照してください。

## 管理者作成

初期は `profiles.role = 'admin'` または `ADMIN_EMAILS` の許可リストで管理者を判定する想定です。本番ではSupabase管理画面から対象ユーザーのroleを更新してください。

## テスト

- `pnpm test`: スコアリングロジックのVitest
- `pnpm test:e2e`: Playwrightの主要フロースモーク
- `pnpm lint`: Next.js lint

### 短縮検証モード

50問完走は時間がかかるため、ローカル検証では `.env.local` に以下を設定できます。

```env
NEXT_PUBLIC_EXAM_QUESTIONS_PER_CYCLE=10
```

10問（全10分野を1問ずつ）で完走扱いになり、カルテ画面への導線が有効になります。受験ページ上部に「検証モード」バナーが表示されます。本番では未設定のまま（50問）にしてください。

## 注意

本スコアは全分野科学検定独自の推定基準です。学位の保有、採用、進学、資格等を保証・証明するものではありません。
