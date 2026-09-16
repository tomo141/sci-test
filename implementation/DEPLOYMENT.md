# 本番反映の記録

**今回の追加（2026-09-16 20:41 JST記録）**：本人が作問・自己評価7段階、公開説明5〜6段階を採択。該当分野の修士・博士を明記した共通7段階と、点数境界を置かない公開5段階を実装。204検査・ブラウザ28件（既存24＋追加4）・lint・型検査・本番ビルドが通過。本番反映はこれから実施する。[採択内容と検証](KNOWLEDGE-LEVELS-ADOPTED-20260916.md)。以下は以前の公開時点の記録。

**現在地（2026-09-16 14:57 JST記録）**：採点修正 `472bcfa` を既存本番へ反映済み。Vercel `9kAJ8NdP5HipgorqG9hm56o76AcZ` は14:46:59 JST Ready。SQL0032を適用し、70%対応の `science-3pl-p70-linear-v2` を有効化した。公開URLは https://sci-test.rikei-talk.com/ 。

全197テスト、PC・スマホのブラウザ24件、全体lint・型検査・本番用ビルドが通過（DB接続を前提とするローカル2件は対象外）。本番の匿名20問受験を完走し、正誤・解説、数字キーの初期選択、再読込、10分野の無加重合計、990点上限と新採点版を確認。検証用受験だけを除去し、実受験2件・回答20件・出題21件・旧版の1,000問パラメーターと設定はバックアップと一致。

S(θ)=500+200θ、N(0,2²)、グリッド−10〜10は実装上の初期規約。50/100問で990へ到達する回答経路を審査済みバンクで確認したが、実回答による精度保証や学位との対応付けは未完了。旧受験・結果は旧採点版を保持し、新規受験に新採点版を使用する。

人物像19段階は比較案として保存し、[作問・自己評価7種類、公開説明5〜6段階の提案](SCORE-BANDS-AND-TOEIC-20260916.md)は未採択・未公開。毎時集計は稼働を観測済み。MyASPは接続確認HTTP 200だが、専用12項目の定義がAPIに返らず同期は停止中。案内の実配信も無効。

検証記録：[本番状態](checks/p70-production-schema-20260916.json)、[旧データの照合](checks/p70-preservation-20260916.json)、[本番の受験確認](checks/p70-production-smoke-20260916.json)。

以下は各時点の実装・反映の履歴。


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

## b943661の保存と追加確認

物理44問と記録を追加した `b943661` はローカルGitへ保存済み。同じorigin・改装ブランチへのpushは、自動承認レビューが具体的なリポジトリへの外部送信の明示承認不足として拒否した。前回の成功で今回も通過したとは扱わず、本人へ `tomo141/sci-test` の改装内容のpush・Vercel反映の許可を確認中。バックアップ・会員情報・認証情報は送信対象外。別の送信手段で迂回していない。

23:53 JSTの本番確認は通信失敗で、スキーマの状態を新たに確認できなかった。この際、確認用スクリプトが台帳の取得失敗を各移行の `not_recorded` と表示する不具合を修正。失敗・異常な応答は `unavailable`、成功した空配列だけは `not_recorded` と区別し、エラー本文は出力しない。

ネットワーク読み取りの承認後、23:55 JSTに再取得。台帳・主要4テーブルはPGRST205で取得不能、件数はNULL。台帳そのものが読めないため、各移行の実行状態は未確認とした。SQL適用・本番昇格・配信・Cronは実行していない。

## 0028のローカル準備（9/15 01:07 JST）

生物のA/aなど、文字の大小で意味が変わる選択肢をDBが拒否する不具合を修正。0028は入力内容の検証関数だけを置き換え、既存の問題本文・選択肢・回答は変更しない。全角/半角の同一表記、同じ肢、文字列でない肢の拒否も確認した。以前のマイグレーションと初回 `additive-schema.sql` は変更していない。

- 現行後続ファイル：`followup-schema-0020-0028.sql`、SHA-256 `68da0d98203cbbc746875185c4286ba7a81e25421873132fdd2c7f2f80c901db`。
- 現行切替ファイル：`security-cutover-after-0028.sql`、SHA-256 `229fd03c1d48da2ddc08e1796022e3046da0eac15e285d862ce1a15233ab1f82`。
- 0028単体のSHA-256：`4802c0bfede49627960bf1de5a8bad58cec78d1adab5392c3e05591f11a1d644`。
- 01:07 JSTの復元リハーサルは移行ハッシュ25件・旧17テーブル全行の値の一致を確認。対象Vitest 27件、Nodeの問題準備7件、変更範囲lint・型検査が通過。本番未実行。

