# 問題作成パイプライン

新規作問は `scripts/batches/<大分野>/<小分野>.json` に置き、以下の役割ベースコマンドで進めます。

| コマンド | 用途 |
|---|---|
| `pnpm questions:gaps` | 100小分野の現在問数、不足数、レベル分布を `docs/subdomain-gaps.md` と JSON に出力 |
| `pnpm questions:plan -- --domain 数学 --subdomain 情報数理` | 対象小分野を30問に近づける作問ブループリントを作成 |
| `pnpm questions:validate` | `scripts/batches` 配下の新規バッチを検証 |
| `pnpm questions:merge` | 新規バッチを `supabase/seed/generated/questions-knowledge.json` にマージ |
| `pnpm questions:build` | アプリ内の知識問題バンクを再ビルド |
| `pnpm questions:audit -- --strict` | 選択肢の消去法パターンを監査 |
| `pnpm questions:calibrate` | レベル較正レポートを更新 |
| `pnpm questions:distribution` | レベル分布を確認 |
| `pnpm questions:import` | Supabaseへ公開状態で投入 |
| `pnpm questions:pipeline` | validate、build、audit、gaps、checkを一括実行 |
| `pnpm questions:report` | 週次向けの問題バンク健全性レポートを作成 |

標準手順:

1. `pnpm questions:gaps` で不足小分野を確認する。
2. `pnpm questions:plan -- --domain <大分野> --subdomain <小分野>` でブループリントを作る。
3. ブループリントとスキルに従い、`scripts/batches/<大分野>/<小分野>.json` に4択問題を追加する。
4. `pnpm questions:pipeline` を通す。
5. 内容確認後、必要に応じて `pnpm questions:import` を実行する。
