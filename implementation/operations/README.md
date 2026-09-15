# 定期処理の本番設定

観測・記録日：2026-09-16。改装プロダクトの集計・品質確認・MyASP同期のための設定。Codexの定期タスクではない。Vault保存、pg_cron・pg_netの有効化、下記2ジョブの停止状態での作成・読み戻しを完了。稼働とHTTP実接続はまだ行っていない。

| 処理 | 初期間隔 | 実行内容 |
|---|---|---|
| science-overhaul-hourly | 毎時17分 | 既存dailyエンドポイントで未処理集計、バッジ、訂正再計算、品質確認、今週・翌週の問題準備。メール送信は含まない |
| science-overhaul-myasp | 毎分 | 既存mailエンドポイントで最大1名の同意・受験状況・配信停止を同期。自動返信・ステップメール登録・他シナリオへの連動をしない |

認証にはVercel ProductionのCRON_SECRETと同じ256ビット乱数を、本番Supabase `sci-test` のVaultへ `science_jobs_cron_secret` として暗号化保存する。SQLやGitに値を埋め込まず、実行時にVaultから読む。通信先は既存の `https://sci-test.rikei-talk.com` の2エンドポイントだけ。Resend・MyASPのAPIキーをVaultへ複製する計画ではない。

[設定SQL](setup-science-cron.sql)はpg_cron・pg_netを必要に応じて有効化し、同名ジョブが既にあれば上書きせず停止する。2件は同一トランザクション内で停止状態として登録する。このSQLだけでは外部リクエストを発生させない。公開前とMyASP同期停止中は、実行時のDB設定でも呼出しを抑える。

## 承認と開始条件

9/16に本人がVault保存を明示承認。その後、拡張機能・一般利用者からのアクセス制限・停止状態の作成・検証後の稼働も明示承認した。Vercelと同じキーのVault保存を完了し、64文字の有効な秘密が1件、anon/authenticatedのVault読取権限がfalseであることを、値を出力せず確認した。過去の承認レビューによる保留は解消済み。

契約変更・有料オプション・案内メールの実配信はこの承認に含まれない。旧ジョブは変更していない。開始前に公開URLの改装版への切替、0007、受験公開、認証されたHTTP呼出しとDBの完了履歴を確認する。

適用したSQLのSHA-256は `e028c2af8c6da85d6602a3028978e872a076cbe7986777785fd27bc5dfc966c2`。同名ジョブが既にある場合は停止するため、再実行せず現状を読んでから変更する。スケジューラーの成功とHTTPの成功、アプリ内部の完了を区別する。pg_netの応答は通常6時間保持されるので、開始試験ではその間にHTTPコードと完了履歴を照合する。

## Hosted pg_netの権限と実際の公開範囲

最初の2回の設定SQLは、netのテーブルにPUBLIC権限があることを検知して全体をロールバックした。REVOKEを加えた試行でも、所有者がSupabase管理ロールのためpostgresからの取消は実効性がなかった。これを権限変更成功として扱わない。診断用の一時トランザクションも例外で取り消し、秘密の値・HTTPヘッダーは出力していない。

[Supabase公式の説明](https://supabase.com/docs/guides/database/extensions/pg_net#permissions)に従い、Data APIで非公開であることと、公開関数から到達できないことを検証する。9/16のSQLでanon/authenticatedはともにNOLOGIN、public/graphql_public内でブラウザから実行可能かつnet/vault参照または動的SQLを使うSECURITY DEFINER関数は0件だった。SQL内の設定値からAPI公開スキーマは取得できなかったため、そのNULLを非公開の証拠にはしていない。

[検証スクリプト](../../scripts/verify-science-job-boundary.mjs)は公開キーで0行だけを要求し、netの待ち行列・応答、Vault、Cronの4対象がすべてHTTP 406 / PGRST106（スキーマ非公開）となることを確認する。拡張機能の作成前と作成後（2026-09-16 00:57:08 JST）に成功。レコード本文は要求・表示していない。SQLのテーブルACL自体を閉じたという意味ではなく、公開API・DBログイン・RPCの境界で保護している。API公開スキーマや公開関数を変更する場合は、この検査を必ず再実行する。

## 初期の処理量と見直し

MyASPは最大1名/分で、同じ人の次回確認は最短5分後。人数が増えると停止の取り込みは遅くなる。送信前の鮮度制御・キュー取消・Webhookは未接続で、案内配信を有効にする前に対応する。未処理件数と最古の待ち時間を実測して、処理量や即時通知の導入を決める。毎分の設定だけで多数利用時の同期完了を保証しない。

集計は1回に訂正20件と未処理イベント20件を処理する。未処理が1時間を超えて残る場合は、イベント処理と問題全件の品質確認を分けて実行間隔・処理量を調整する。週替わり用の審査済み予備問題が足りなければ不足を記録し、架空の問題で埋めない。

参照：[Supabase Cron](https://supabase.com/docs/guides/cron)、[Cronの設定・停止](https://supabase.com/docs/guides/cron/quickstart)、[Vaultを使う定期呼出し](https://supabase.com/docs/guides/functions/schedule-functions)、[pg_netのHTTPと応答保持](https://supabase.com/docs/guides/database/extensions/pg_net)。