今回の生物23問を含め、GitHubへの追加pushは前記の本人確認待ち。本番の最終読み取りは9/15 00:47 JSTで、台帳・主要4テーブルはPGRST205。本番への変更・配信は行っていない。

### 9/15 02:52 JSTの再開時確認

本人の「再開して」を受け、実モデルgpt-6-astra/maxとkinako3の作業ルートを再確認。既存認証を用いたREST読取では、移行台帳とscience_items/admins/profiles/attemptsは引き続きPGRST205。件数はnull、移行状態はunavailableであり、0件や移行未記録と解釈しない。初回SQL・具体的GitHub宛てpush・SMTP・正式運営主体の確認待ちは解消していない。本番への変更やメール送信は行わず、独立した問題審査を継続した。

### 9/15 15:06〜15:07 JSTの実候補検証と本番再確認

新版1,020問の準備を完了し、隔離したローカルDBで初回SQL→0020〜0028→旧権限切替→実候補の取り込み・公開切替を実行した。`scripts/rehearse-science-migration.mjs` に候補ファイルを任意で渡せるようにし、保存された内容・根拠・パラメーター、再投入、2週分の固定問題、新規受験の公開設定不変を検査する。ネットワークへ接続する処理ではない。

結果はGit対象外の `implementation/local/deployment/rehearsal.json`。候補ハッシュ `23a6031a6803d3b782c8c9c7711d58a112aa41e07bcbeaaa22154f60fd715a14`、移行ハッシュ25件、旧17テーブルの全行一致。初回・後続・権限切替のSQLハッシュは01:07の確定版と同じ。受験開始の設定やメール配信を有効にしたものではない。

15:07:48 JSTの本番REST読み取りは、台帳とscience_items/admins/profiles/attemptsがPGRST205、schemaReady=false、件数null。SMTP・権限・実ユーザーの一巡は今回の読取では未検証。初回SQLの手動実行結果、GitHub `tomo141/sci-test` 宛てpushの確認、SMTP・投稿条件の回答は未解消。本番DBの変更、GitHubへの追加送信、本番昇格、メール送信は実施していない。[現在の残件](RELEASE-CANDIDATE.md)へ集約した。


## 9/15 16:33〜16:44 JST：本人承認後の本番SQL適用

本人から「SQL、実行して」、指定GitHubへのpush・既存Vercel本番反映、個人事業「理系とーく 川村智祥」の明示回答を受領。実モデルgpt-6-astra/maxを確認し、SQLと送信先を再質問せず進めた。

