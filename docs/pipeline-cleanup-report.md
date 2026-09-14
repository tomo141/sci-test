# 作問パイプライン整理レポート

## 方針

- 旧 `batch50` / `v5` / `gap-fill` / `basic-v1` 系の生成物は、未コミット変更が多い現状で物理削除せず、今回の変更では新しい恒常パイプラインを `scripts/pipeline/` に追加した。
- 新規作問の置き場は `scripts/batches/` に統一した。
- 旧スクリプト名を `package.json` から外し、役割ベースの `questions:*` コマンドへ切り替えた。
- 実行済み生成物の削除は、最終バンク反映確認後に別PRで `scripts/archive/` へ移動または削除する。

## 追加した恒常資産

- `scripts/pipeline/report-subdomain-gaps.mjs`
- `scripts/pipeline/plan-subdomain-batch.mjs`
- `scripts/pipeline/validate-batch.mjs`
- `scripts/pipeline/merge-batch.mjs`
- `scripts/pipeline/ci-question-checks.mjs`
- `scripts/pipeline/scheduled-audit.mjs`
- `scripts/pipeline/lib/questionHelpers.mjs`
- `scripts/pipeline/lib/taxonomy.mjs`

## 保留した物理整理

以下は問題ソースや生成物を含むため、今回の作業では削除していない。

- `scripts/batch50-generated/`
- `scripts/v5-generated/`
- `scripts/gap-fill-generated/`
- `scripts/batch50-gap/`
- `scripts/calibration-batches/`
- `scripts/write-*-batch50.mjs`
- `scripts/generate-*.mjs`
- `scripts/compute-*-blueprint.mjs`
- `scripts/patch-*-plausibility.mjs`

## 確認ログ

`pnpm questions:gaps` により、現在の `supabase/seed/generated/questions-knowledge.json` から `docs/subdomain-gaps.md` と `supabase/seed/generated/subdomain-gaps.json` を生成する。
