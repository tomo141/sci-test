# 本番反映の記録

2026-09-14。既存プロジェクトはGitHub `tomo141/sci-test`、Vercel `rikei-talk/sci-test`、Supabase `grwaocjhfdberagsiiou`。本人の「実装して。本番まで反映させて」と、FREE再開・ローカルバックアップの追加承認が根拠。

## 実行済み

- 改装ブランチ `codex/science-overhaul-20260914` の `2aecc25` までGitHubへpushした。mainは未変更。Vercelの `97vPfEpHx1LjBndDvDLm9kvH3TUf` が52秒でReadyとなり、コミットとPreview環境の一致を確認した。以前の `61de2d5` もReady。前の `6c26ecf` ではプレビューのトップ表示も確認した。
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

## 審査の回復操作を追加した版

0024は保留解除、修正案の見送り・再提出、保留中の回答確定の停止、投稿者と未ログイン利用者のNULL比較の修正。初回の手動実行ファイルは引き続き固定している。未共有だった0024の検証途中ファイルは `implementation/local/deployment/superseded/` に退避し、リハーサルと同一の追加SQLを作り直した。

- `followup-schema-0020-0024.sql`：SHA-256 `675b1265eb59df47e09598683f868fd7b30b9503844e2ea9d1732442815610ed`。
- `security-cutover-after-0024.sql`：SHA-256 `5dd8df184012b64807e23e6025f04fa47d98d092da9e33b33ad1414e06ad8c5a`。
- 21:08 JSTの復元リハーサルで、21件の移行ハッシュを台帳と照合、旧17テーブルの全行の値が一致。認証機能の実送信や本番DBへの適用ではない。

これらの後続SQLは本番で未実行。初回SQLの実行結果が返ってから、前段の台帳を確認して進める。

## メール配送を追加した版

0025は週替わり配信の予約、現在同意に基づく送信権、メール内の停止、受験完了・アドレス変更による取消、SMTP受付が不明な場合の保留、期限切れジョブの記録を追加。実送信の設定は無効のまま。[配信の実装と未接続範囲](MAIL-DELIVERY.md)を分けて記録した。

- 0025までの後続ファイル：`followup-schema-0020-0025.sql`、SHA-256 `c23d66652e8c94033f227f3728b325245d29464fb1983845fae7a05c25a130f7`。
- 対応する切替：`security-cutover-after-0025.sql`、SHA-256 `cf2aebfdf4d62697b438cbc0ab8d4320ff38218741548a09bb69ac13aeecbae4`。
- 21:39 JSTの復元リハーサルで移行ハッシュ22件・旧17テーブル全行一致を確認。初回の `additive-schema.sql` は変更していない。以下で後続の現行版を0026までに更新した。

## 取り下げ問題の未回答スキップを追加した版

0026は選択肢・正誤がNULLとなる明示的なスキップ記録、承認された取り下げだけを通す確定処理、NULLを含む再送の一意性、固定週替わりの続行、採点・品質評価・復習への除外を追加。公開済み回答を書き換える処理はない。

- 現行後続ファイル：`followup-schema-0020-0026.sql`、SHA-256 `a1fd8ae8684ea45277aadd8965f1c9c87334a8751178a249b49b7bbfe15155b3`。
- 現行切替ファイル：`security-cutover-after-0026.sql`、SHA-256 `e49f8a516e279039d8a674c30db39bf19cde0cdd1b42070d39b45436a2458076`。
- 22:24 JSTの復元リハーサルで移行ハッシュ23件・旧17テーブル全行一致を確認。初回ファイルのハッシュは不変。0023/0024/0025までの後続ファイルは以前の検証履歴。
- 22:25 JSTの読み取りでも本番の新台帳・問題・管理者・プロフィール・受験はPGRST205で未取得。本人へ依頼した初回SQLの実行結果はまだ受け取っていない。

通信元チェックはブラウザ試験で失敗を再現し、Next.js 15.5.24の `NextURL` によるループバック正規化を実コード・試験で照合した。照合対象を実際のHostへ直し、Originのポート・通信方式も一致させる。任意のx-forwarded-hostやOrigin欠落は許容しない。[Next.jsの通信元照合の説明](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)も参照したが、このアプリでは独自APIの検証として実装している。22:32 JSTに142テスト・本番ビルド・PC/スマホ8件が通過。実DBでの受験から共有までの一巡は未検証。

## 798b114のGitHub反映とプレビュー

`798b114a325299e4849aa6686f098be6cb768198` を改装ブランチへpush済み。[VercelのデプロイCDWxjJcVLnMZXiY4Q8AWrv6aCVyt](https://vercel.com/rikei-talk/sci-test/CDWxjJcVLnMZXiY4Q8AWrv6aCVyt) はReady、ビルド47秒。[プレビュー](https://sci-test-6iasesuqi-rikei-talk.vercel.app/) の版で、腕試し画面のURL・「20問の腕試し」の見出し・参加条件と、検証用DB未接続の準備中表示を実ブラウザで確認した。受験を開始できたという検証ではない。本番は以前のmainのままで、SQL適用・本番への昇格・Cron設定は未実行。

22:57 JSTの読み取りでも台帳・主要4テーブルはPGRST205、件数は未取得のNULL。初回SQLの適用を確認できていない。読み取りには実行権限の検証やメール受信試験を含めていない。

## 346e591のプレビューと重点群の追加修正

物理58問を含む `346e5910dd2996bb680bc2eeb196850fb63ab4e1` もGitHubへpushし、[Vercelのug7mh529AHWKmcFBH5UzMy3do9rW](https://vercel.com/rikei-talk/sci-test/ug7mh529AHWKmcFBH5UzMy3do9rW) はReady、ビルド42秒。[該当プレビュー](https://sci-test-9oivbco5n-rikei-talk.vercel.app/) の生成を確認した。本番反映ではない。

0027は校正の対象を現在の重点・未固定問題に限定し、元の難度と訂正の版を照合。同じ問題への複数推定の同時適用を拒否し、重点枠を同じ大分野の出題可能な問題へ移す。初回SQLを変更していない。

- 現行後続ファイル：`followup-schema-0020-0027.sql`、SHA-256 `d1fc70803eb28b3ca4e4d01aaa824f65e56ce7ebad489682ef70edb4792359ff`。
- 現行切替ファイル：`security-cutover-after-0027.sql`、SHA-256 `f21c8b96fefd21a8ea58f84c92d61637652e04a9f1cf7db7718b641fd2886ba8`。
- 23:18 JSTのローカル復元リハーサルで移行ハッシュ24件・旧17テーブル全行一致を確認。0027も本番未実行。

## 66e001dのGitHub反映とプレビュー

重点群の初期化と校正の追加修正を含む `66e001d0093b674fa3801fa0a141afb158fd543e` を改装ブランチへpush済み。[Vercelの9KGMokVyFvKP9XHK2R7rVfty1rS2](https://vercel.com/rikei-talk/sci-test/9KGMokVyFvKP9XHK2R7rVfty1rS2) はReady、49秒。[プレビュー](https://sci-test-p3aoa81ew-rikei-talk.vercel.app/) の生成を確認した。本番はmainのd3b4805のまま。

最初のpushは、自動承認レビューがリポジトリの所有関係と送信先の根拠不足で拒否した。ログイン済みVercelの本番ドメイン・Repository欄・mainのコミットと、ローカルorigin・同じコミットを読み取りで再照合。本人の実装・本番反映の明示依頼との対応を添えて同じpushを再審査し、承認後に成功した。SQL実行の拒否とは別であり、DBの変更を許可されたという意味ではない。
