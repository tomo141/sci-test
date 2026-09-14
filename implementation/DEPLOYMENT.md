# 本番反映の記録

2026-09-14。既存プロジェクトはGitHub `tomo141/sci-test`、Vercel `rikei-talk/sci-test`、Supabase `grwaocjhfdberagsiiou`。本人の「実装して。本番まで反映させて」と、FREE再開・ローカルバックアップの追加承認が根拠。

## 実行済み

- 改装ブランチ `codex/science-overhaul-20260914` の `6c26ecf` までGitHubへpushした。mainは未変更。Vercelの `D1mdiBu5gLjzJMpu13rofK4vJysL` がReadyとなり、改装プレビューのトップ表示を確認した。
- 初回pushは自動承認レビューが送信先の所有確認を理由に拒否。本人がログインしたVercelの本番リポジトリ表示とGitHub宛先・既存HEADの一致を追加確認し、承認後に実行。HTTP 400の通信エラーはHTTP/1.1と送信バッファ指定で再試行して解消。
- 本番DBの読み取りで、会員4・問題1740・受験122・回答631・同意4を再確認。新版のscience_itemsはまだ存在しなかった。
- `scripts/prepare-science-migration.mjs` で、0004〜0019のうち0007を除く15ファイルを単一トランザクションにした。0007の旧権限切替はアプリ切替時まで延期する。
- `scripts/rehearse-science-migration.mjs` は既存17テーブルのローカルバックアップをロードし、追加SQLと0007の切替を順に試験した。全行の旧保存値を照合し一致。新版プロフィール4・配信同意4を保持。ブラウザの正解キー閲覧・role更新の権限を閉じられることも確認した。

## SQLファイルと未実行の状態

- ファイル：Git対象外 `implementation/local/deployment/additive-schema.sql`。
- SHA-256：`e4ebff2ea0f341319265eaeecc330391fbad334a3340f67aa066f0d5fd350540`。
- 検証結果：同ディレクトリ `rehearsal.json`、15ファイルの元ハッシュは `additive-schema-manifest.json`。
- GitHubの不変コミット256b4c1から、許可されたブラウザの可視本文を読み、15ファイルをローカル版とFNV-1aで照合した。組み立てたSQL全体もリハーサル版の照合値と一致。
- Supabaseエディターへ貼り付けたが、Monacoのアクセシビリティ表示は先頭・末尾・カーソル付近に省略される。実行操作は自動承認レビューが全文一致未確認を理由に拒否した。SQLは本番でまだ実行していない。本人へファイル全文の手動貼り付け・実行を依頼した。
- MacのCodexアプリ操作はCUAの安全制限で禁止された。SQL転記用のローカルHTTP表示も自動承認レビューが迂回と判断して拒否。いずれも実行していない。クリップボードへのコピーはできたが、ブラウザの貼り付けには反映されなかった。

本人の実行結果を待ち、DBの新テーブル・ハッシュ台帳・旧データ件数・APIを確認する。実行依頼を出したことを、DB変更済みとは扱わない。公開切替、問題バンク投入、SMTP、投稿条件、Cron、実メール受信は別の未完了事項。

## 初回SQLを固定した後の追加修正

- 0020：投稿条件の全文・版・ハッシュと、対象の問題に対する同意を保存。公開済み全文は不変。
- 0021：Authを参照する確認済みメール判定を非公開スキーマへ移し、実際のアプリ用service_roleで確認。Authテーブル全体への権限は追加しない。
- 0022：管理者に限り、現在の配信同意を最小項目で出力する関数。一般利用者からの実行を拒否。
- 0023：審査済み問題の候補への分割投入と、十分な問題が揃った後の原子的な公開。失敗時に既存の公開バンクを保持し、既にログイン済みの人にも旧問題との対応を反映する。
- これらは初回の手動実行ファイルへ混ぜない。`prepare-science-migration.mjs` は0019で対象を固定し、既存ファイルの内容が変わる上書きを拒否する。
- 19:54 JST頃のREST読み取りでは、science_migration_historyとscience_itemsがともにPGRST205（スキーマキャッシュに未存在）。HEADのcount=nullは0件と解釈せず、GETで未適用を確認した。
- 20:37 JSTにも台帳・新版の問題・管理者・プロフィール・受験テーブルがPGRST205だった。`scripts/check-science-deployment.mjs` の読み取りで再確認し、未取得を0件と表示していない。
- 20:22 JSTのローカル復元リハーサルは0020〜0023も含めて通過し、旧17テーブル全行の値を保持。ブラウザ試験用のNext.js起動とChromeは自動承認後に実行した。これはSQL転記サーバーではなく、機能検証用のアプリ。上記の禁止された転記方法は使っていない。

追加変更と旧権限の切替にも、必要な前段のファイルハッシュをDB台帳で確認するSQLを用意した。適用後は台帳へ記録する。初回SQLは変更していない。

- `implementation/local/deployment/followup-schema-0020-0023.sql`：SHA-256 `c888659cb5b22aac409e81b81b74bcbffbaf183b0a62aed8e7fd11238245c58c`。
- `implementation/local/deployment/security-cutover-after-0023.sql`：SHA-256 `53680dbc3ff13f1fe662d7b8fe32be6a6f859729a0c53ddeabaea23eeebe04a0`。
- `scripts/prepare-science-upgrade.mjs` はローカルファイルを作るだけで実行・適用しない。初回の実行依頼に、後から作ったSQLを混ぜていない。