- `f30bcfafec48f6fa37bf0d667cb347e0076905db` を指定改装ブランチへpush済み。初期1,020問、実装・審査記録、運営者表記、[固定SQL一式](sql-release/README.md)を含む。差分95ファイルを検査し、バックアップ・会員情報・認証情報は対象外。
- [Vercel Bftpjvz3QaQVSHZvhYGnfJmY1ZAS](https://vercel.com/rikei-talk/sci-test/Bftpjvz3QaQVSHZvhYGnfJmY1ZAS) は46秒でReady。f30bcfa・Preview環境の一致と、[利用規約](https://sci-test-fga96fipw-rikei-talk.vercel.app/terms)・プライバシーの運営者表記を実画面で確認。本番昇格ではない。
- 初回SQLは固定コミットの可視コード欄から取得し、GitHubが省いた末尾改行だけを復元。93,128 UTF-16文字・FNV-1a `845425b9` が元ファイルと一致。Supabaseへの貼り付け後も全選択・コピーで全文を読み戻し、文字列の完全一致を確認した。
- 事前検出はSQL内の一括RLS設定を認識しなかったため、自動でSQLを変更する「Run and enable RLS」は使わず、検証済み本文をそのまま実行。16:33:01に初回15件を適用し、16:33:52のRESTで全15件のハッシュ一致を確認。
- 追加0020〜0028も74,354文字・FNV-1a `78a9ec72` と全文読み戻しの一致を確認して実行。16:39:47のRESTで合計24件のハッシュ一致。0007はアプリ切替時まで未実行で、台帳は `not_recorded`。以前のSQL・pushの拒否は今回の明示承認と全文検証後に解消した。
- 16:39:51の `verify-science-legacy.mjs` は旧17テーブルの元の列・全行を本番RESTから照合し、件数・値ともバックアップと一致。追加された新列は比較対象外。取得失敗は `unavailable` として一致扱いにしない。結果はGit対象外 `legacy-live-check.json`。
- 読み取りSQLで新版40テーブルすべてにRLS有効、anon/authenticatedから読めるscienceテーブル・ビュー0、実行できるscience関数0。旧サイト側の権限は0007による切替前であり、旧権限閉鎖済みとは扱わない。
- 新版の問題・管理者・プロフィール・受験は各0、active releaseなし。newAttempts・mailDelivery・labSubmissionsはfalse。旧プロフィール・利用権・同意の継承は0007で行う。

既存ADMIN_EMAILS 1件、旧プロフィール一致1件、Auth確認済み1件、運営者公開連絡先一致1件を読み取り確認。ただし `science_admins` への引き継ぎは、自動承認レビューが「その具体的な永続権限付与への明示承認不足」として拒否した。権限変更と監査行の追加は未実行。本人へ運営者1件の登録承認を依頼し、別のSQLや経路で迂回していない。

メール方式の説明と選択肢は [MAIL-DECISION.md](MAIL-DECISION.md)。新規契約・支出・実配信は未実施。承認後の問題投入、メール接続・受け入れ試験、その後の0007とアプリ本番切替が残る。現在のSupabaseエディターは読み取り用の権限確認SQLで、移行ファイルではない。

## 2026-09-15：管理者・問題バンクの本番反映、メール方式の採択

前節の管理者確認待ちは解消した。本人が既存の本人確認済み運営者1名へのscience_admins権限を明示承認し、台帳登録とoperator_bootstrap監査記録が成功。旧profiles.roleの値を一括で管理者権限へコピーしていない。

1,020問をcandidateとして投入後、16:59 JSTに全件の本文・審査記録・パラメーターを読み戻して一致を確認。有効化し、17:01 JSTにactive releaseと全件を再確認。各大分野正式100問、週替わり2問、重点20問、10小分野。旧問題との対応1,062件は一致し、既存DBにない旧ID18件は未対応として記録。newAttempts/mailDelivery/labSubmissionsはfalseのまま。読み戻しスクリプトはscripts/verify-science-bank-live.mjs、詳細報告はGit対象外。

メールは本人がResend＋既存MyASP、差出人tomoyoshi@rikei-talk.comを採択。同期SQL0029とコードを追加し、17:21 JSTに全160テスト通過、型の1件を修正して17:25 JSTに型検査・対象11テストとlintを再確認。本番用ビルドも成功。0029はこの記録時点で本番未適用。MyASP専用APIキーの発行は、自動承認レビューが具体的な資格情報・権限範囲への明示承認不足として拒否。本人へ承認を依頼した。別経路でキーを発行・転用していない。

17:42 JST、復旧用バックアップの隔離複製に、本番と同じ固定SQL0004〜0028、0029だけの差分、0007の順で適用した。26件の台帳ハッシュ、旧17テーブルの元の列・全行一致、4会員・4同意の継承、旧権限閉鎖、実際の1,020問と週替わり2週の構築が通過。同じ0029差分の再実行を拒否することも確認した。新しい[固定SQL](sql-release/README.md)を保存し、従来の固定SQLは変更していない。17:44 JSTに最終の対象11テスト・型検査・変更範囲lintが通過。pnpmの起動で応答がない3プロセスを終了し、インストール済みの同じ検証コマンドを直接実行した。

[接続条件](MAIL-DELIVERY.md)。本番アプリはまだ旧版。0007、接続・実受信と受験の一巡、アプリ切替、ジョブ有効化が残る。

## 2026-09-15：追加SQL0029と本番候補ビルド

`2fa8dbd0bdfd19cf8851956f1215a50e2d50882e` を承認済みの同じ改装ブランチへpushした。差分28ファイルの秘密パターンと対象パスを検査し、バックアップ・会員情報・認証情報は含めていない。

- 0029だけの固定SQLをGitHubの当該コミットから読み、17,699文字・FNV-1a `48e62580` を照合。Supabaseエディターの全選択・コピーによる全文一致を確認して実行した。17:55 JSTのREST読取で25件の適用ハッシュが一致し、未適用は0007のみ。新版41テーブルのRLSが有効、ブラウザから読み取れるscienceテーブル・ビューおよび実行できるscience/public・science_private関数はいずれも0。
- 17:55の旧データ照合は旧17テーブルの元の列・全行が一致。17:56の問題バンク照合も1,020問の本文・審査根拠・パラメーターが一致した。MyASP同期、受験・配信・投稿の公開ゲートはfalse。
- [Preview 7g16raHxDAiyN1sNFDwbyFFqEX2y](https://vercel.com/rikei-talk/sci-test/7g16raHxDAiyN1sNFDwbyFFqEX2y) はReady・58秒。更新したMyASP/Resendの説明をプライバシーページで確認。
- ドメイン自動割当を一時的に無効化し、同じソースをProduction環境で再ビルド。[候補9NmgC92pMneabgTmoC4eW5cDkBWz](https://vercel.com/rikei-talk/sci-test/9NmgC92pMneabgTmoC4eW5cDkBWz) はReady・1分6秒、Staged Domainsのみ。18:07 JSTまでに自動割当を元の有効状態へ戻し、main追跡とともに読み戻した。
- Vercelの公開中Deploymentは `CXBffiiPrXk9fqwTHeQAK6vYpbKS`、旧mainの `d3b4805` と再確認。[候補画面](https://sci-test-9znwwyriv-rikei-talk.vercel.app/)ではトップと腕試しの実際の公開準備中表示を確認。受験の完走・メール受信の試験とは区別する。
- 18:14 JST、`initialize-science-weeks.mjs` の読み取り準備後に、承認済み予備問題から9/14週・9/21週の各10問を保存し、全ID・開始終了日時を読み戻した。20問は互いに重複せず、正式試験の問題との重複も0。公開ゲートは変更していない。手動初期化であり、定期ジョブが接続済みという意味ではない。

Vercelの[公式の段階的な本番公開方法](https://vercel.com/docs/deployments/promoting-a-deployment)と管理画面の「Custom domains won't be assigned」を確認して操作した。別の本番ブランチへ変更したり、公開中の旧版をこの作業で差し替えたりしていない。

## 2026-09-15：メール接続設定の保存

本人からResendログイン完了と、MyASP専用キーの発行・Vercelへの保存の明示承認を受領した。18:43:54 JSTにMyASPで「全分野科学検定・本番同期」を発行。Vercel Production専用のSecretにSCIENCE_MYASP_API_KEY、Configに接続URL・サーバーURL・検定シナリオID・公開オリジンの4項目を保存し、表示を読み戻した。既存キーや他シナリオの配信設定は変更していない。

転記時に一度、ブラウザの自動承認レビューが審査モデルの容量不足で失敗。保存先のProduction・Secretと未入力状態を読み戻して同じ操作を再試行し、成功を確認した。現在の未解決な承認拒否ではない。キー本文はツール出力・Gitに残していない。

MyASPの初回2通は停止状態で保存し、送信元・件名・本文を照合。原稿と実設定の区別は[案内原稿](MYASP-MAIL-DRAFTS.md)に記録。Resendは送信ドメインを登録し、Xserverへのログインを本人へ依頼した。[DNS・SMTP準備](RESEND-AUTH-SETUP.md)。

18:59 JSTにMyASP接続確認を含む関連15テスト・型検査・対象lintが通過。19:02 JSTまでに本番用ビルドも通過。定期処理用のCRON_SECRETは256ビットの暗号学的乱数を生成し、Vercel Production専用Secretへ保存・表示確認した。ジョブのスケジュール・MyASP実通信・メール送信は未実施。新しい環境変数を使用するには再デプロイが必要。

`8bc5b1d85cf651f4095957c30a4c573070a0b274` の15ファイルを検査し、秘密パターン・バックアップ・会員情報を含まないことを確認して同じ改装ブランチへpushした。[Preview 71X8txjcR5ig3bWuKPdHxNHKGynu](https://vercel.com/rikei-talk/sci-test/71X8txjcR5ig3bWuKPdHxNHKGynu)はReady・46秒。

同じソースと更新後のProduction設定で、19:11 JSTの[候補BsQmFtZtv4T3fWndZSuTCmCrKfLT](https://vercel.com/rikei-talk/sci-test/BsQmFtZtv4T3fWndZSuTCmCrKfLT)を作成し、ReadyとStaged Domainsを確認した。ドメイン自動割当は作成中だけ無効にし、その後有効へ復元・再読取した。main追跡も保持。公開中は引き続き旧mainのd3b4805 / CXBffiiPrXk9fqwTHeQAK6vYpbKS。

[新候補](https://sci-test-b6b1cdyer-rikei-talk.vercel.app/)でトップと腕試しの実際の「公開準備中」を確認した。ジョブAPIの無認証表示をブラウザで確認しようとしたが、ナビゲーションがERR_BLOCKED_BY_CLIENTで開けず、HTTP 401の実確認には数えていない。MyASPの接続チェックは管理者ログイン後の実行待ち。

CRON_SECRETをSupabase Vaultへ保存する操作は、自動承認レビューが「Vercel設定の承認はVault保存・定期処理の認証方式には及ばない」と拒否。保存前のフォームをキャンセルし、別経路で実行していない。[毎時の集計・毎分の同期の設定案](operations/README.md)と停止状態で作成するSQLを用意し、Vault保存・設定・公開と実接続確認後の稼働を本人へ確認中。スケジュール・Vault保存とも未実行。

## 2026-09-16：初回の改装公開と追加変更の準備

00:57以降、Vault・拡張機能・停止状態の2ジョブを設定し、APIの公開範囲を確認。本人の承認後にSMTPを保存し、確認コードを本人が受信・入力してログイン成功を確認した。確認メールの2テンプレートを同じ6桁コードへ統一した。[Resendの実設定](RESEND-AUTH-SETUP.md)。

01:12:02 JSTに0007の旧権限・会員継承を適用。01:13頃に8bc5b1dの本番候補BsQmFtZtv4T3fWndZSuTCmCrKfLTを既存ドメインへ昇格。01:15の読取で0004〜0029の26件のハッシュ一致と、旧17テーブルの元の列・全行保持を確認した。01:17に新規受験を開き、匿名の腕試し20問・結果再読込・共有・公開取消を確認。検証用の受験だけを固定IDと匿名所有条件で限定して削除し、本人の実受験は対象にしていない。

01:29のpg_net応答は無認証の集計・同期が401、認証付き集計が200・completed、認証付き同期は停止設定の200・disabled。01:34にMyASP同期設定を有効にしたが、手動確認は503・myasp_fields_not_prepared。Cronは停止のまま、実際の案内メールも無効。専用12項目のメタデータだけを運営画面へ返す診断を追加した。既存MCP接続の読取も失敗し、これを同期成功と数えていない。

本人の追加指示から、全モードの即時フィードバック、数字キーの選択／即回答チェック、腕試しの等重み履歴、本試験の今回のみ選択、不足時の再出題・採点・本人だけの警告を実装。PC・スマホ幅のブラウザ16ケース、全185テスト、型検査・対象lint、本番用ビルドが通過。再出題を含む点数と、初見のみの問題校正を分けた。

投稿条件は本人が全文案を採用し公開を承認した。外部専門家の確認と区別する0030、再出題の0031を凍結した。追加SQLは followup-schema-0030-0031.sql、SHA-256 4c0a9df6fb5840364022886fe1358ffe8639387f4ec859d50f5b79b6e10a98c0。投稿公開SQLは open-science-lab.sql、SHA-256 db12472b1715f399a31e368e026b67a4d98e77fa7cc50a04c550746fa285cb01。採用全文のSHA-256は22a954969bd98877d5c4f16723d7f30d0d438c3526cbb705c86f5f4dc41f1292。

02:25のローカル復元リハーサルは0031まで28件のハッシュ、旧17テーブル全行、実バンク1020問が一致。02:31の投稿公開SQLの独立リハーサルも、公開条件・本人採用の記録・案内送信false・二重実行拒否を確認した。追加SQLの本番適用とは区別する。02:28頃、追加変更前の新版参加者記録・設定・投稿条件の10テーブルを、このMacのGit対象外へ保存・読み戻した。複数テーブルにまたがる単一時点スナップショットやAuth・ストレージのバックアップではない。

現行採点には、990が出ないことと少ない問題数で端の実力を中央へ寄せすぎる問題がある。[数値検証・旧定義・改善案](DIFFICULTY-AND-SCORE-REVIEW.md)と[仕様変更一覧](SPEC-CHANGES-REVIEW.md)に明記。上下限の定数を戻すだけで解決済みとは扱わず、新しい点数の意味を本人へ提案する。

02:37頃に0030/0031を適用し、02:38:41の読み戻しで28件すべてのハッシュ一致を確認。参加者の元の受験2件・出題21件・回答20件・プロフィール4件・同意4件の値も保持した。02:40の55qPSKjfqKiCjXjdZ7VVkeeoLowfがProductionでReady、6c8a444と既存2公開ドメインへの割当を確認した。

投稿条件の受付公開SQLも適用し、採用全文11条のハッシュ・active・本人採用の根拠・法務審査記録なしを照合した。案内メールの送信設定はfalseを維持。02:49の本番Chrome試験で、数字の標準選択、即時正誤・解説・開閉式の詳細、再読込後の解説、チェック時の即回答を確認。別の匿名ブラウザの検証受験だけを後処理する。[本番操作検証](checks/production-feedback-20260916.json)。

新版管理画面は本番ホストで再ログインを必要としたため、本人へ同じ確認コード作業を重ねて依頼せず、認証済みの定期処理の失敗記録にも専用12項目の型・ラベル・編集可否だけを残す診断を追加した。メールアドレス・読者ID・項目値・秘密は含めない。これはMyASP同期の失敗原因を調べる変更で、同期成功を意味しない。

## 2026-09-16：再開、集計の稼働、具体的な公開操作の承認待ち

公開中はc4f32f6 / Hy3nu5ALsjmNnLuNbmLvwbhy7X4m。6c8a444の本番操作検証に使った匿名受験の除去を完了し、実ユーザーの受験は保持した。pg_net番号6はHTTP 200 / completedでアプリのdaily完了記録とも一致。番号7は503 / myasp_ambiguous_identityだった。

b6bbd79のプレビューBfksVVgfwFTk6dRRut1FUKzZTJi8はReadyだったが、TypeCheckがpackage.jsonのコマンド不足で省略されていた。typecheck: tsc --noEmitを追加し、ローカルの全体eslintと型検査はexit 0。835cc39を指定ブランチへpushし、03:40:22 JSTのPreview ApHfRskP49TQHmp9fyPhPBAPW4e5はReady（52秒）、TypeCheckも通過（25秒）。Lintの単独チェックは「ビルド内で実行済み」のため省略され、ビルドログのLinting and checking validity of typesとビルド完了を確認した。

その状態でもVercelはForce Promoteを表示した。既存2ドメイン・Production環境での再ビルド・835cc39を確認して公開操作を試みたが、自動承認レビューが「本番反映自体は承認されているが、Lint要件の具体的なバイパスへの承認がない」と拒否した。実行済みと扱わず、別経路で昇格もしていない。本人へこの方法を確認するため、検証済み候補を保持した。

承認済みの毎時集計は独立して実施した。activate-hourly-20260916.sqlで、コマンド・間隔・公開設定・HTTP番号6・アプリ完了・検証受験除去を確認し、science-overhaul-hourlyだけactive=trueへ変更、監査記録と読み戻しを完了。MyASPはactive=falseを維持。Cronによる初回呼出しは未観測で、HTTPの手動検証と区別する。

MyASPの管理画面へ既存ログインで接続し、free31〜42の専用名、hidden型、use=true、required=falseを再照合した。公開中c4f32f6の通常同期を1回だけ追加検証（pg_net番号8）し、HTTP 503 / myasp_fields_not_prepared。12項目すべてのメタデータがAPIの読者詳細から欠落していた。管理画面側を未保存と断定せず、返却形式・対象フォームの差を調査対象に残す。読者の重複も自動で統合・選択していない。案内送信はfalse。

本人の「アンケートを少しずつ」「対象段階の問題を自分も70%解けそう、をラジオボタンで選ぶ」案をAUTHORING-CALIBRATION-PROPOSAL.mdへ追記した。自己評価と実際の履修経験を別に保存する案、70%へ揃える採点換算は判断前で、本番の点数や質問フォームを変更していない。
