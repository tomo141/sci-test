# 全分野科学検定 — 改装版

2026-09-14の要件に基づくNext.js / Supabaseアプリ。腕試し20問、本試験50/100問、分野20問、今週の10問、みんなの出題ラボを扱う。制作「理系とーく 川村智祥」。

実装・検証・本番反映の状態は [implementation/STATUS.md](implementation/STATUS.md)、本番変更の実行記録は [implementation/DEPLOYMENT.md](implementation/DEPLOYMENT.md) を参照。ブランチにコードがあることを、本番で利用できることと同一視しない。

## 開発と検証

1. 依存を `pnpm install --frozen-lockfile` で復元する。
2. `.env.example` を参考に `.env.local` を用意する。ローカル・Vercelプレビューは独立した検証DBを使う。本番プロジェクトの接続先を引き継いでも、Vercelのproduction以外ではアプリから接続を拒否する。
3. `pnpm dev` で起動する。DB未設定でもトップ・案内・登録の説明を確認できる。受験成功やランキングは代替データで作らない。
4. `pnpm test`、`pnpm lint`、`pnpm build`、`pnpm bank:test` を実行する。
5. `pnpm test:e2e` はPC・スマホの画面を確認する。Chromeがインストール済みのMacでは `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`。接続済みの受験試験は独立した検証DBを用意した上で `SCIENCE_E2E_CONNECTED=1` を指定する。既定では接続試験を明示的にスキップする。

この作業ではNode 25.8.0を使用。直接TypeScriptを読むオフライン準備スクリプトには、Nodeの型除去に対応する実行環境が必要。

## DB・認証・問題

- 新版の記録は `science_*` テーブル。APIとservice_roleのRPCが所有確認・出題・採点を行う。ブラウザに正解バンクや管理権限を渡さない。
- 認証はメールの確認コード。一般ユーザーへの送信にはSupabaseのcustom SMTP設定が必要。受験権とメール配信同意は別に保持する。
- 管理権限の正本は `science_admins`。旧版の `ADMIN_EMAILS` や利用者が変更できるプロフィールを権限判定に使わない。
- 内容を確認した問題は `content/science-bank-v2/`。`pnpm bank:prepare` でローカル候補を作成し、`pnpm bank:inspect` で投入前の状態を確認する。準備・照合だけではDBへ書き込まない。
- 旧本番の問題との対応は、承認済みのローカルバックアップを準備コマンドの引数に渡す。既出の別表現も同じ問題族として扱い、回答経験を失わない。
- 投入は `scripts/import-science-bank.mjs` の明示的な `--stage`、公開切替は `--activate`。管理者ID・元ファイルのハッシュ・内容確認・出典・権利根拠を検証する。初期は正式100問×10分野と週替わり用20問が必要。実測による難度校正済みを意味しない。
- 既存本番への移行では `0001` から再実行しない。承認・バックアップ・段階別SQLと旧権限切替の順は実行記録を参照する。`pnpm deployment:check` は適用ハッシュと件数を読み取るだけで、SMTPや実受験の合格を代行しない。

## 旧版資料

以下は改装前の履歴であり、新版の設定・公開手順には使わない。旧テーブル・作問スクリプト・結果は移行のため保持している。`questions:*` コマンド群と `docs/launch-runbook.md` も旧版向け。現行の手順は上記と `implementation/` にある。

[改装前READMEの保存版](docs/legacy-readme-20260914.md)
