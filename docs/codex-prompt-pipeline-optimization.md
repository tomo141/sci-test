# 【Codex実装依頼】作問パイプライン整備・ディレクトリ最適化・継続改善の仕組み化

そのままCodexに渡す実装依頼。**大きく4つのワークストリーム**からなる。各ストリームは独立PRに分割してよい（推奨: WS1→WS2→WS3→WS4の順、ただしWS2の一部はWS1と並行可）。

---

## 背景と現状（Codexはまず読むこと）

- 理科検定アプリ（Next.js App Router + Supabase）。10大分野 × 10小分野 = 100小分野に再編済み（`src/lib/data/taxonomy.ts`、コミット済み）。
- 問題バンクは約1,340問。**リマップ後、全100小分野が30問未満・84小分野が20問未満**（ワースト: 数学/情報数理=1, 数学/離散数学・組合せ=2, 数学/数値解析・最適化=3, 物理/計測・プラズマ・重力波=3, …）。
- 目標: **全小分野を30問に均す**（新規 約1,660問）。まず20問未満の84小分野を優先。
- 作問の実態: `scripts/write-*-batch50.mjs` に**手書きの問題JS配列**があり、`q()` ヘルパで整形→`scripts/*-generated/` にJSON出力→validate→merge→`questions:build-knowledge`→audit→import、という流れ。**LLM APIは介在しない**。実際の「執筆」はCodex/Claudeがスキルに従い中身を書く。
- 作問スキルは `.cursor/skills/science-question-creation/SKILL.md` が入口の7ステップ（Step0仕様→1ブループリント→2レベル→3執筆→4選択肢監査→5QC→6出典→7投入）。下位スキルは `skills/` 配下に7個 + `.cursor/skills/` に2個。

### 現状の問題点（このタスクで解消する）
1. **小分野単位のギャップ可視化がない** — どの小分野が何問足りないか一目で分からない。
2. **並行バッチ系が乱立** — `batch50` / `v5` / `gap-fill` / `basic-v1` の4系統。package.jsonに `questions:*` が20本以上。命名がバージョン依存（v1/v2/v3/v5）で新規参入者に不明瞭。
3. **scripts が散らかっている** — 33本のワンオフ `.mjs` と5つの生成物ディレクトリ（`batch50-generated/` 988K, `v5-generated/` 532K 等 計約2.2MB）がフラットに混在。`q()` ヘルパが `write-chemistry-batch50.mjs` 内と `lib/batch50-helpers.mjs` に重複。
4. **品質・分布の継続監視が手動** — 較正・分布・選択肢監査は都度手実行。CIチェックやダッシュボードがない。
5. **スキルが2箇所に分散** — `.cursor/skills/`（入口2個）と `skills/`（下位7個）。入口が `.cursor` 側にあり分かりにくい。

### 制約（壊してはいけないもの）
- 本番投入パイプライン（`questions:import:knowledge` → `supabase/seed/generated/questions-knowledge.json`）の出力互換。
- `supabase/seed/question_schema.json` のスキーマ。
- 既存の受験・スコアリング挙動（総合/分野/小分野）。
- `pnpm lint && pnpm test && pnpm build` が常にグリーン。

---

## WS1: 小分野ギャップ可視化と作問ターゲティング

### 1-1. ギャップレポートスクリプト `scripts/report-subdomain-gaps.mjs`
- ビルド済みバンク（`supabase/seed/generated/questions-knowledge.json` またはビルド元）を読み、**100小分野 × 現在問数 × 目標30問 × 不足数 × レベル分布（L100〜900の帯ごと問数）** を集計。
- 出力: (a) コンソールに不足数降順テーブル、(b) `docs/subdomain-gaps.md`（人間可読、コミット対象）、(c) `supabase/seed/generated/subdomain-gaps.json`（機械可読）。
- 各小分野で「不足数」だけでなく「**どのレベル帯が欠けているか**」を出す（例: 数学/情報数理 は L100-300 が0問、など）。これがブループリントの入力になる。
- package.json: `"questions:gaps": "node scripts/report-subdomain-gaps.mjs"`。

### 1-2. 小分野ブループリント生成 `scripts/plan-subdomain-batch.mjs`
- 引数: `--domain <大分野> --subdomain <小分野> [--target 30]`。
- ギャップJSONを参照し、その小分野を30問に到達させるための**不足レベル帯 × 認知タイプ**の設計表（ブループリント）をMarkdownで出力。既存問題と難度分布が均等になるよう不足帯を優先配分。
- 出力は `scripts/blueprints/<domain>-<subdomain>.md`。Codex/Claudeが執筆時にこれを読む。

### 1-3. 作問ワークフローの標準化（後述WS4のスキルと連動）
- 「小分野を1つ埋める」標準手順を確立: `questions:gaps` で対象特定 → `plan-subdomain-batch` でブループリント → スキルに従い執筆（JSON） → 検証 → merge → build → audit → import。
- この手順をWS4で単一スキル `science-subdomain-fill` として明文化。

---

## WS2: 作問パイプラインの統合・簡素化

