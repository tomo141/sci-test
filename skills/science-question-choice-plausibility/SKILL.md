---
name: science-question-choice-plausibility
description: >-
  4択不正解肢の plausibility 監査（絶対語・用語サラダ等）。
  **問題作成の依頼が来たら先に `.cursor/skills/science-question-creation/SKILL.md`
  を使うこと。** 本スキルは統合パイプライン Step 4 の下位参照。
disable-model-invocation: true
---

# Science Question Choice Plausibility

> **入口**: `.cursor/skills/science-question-creation/SKILL.md` — 本スキルは Step 4。

本スキルは**選択肢（特に不正解）の妥当性改善のみ**。

## 目的

知識を持たない受験者が、選択肢の形式だけで正解を当てられないようにする。

## 検出すべきパターン

### 1. 絶対語・限定語（不正解に多い）

不正解選択肢に以下が集中していると、消去法で正解できる:

- `のみ` / `だけ`
- `すべて` / `全て`
- `必ず` / `常に` / `いつも`
- `決して` / `絶対`

**特に危険**: 不正解3つに絶対語があり、正解だけが普通の表現。

### 2. 問題文と無関係な用語の並列（用語サラダ）

4択のうち2択以上が、問題の `domain` / `subdomain` と明らかに無関係な分野の用語である。

例（教育学の問題）: `メタ認知` / `インフレーション` / `光合成` / `沈殿`

### 3. その他のヒント

- 不正解だけ極端に短い、または明らかに荒唐無稽
- 正解だけ専門用語で、他が日常語の羅列

## 修正方針

1. **正解選択肢は変えない**（`correct_choice_index` を維持）
2. 不正解は**同分野の plausible な誤概念**に差し替える
3. 4択の**文体・長さ・粒度**を揃える
4. 絶対語は原則除去。正解が事実として絶対語を含む場合のみ許容（例: B+ツリーの定義文）
5. `distractor_rationales` も新しい選択肢に合わせて更新

## 作業手順

1. 監査実行:

```bash
pnpm questions:build-knowledge
node scripts/audit-choice-plausibility.mjs
```

レポート: `supabase/seed/generated/choice-plausibility-audit.json`

2. `severity: high` があれば**必ず修正**してから次へ
3. `cross_domain_salad` / `absolute_language_in_distractor` を1問ずつ読み、不正解を差し替え
4. 修正後に再監査:

```bash
pnpm questions:build-knowledge
node scripts/audit-choice-plausibility.mjs --strict
```

`--strict` で high severity が0件になるまで繰り返す。

5. 大量修正時は `scripts/choice-plausibility-fixes.json` に追記し:

```bash
node scripts/apply-choice-plausibility-fixes.mjs
```

## 問題作成後の必須フロー

`science-question-author` で問題を作成したら、公開前に必ず:

1. 本スキルで選択肢を監査・改善
2. `science-question-qc` で全体QC
3. `science-bank-publisher` で投入

## 良い不正解の例

**問題**: マクスウェル方程式が予言した電磁波の速度が依存する量は？

| 選択肢 | 評価 |
|--------|------|
| 真空の誘電率と透磁率 | 正解 |
| 電荷密度 | 同分野の関連量だが誤り |
| 電流密度 | 同上 |
| 導体の抵抗率 | 同上 |

**問題**: 学習者が自分の学びを振り返る能力は？

| 選択肢 | 評価 |
|--------|------|
| メタ認知 | 正解 |
| 作業記憶 | 認知心理学の関連概念 |
| 条件づけ | 学習理論の関連概念 |
| 足場かけ | 教育心理学の関連概念 |

## 悪い不正解の例（修正前）

- `電荷量のみ` / `電流の大きさのみ` / `導体の抵抗のみ` → 絶対語で消去可能
- `インフレーション` / `光合成` / `沈殿` → 教育学と無関係
