# 公開Runbook

## 外部サービスでユーザー操作が必要なもの

以下は外部状態を変えるため、Codexが勝手に最終確定しません。

- Supabaseプロジェクト作成
- Supabase APIキー確認と `.env.local` / Vercel環境変数登録
- Vercelプロジェクト作成と本番デプロイ確定
- Cloudflare DNSで `sci-test.rikei-talk.com` をVercelへ向ける変更
- Turnstileサイト作成とキー発行
- 利用規約・プライバシーポリシーの正式な屋号・代表者名・問い合わせ先確定

## Supabase

1. Supabaseプロジェクトを作成
2. SQL editorで `supabase/migrations/0001_initial_schema.sql` を実行
3. Auth URL Configurationを設定
   - Site URL: `https://sci-test.rikei-talk.com`
   - Redirect URLs:
     - `https://sci-test.rikei-talk.com/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`
4. メール確認を有効化
5. パスワード再設定メールを有効化
6. 本番用管理者は `profiles.role = 'admin'` に更新

## 問題バンク

初期400問サンプル生成:

```bash
node scripts/generate-question-bank.mjs
```

下書き投入:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-question-bank.mjs
```

QC済みだけ公開投入:

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-question-bank.mjs supabase/seed/generated/questions-400.sample.json --published
```

## Vercel環境変数

- `NEXT_PUBLIC_APP_URL=https://sci-test.rikei-talk.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Cloudflare DNS

Vercelが提示するCNAMEを `sci-test.rikei-talk.com` に設定します。DNS変更は公開影響があるため、変更直前に内容を確認してください。

## 公開前チェック

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm preflight`
- `pnpm test:e2e`
- スマホ幅390pxで受験画面確認
- 50問完走
- 登録後に履歴保存
- 管理者で `/api/admin/marketing-consents.csv` をダウンロード
- 非管理者でCSVが403になることを確認
- ランキングに本名・メールアドレスが出ていないことを確認
- LighthouseでPerformance / Accessibility / SEO確認
- `supabase/rls-verification.sql` の観点でRLS確認

## バックアップ方針

- Supabaseの自動バックアップを有効化
- 公開前に初回DB dumpを保存
- 問題バンクJSON/CSVはGit管理し、DB投入後も原本を残す
- 管理操作は `admin_audit_logs` に記録する
