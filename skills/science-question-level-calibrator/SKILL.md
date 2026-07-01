---
name: science-question-level-calibrator
description: >-
  Calibrates question difficulty_initial to 50-step levels (100-900) using the
  education-stage 50% benchmark rubric. Use when assigning or reviewing problem
  levels, recalibrating the question bank, auditing difficulty drift, or when
  the user asks for 問題レベル較正, difficulty calibration, or level review.
  Separate from science-question-author — do not write question content here.
disable-model-invocation: true
---

# Science Question Level Calibrator

問題**作成**は `science-question-author` が担当する。本スキルは**既存問題のレベル付け・再較正のみ**。

## レベル別定義（正答率50%の基準）

| レベル | 50%正答する基準集団 |
|--------|-------------------|
| 100 | 小学生全体 |
| 150 | ※運用上は使わない（スキーマは100〜900の50刻みのみ） |
| 200 | 中学生全体 |
| 250 | 中学生上位〜高校入口（暗黙の中間帯） |
| 300 | 高校生全体 |
| 350 | 高校生上位〜共通テスト入口 |
| 400 | 共通テスト受験者 |
| 450 | 共通テスト上位〜二次試験入口 |
| 500 | 国立大学の大学受験二次試験の受験者 |
| 550 | 二次試験上位〜学部教養入口 |
| 600 | 大学学部卒業者（出題分野と専門が一致） |
| 650 | 学部上位〜院入試入口（専門一致） |
| 700 | 旧帝大の大学院前期課程入試受験者（専門一致） |
| 750 | 院入試上位〜修士入口（専門一致） |
| 800 | 修士号取得者（専門一致） |
| 850 | 修士上位〜博士入口（専門一致） |
| 900 | 博士号取得者（専門一致） |

- **500以下**: 専門一致は不要（一般の受験者・学年集団）。
- **600以上**: 出題分野（`domain`）と受験者の専門が一致するときの50%点。
- **DBに保存する値**: 100, 200, 300, …, 900 の **50刻みのみ**（150は運用上使わない）。

## 作業手順

1. **問題文・選択肢・分野・サブドメイン**を読む（正解の有無は難易度判断の補助にのみ使う）。
2. 上表の「そのレベルの集団が半分解けるか」を想像し、**1つの50刻み**を選ぶ（中間帯は250, 350などの定義を参考に、最終値は50刻みに丸める）。
3. 迷ったら定義に最も近い段階を選ぶ。
4. 記録する:
   - `difficulty_initial`: 設計上の錨（再較正時も原則ここを更新）
   - `difficulty_continuous`: 運用値（初期は `difficulty_initial` と同値）
5. **分野内の相対順序**を確認: 明らかに易しい問題が高レベルになっていないか。

## 出力形式（1問あたり）

```json
{
  "id": "uuid",
  "domain": "化学",
  "difficulty_initial": 400,
  "difficulty_continuous": 400,
  "calibration_note": "共通テスト化学：物質量molの単位"
}
```

バッチ較正時は `src/lib/data/questionLevels.json` に id → level を追記。

## バルク較正・分布確認

```bash
node scripts/calibrate-question-levels.mjs
pnpm questions:build-knowledge
node scripts/report-question-level-distribution.mjs
```

## やってはいけないこと

- 問題文・選択肢・解説の改変（別スキル・別担当）
- 回答統計だけで `difficulty_initial` を無断大変更（統計は `difficulty_internal` 用。設計錨の変更はレビュー付き）
- 機械的な「分野内10段階ラダー」だけで付与（内容と無関係な順番付け）

## 追加リソース

- ルーブリック補足・例: [rubric.md](rubric.md)
