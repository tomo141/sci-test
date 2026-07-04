---
name: science-question-creation
description: >-
  全分野科学検定向け4択問題の設計・執筆・レベル付け・QC・公開までを一括で行う統合スキル。
  ユーザーが「問題を作って」「作問」「問題作成」「問題バンク」「4択」「検定の問題」
  「模試」「クイズ」「問題追加」「ギャップ補充」「選択肢改善」「問題レビュー」などに
  言及したら、たとえ1問だけでも必ず本スキルを使うこと。他の作問スキル
  (mcq-item-writing, science-question-author 等) は本スキルの下位参照として読む。
---

# 全分野科学検定 — 問題作成パイプライン（統合スキル）

**本リポジトリで問題を作る・直す・レビューする場合は、常にこのスキルが入口。**
下位スキルや参照ファイルは、本スキルの各ステップで必要に応じて読む。

## 中核方針

1. **良問は設計する** — 仕様 → ブループリント → 執筆 → 検証の順。思いつき作問禁止。
2. **レベルは学歴×専門一致基準** — `skills/science-question-level-calibrator/SKILL.md` が正本。
   **TOEIC型10〜990点の「帯」や `.cursor/skills/mcq-item-writing/references/difficulty-and-scale.md` の帯定義は、本検定の difficulty_initial には使わない。**
3. **内容からレベルを決める** — 分野内の機械的ラダー・順番付け禁止。
4. **600以上は専門一致** — その問題の `domain` と受験者の専門が一致する集団の50%正答点。
5. **公開前は必ずパイプライン完走** — 選択肢監査 → QC → 出典確認 → スキーマ検証。

---

## パイプライン（必ずこの順）

```
[0] 仕様確認
 ↓
[1] ブループリント（領域×レベル×認知タイプ）
 ↓
[2] レベル設計（各問の difficulty_initial を内容から決定）
 ↓
[3] 問題執筆（JSON）
 ↓
[4] 選択肢 plausibility 監査
 ↓
[5] 全体 QC
 ↓
[6] 出典・時事確認
 ↓
[7] スキーマ検証 → バンク投入（draft / published）
```

運用開始後の統計較正は `skills/science-item-calibration/SKILL.md`（作問パイプラインとは別）。

---

### Step 0: 仕様確認

作問前に確定する（不明ならユーザーに確認、少数ならデフォルトを宣言して進める）:

| 項目 | 本検定のデフォルト |
|------|-------------------|
| 構成概念 | 10分野の科学リテラシー・専門知識（`src/lib/data/taxonomy.ts` の domains） |
| 形式 | 4択1正答 |
| レベルスケール | 100〜900（50刻み）。150/850は運用上使わない |
| 認知タイプ | 用語・定義 / 原理・因果 / 基本的な適用 / 比較・分類 / 誤解・境界 |
| 能力軸 | 基礎力（スキーマ固定） |
| 保存先 | バッチJSON → 問題バンク（リアルタイム生成しない） |

---

### Step 1: ブループリント

複数問を作る場合、**執筆前に設計表を提示**する。

| 分野 | subdomain | 認知タイプ | difficulty_initial | 問数 |
|------|-----------|-----------|-------------------|------|

- 分野・レベルの偏りを意図的に設計する（「全レベル均等」だけが正解ではないが、分布は明示する）。
- 既存バンクの分布確認: `node scripts/report-question-level-distribution.mjs`

---

### Step 2: レベル設計

**正本**: [references/level-definitions.md](references/level-definitions.md)（`science-question-level-calibrator` 由来）

要点:

| レベル | 50%正答する基準集団 |
|--------|-------------------|
| 100 | 小学生全体 |
| 200 | 中学生全体 |
| 300 | 高校生全体 |
| 400 | 共通テスト受験者 |
| 500 | 国立大学二次試験受験者 |
| 600 | 大学学部卒業者（**domain と専門一致**） |
| 700 | 旧帝大院入試受験者（専門一致） |
| **800** | **修士号取得者（専門一致）** |
| **900** | **博士号取得者（専門一致）** |

中間帯（250, 350, 450…）は設計・議論用。DB保存は最も近い50刻み。

#### 800/900 を付ける前の自己問答（必須）

- [ ] 高校・学部教養だけで解ける内容**ではない**か？
- [ ] 用語の再認・教科書1章レベル**ではない**か？
- [ ] 同分野の既存 L800/L900 問題と**深さが同等**か？（`scripts/v5-generated/` 等を参照）
- [ ] 800: 修士課程・院試で扱う専門内容か？
- [ ] 900: 博士研究または上級院生が半分間違える境界・例外・前沿か？

**不一致ならレベルを下げる。** ラベルだけ上げない。

各問に `calibration_note`（一行で「なぜこのレベルか」）を残す。

---

### Step 3: 問題執筆

**執筆規則**（執筆前に読む）:

- `.cursor/skills/mcq-item-writing/references/item-writing-rules.md` — 幹・選択肢・誤答肢
- `.cursor/skills/mcq-item-writing/references/review-checklist.md` — 出力前セルフレビュー
- `skills/science-question-author/SKILL.md` — 必須フィールド・リポジトリ慣行

**絶対規則（抜粋）**:

- 1問1論点、幹完結、否定形幹は原則禁止
- 正答1つのみ、誤答肢は誤概念として設計し `distractor_rationales` に根拠を書く
- 「上記すべて」「該当なし」禁止
- 正答位置はセット内で A/B/C/D ほぼ均等
- 実在著作物の転載禁止

**必須JSONフィールド**（`supabase/seed/question_schema.json`）:

`domain`, `subdomain`, `question_text`, `choices`(4), `correct_choice_index`,
`short_explanation`, `detailed_explanation`, `cognitive_type`, `ability_axis`(=基礎力),
`difficulty_initial`, `difficulty_continuous`(初期は initial と同値),
`distractor_rationales`(4), `learning_objective`, `common_misconception`, `basic_terms`,
`source_note`, `source_url`, `currentness_type`, `expires_at`, `tags`, `status`

10分野: 数学, 物理, 化学, 生物, 地学, 工学, 農学, 情報・計算機科学, 医歯薬学, 人文社会科学

---

### Step 4: 選択肢 plausibility 監査

**参照**: `skills/science-question-choice-plausibility/SKILL.md`

- 絶対語（のみ/すべて/必ず/常に）が不正解に集中していないか
- 用語サラダ（無関係分野の用語並列）がないか
- 4肢の文体・長さ・粒度が揃っているか

```bash
pnpm questions:build-knowledge
node scripts/audit-choice-plausibility.mjs
# 修正後
node scripts/audit-choice-plausibility.mjs --strict
```

---

### Step 5: 全体 QC

**参照**: `skills/science-question-qc/SKILL.md`

- 正答一意、前提不足なし、難度と内容の整合、不適切表現なし
- 既存問題との重複
- **特に**: difficulty_initial が内容と明らかに乖離していないか（800/900 の過大付与）

重大懸念 → `status: draft`、管理画面の要確認候補へ。

---

### Step 6: 出典・時事確認

**参照**: `skills/science-source-check/SKILL.md`

- `source_note` 必須。`source_url` は可能なら一次情報
- 時事問題は `currentness_type` と `expires_at` を設定

---

### Step 7: スキーマ検証・バンク投入

**参照**: `skills/science-bank-publisher/SKILL.md`

```bash
# バッチ検証例（v5 形式）
node scripts/validate-v5-batch.mjs   # バッチディレクトリに合わせて調整

pnpm questions:build-knowledge
node scripts/report-question-level-distribution.mjs
```

AI生成問題は本番受験中にリアルタイム生成しない。公開済み問題のみ出題。

---

## 1問あたりの出力テンプレート

```markdown
## 問題 [仮ID]
**分野**: … / **subdomain**: … / **認知タイプ**: …
**difficulty_initial**: … / **calibration_note**: …

**問題文**:
…

A. …  B. …  C. …  D. …

**正答**: B
**解説**: …
**誤答肢の設計根拠**:
- A: …
- C: …
- D: …
```

バッチ出力時は分野別 JSON 配列。

---

## 下位スキル一覧（役割分担）

| スキル | 役割 | いつ読むか |
|--------|------|-----------|
| **本スキル** | 入口・パイプライン統括 | 問題作成/レビューの最初 |
| `mcq-item-writing` | 汎用MCQ作問規則（IRT・Haladyna） | Step 3。レベル定義は**読まない** |
| `science-question-author` | リポジトリ固有の執筆慣行 | Step 3 |
| `science-question-level-calibrator` | レベル正本・較正 | Step 2, レビュー時 |
| `science-question-choice-plausibility` | 選択肢監査 | Step 4 |
| `science-question-qc` | 全体QC | Step 5 |
| `science-source-check` | 出典確認 | Step 6 |
| `science-bank-publisher` | インポート・公開 | Step 7 |
| `science-item-calibration` | 回答統計による事後較正 | 運用後 |

---

## レビューサマリ（出力末尾に必須）

```
パイプライン: Step 0〜7 実施
独立解答テスト: N/N
レベル整合チェック: N/N（800/900 は既存同レベル問題と深さ比較済）
plausibility: high severity 0
QC懸念: …
```

---

## 追加リソース

- レベル定義詳細・800/900例: [references/level-definitions.md](references/level-definitions.md)
- 作問ルール全集: `.cursor/skills/mcq-item-writing/references/item-writing-rules.md`
- セルフレビュー: `.cursor/skills/mcq-item-writing/references/review-checklist.md`
- 較正ルーブリック補足: `skills/science-question-level-calibrator/rubric.md`