### 2-1. 統一バッチ構造への集約
現状の4系統（batch50/v5/gap-fill/basic-v1）を**単一の「バッチ」概念**に統合する。既存バンクは凍結（再生成しない・出力互換維持）し、**今後の新規作問はすべて新パイプラインに乗せる**。

- 新ディレクトリ構造:
  ```
  scripts/
    pipeline/                     # 恒常パイプライン（保守対象）
      lib/questionHelpers.mjs     # q(), balanceAll() 等を一本化（重複解消）
      report-subdomain-gaps.mjs
      plan-subdomain-batch.mjs
      validate-batch.mjs          # 汎用バリデータ（v5/batch50バリデータを統合）
      merge-batch.mjs             # 汎用マージャ
      audit-choice-plausibility.mjs
      calibrate-question-levels.mjs
      report-question-level-distribution.mjs
      import-question-bank.mjs
      build-knowledge.mjs (or 既存vitest build を維持)
    batches/                      # 作問バッチのソース（分野・小分野別JSON）
      <domain>/<subdomain>.json   # 新規作問はここに置く
    archive/                      # 旧ワンオフ・中間生成物（git履歴で追える物は削除も可）
  ```
- **重複ヘルパ解消**: `write-chemistry-batch50.mjs` 内の `q()` と `scripts/lib/batch50-helpers.mjs` の `q()` を `pipeline/lib/questionHelpers.mjs` に一本化。
- **汎用バリデータ/マージャ**: `validate-v5-batch.mjs` / `validate-batch50.mjs` を1つに、`merge-v5-questions.mjs` / `merge-batch50-questions.mjs` / `merge-gap-fill-questions.mjs` を1つに統合（バッチディレクトリを引数で受ける）。

### 2-2. ワンオフ・生成物の整理
- **ワンオフ生成スクリプト**（`write-*-batch50.mjs`, `generate-*.mjs`, `compute-*-blueprint.mjs`, `fix-v5-batch.mjs`, `patch-*-plausibility.mjs`, `gen-informatics-v1.mjs` など、一度きりの実行が済んだ物）→ `scripts/archive/` へ移動。**中身は問題ソースなので消さず、実行済みバッチは `scripts/batches/` の該当小分野JSONに集約**するか archive に残す。
- **中間生成物ディレクトリ**（`scripts/batch50-generated/`, `v5-generated/`, `gap-fill-generated/`, `batch50-gap/`, `calibration-batches/`）→ 最終JSONが `supabase/seed/generated/` または `scripts/batches/` に反映済みのものは削除。反映漏れがあれば先に集約してから削除。**削除前に、各ディレクトリの内容が最終バンクに含まれているかを検証するスクリプトを1本書き、ログを `docs/pipeline-cleanup-report.md` に残す**（何を消し何を残したかの証跡）。
- `scripts/*.json`（`choice-plausibility-fixes*.json`, `gap-fill-*.json` 等の作業用JSON）→ 役割を確認し、恒常設定なら `pipeline/config/` へ、使い捨てなら archive へ。

### 2-3. package.json スクリプトの整理
- `questions:*` を**役割ベースの命名**に再編（バージョン名を排除）:
  ```
  questions:gaps                 # WS1-1
  questions:plan                 # WS1-2（引数で小分野指定）
  questions:validate             # 汎用（バッチdir引数）
  questions:merge                # 汎用
  questions:build                # build-knowledge
  questions:audit                # 選択肢監査
  questions:calibrate            # レベル較正
  questions:distribution         # 分布レポート
  questions:import               # 投入
  questions:pipeline             # validate→merge→build→audit を一括
  ```
- **旧スクリプト名は残さない**（バージョン依存名の廃止が目的）。ただし本番運用中のCI/手順書から参照されていないか確認し、参照があれば新名に更新。
- README（`scripts/README.md` を新規作成）に各コマンドの用途・引数・実行順を1画面で記す。

---

## WS3: 継続改善の自動化

### 3-1. 品質ダッシュボード（管理画面）
- `app/admin/` 配下に**問題バンク健全性ダッシュボード**を追加（管理者のみ、既存の admin 認証・RLS方針を踏襲）。
- 表示内容:
  - 小分野別: 現在問数 / 目標30問 / 不足数 / レベル分布ヒートマップ / draft比率。
  - 公開状況: `subdomain_release_status`（小分野受験実装で追加済みのテーブル）と問数を突き合わせ、「30問揃ったが未公開」「公開済だが薄い」を強調。
  - 選択肢監査の high severity 件数、較正で乖離の大きい問題トップN。
- データ源: WS1のギャップJSON + Supabaseの問題テーブル + 既存 audit/calibration レポートJSON。ビルド時生成のstatic JSONを読む方式で可（リアルタイムDBクエリは必須でない）。

### 3-2. CIチェック（`.github/workflows/` またはローカル `pnpm preflight` 拡張）
- 既存 `scripts/preflight.mjs` を拡張、または新規 `scripts/pipeline/ci-question-checks.mjs`:
  - スキーマ検証（全問が `question_schema.json` 準拠）。
  - 選択肢監査 high severity = 0（`audit --strict`）。
  - 小分野の存在整合（全問の subdomain が taxonomy の100小分野に含まれる）。
  - **回帰ガード**: 既存の公開済み問題数が減っていない（誤削除検出）。
  - 正答位置分布の偏りが閾値内（A/B/C/D 各20〜30%）。
