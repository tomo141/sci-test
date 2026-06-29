# 公開準備ステータス

## Codex側で実施済み

- Supabase Auth接続用Server Actions
  - 登録
  - ログイン
  - パスワード再設定
  - Auth callback
- 匿名受験IDの保持と登録時の紐付け
- 回答保存API
  - 受験開始
  - 回答保存
  - スコア履歴保存
  - カルテ保存ボタン
- 問題評価API
  - ログイン必須
  - 50問到達必須
  - Turnstile検証対応
- 管理機能
  - KPI実データ取得フォールバック
  - メルマガ同意者CSV route
- Supabase migration補強
  - RLS
  - profile自動作成trigger
  - event_logs
  - question feedback制限
- 400問サンプル問題生成
  - `supabase/seed/generated/questions-400.sample.json`
  - `supabase/seed/generated/questions-400.sample.csv`
- 問題インポートスクリプト
- Turnstile差し込み
- OGP / favicon / エラー画面 / Not Found
- Vercel設定
- 公開Runbook
- RLS検証SQL
- 環境変数preflight

## 外部サービスで未実施

- Supabaseプロジェクト作成
- Supabase migration本番適用
- Supabase Auth本番URL設定
- Vercelプロジェクト作成
- Vercel環境変数登録
- Vercel本番デプロイ
- Cloudflare DNS変更
- Turnstileサイト作成とキー発行
- MyASP取込用CSVの実データ確認
- Lighthouse実測
- Playwright実行

## ユーザー確認が必要

- 屋号
- 代表者名
- 問い合わせ先メールアドレス
- `ADMIN_EMAILS` に入れる管理者メール
- Cloudflareで設定する最終DNSレコード
- 本番公開タイミング

## 現時点の検証

- `eslint .`: pass
- `vitest run`: pass
- `next build`: pass
- `playwright test`: 未実行。ローカルブラウザ起動の許可が利用上限で拒否されたため。
