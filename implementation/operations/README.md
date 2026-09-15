# 定期処理の本番設定案

2026-09-15。改装プロダクトの集計・品質確認・MyASP同期のための設定。Codexの定期タスクではない。現時点ではSQL・Vault保存・スケジュールを実行していない。

| 処理 | 初期間隔 | 実行内容 |
|---|---|---|
| science-overhaul-hourly | 毎時17分 | 既存dailyエンドポイントで未処理集計、バッジ、訂正再計算、品質確認、今週・翌週の問題準備。メール送信は含まない |
| science-overhaul-myasp | 毎分 | 既存mailエンドポイントで最大1名の同意・受験状況・配信停止を同期。自動返信・ステップメール登録・他シナリオへの連動をしない |

認証にはVercel ProductionのCRON_SECRETと同じ256ビット乱数を、本番Supabase `sci-test` のVaultへ `science_jobs_cron_secret` として暗号化保存する。SQLやGitに値を埋め込まず、実行時にVaultから読む。通信先は既存の `https://sci-test.rikei-talk.com` の2エンドポイントだけ。Resend・MyASPのAPIキーをVaultへ複製する計画ではない。

[設定SQL](setup-science-cron.sql)はpg_cron・pg_netを必要に応じて有効化し、同名ジョブが既にあれば上書きせず停止する。2件は同一トランザクション内で停止状態として登録する。このSQLだけでは外部リクエストを発生させない。公開前とMyASP同期停止中は、実行時のDB設定でも呼出しを抑える。

## 承認と開始条件

VercelへのCRON_SECRET保存・表示確認は完了。Vaultへの保存は、自動承認レビューが「Vercel設定の承認は、Supabase Vaultへの秘密保存と定期処理の認証方式には及ばない」と拒否したため、未実行。入力ダイアログはキャンセルした。

本人へ、Vault保存・上記2件の設定・公開と実接続確認後の稼働をまとめて確認する。契約変更・有料オプション・メールの実配信をこの承認へ含めない。旧ジョブを停止・削除しない。承認後も開始前に公開URLの改装版への切替、0007、受験公開、認証されたHTTP呼出しとDBの完了履歴を確認する。

SupabaseはVaultがインストール済み。pg_cron・pg_netの有効化と実SQL検証は未実施。スケジューラーの成功とHTTPの成功、アプリ内部の完了を区別する。pg_netの応答は通常6時間保持されるので、開始試験ではその間にHTTPコードと完了履歴を照合する。

## 初期の処理量と見直し

MyASPは最大1名/分で、同じ人の次回確認は最短5分後。人数が増えると停止の取り込みは遅くなる。送信前の鮮度制御・キュー取消・Webhookは未接続で、案内配信を有効にする前に対応する。未処理件数と最古の待ち時間を実測して、処理量や即時通知の導入を決める。毎分の設定だけで多数利用時の同期完了を保証しない。

集計は1回に訂正20件と未処理イベント20件を処理する。未処理が1時間を超えて残る場合は、イベント処理と問題全件の品質確認を分けて実行間隔・処理量を調整する。週替わり用の審査済み予備問題が足りなければ不足を記録し、架空の問題で埋めない。

参照：[Supabase Cron](https://supabase.com/docs/guides/cron)、[Cronの設定・停止](https://supabase.com/docs/guides/cron/quickstart)、[Vaultを使う定期呼出し](https://supabase.com/docs/guides/functions/schedule-functions)、[pg_netのHTTPと応答保持](https://supabase.com/docs/guides/database/extensions/pg_net)。