- CIが無い場合は `pnpm preflight` に統合し、**バッチ投入前に必ず走る前提**にする。README/スキルに明記。
- GitHub Actions を新設する場合は最小構成（lint + test + question-checks）。既存にCI設定があるか確認し、あれば拡張。

### 3-3. 定期監査タスク
- `scripts/pipeline/scheduled-audit.mjs`: ギャップ + 分布 + 較正乖離 + 期限切れ時事問題（`expires_at` 経過）をまとめて1レポート（`docs/weekly-bank-report.md`）に出力するコマンド。
- 実行は手動 or Cron（Codexはスクリプトと `questions:report` コマンドまで用意。cron/GitHub Actions schedule への登録は運用判断としてREADMEに手順を書く）。

---

## WS4: スキル体系の再編

### 4-1. スキルの一元化
- `.cursor/skills/` と `skills/` の二重管理を解消。**入口スキル `science-question-creation` を `skills/` 側に移すか、少なくとも役割と置き場所を README で明示**（どちらに寄せるかはCodexが既存のスキル読み込み設定 `.cursor` / `.claude` の仕組みを確認して決定。移動でスキル探索が壊れないことを確認）。
- 重複・粒度の見直し: 9スキルの役割表（入口スキルの末尾にある一覧）を最新化。`mcq-item-writing`（汎用）と `science-question-author`（リポ固有）の境界が曖昧なら統合を検討。

### 4-2. 小分野作問スキル `science-subdomain-fill` の新設
- WS1の標準手順を1スキルに明文化（`science-question-creation` の下位、Step群を小分野埋め用にオーケストレート）:
  1. `questions:gaps` で対象小分野と不足レベル帯を特定
  2. `questions:plan --domain X --subdomain Y` でブループリント
  3. ブループリントに従い執筆（既存の執筆規則・レベル定義を参照）
  4. `questions:validate` → `questions:merge` → `questions:build` → `questions:audit --strict`
  5. QC・出典確認 → `questions:import`（draft/published判定）
  6. ダッシュボードで反映確認、30問到達なら公開フラグON
- 「1回のバッチで1小分野を30問に到達させる」ことをゴールに、**不足レベル帯を埋める配分**を強制する（既存分布と合わせて全帯カバー）。

### 4-3. スキルとレベル定義の整合
- レベル定義の正本は `skills/science-question-level-calibrator/`。100〜900の50刻み、600以上は専門一致。**小分野の専門性が上がったことを反映**（例: 大分野「化学」内でも小分野「量子化学」のL700は他小分野より深いなど、subdomain粒度での深さ基準を1段追記）。

---

## 実装順・PR分割（推奨）

1. **PR1（WS1）**: ギャップ可視化＋ブループリント生成。既存に一切触れず追加のみ。すぐ作問に使える。
2. **PR2（WS2）**: パイプライン統合・scripts再編・package.json整理。**削除は証跡レポート必須**。`questions:pipeline` が旧バンクを再生成しても出力が変わらないことをテスト。
3. **PR3（WS4）**: スキル一元化＋ `science-subdomain-fill` 新設。
4. **PR4（WS3）**: ダッシュボード＋CIチェック＋定期監査。
5. 以降、`science-subdomain-fill` を使って**20問未満の84小分野から順に30問へ**（作問自体は継続タスク、本PR群のスコープ外）。

## 受け入れ基準

- `pnpm questions:gaps` で100小分野の不足数・レベル分布が `docs/subdomain-gaps.md` と JSON に出る。
- `pnpm questions:plan --domain 数学 --subdomain 情報数理` でブループリントが出る。
- scripts が `pipeline/` `batches/` `archive/` に再編され、`q()` 重複が解消、汎用 validate/merge に統合されている。削除内容が `docs/pipeline-cleanup-report.md` に記録されている。
- package.json の `questions:*` がバージョン名を含まない役割ベース命名になり、`scripts/README.md` がある。
- `app/admin/` にバンク健全性ダッシュボードがあり、小分野別の充足度・公開状況が見える。
- `pnpm preflight`（またはCI）が スキーマ・選択肢監査・小分野整合・回帰ガード をチェックする。
- スキルが一元化され `science-subdomain-fill` が追加され、入口スキルの一覧が最新化されている。
- **既存の総合/分野/小分野受験の挙動・スコア・本番バンク出力が変わらない**（`pnpm lint && pnpm test && pnpm build` グリーン、`questions:import:knowledge` の出力差分なし）。

## スコープ外

- 実際の1,660問の作問そのもの（本PR群は仕組み作り。作問は `science-subdomain-fill` で継続実施）。
- 受験・スコアリングロジックの変更。
- 外部LLM APIによる自動生成（現状はCodex/Claudeがスキルに従い執筆する方式を維持）。
