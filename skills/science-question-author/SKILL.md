---
name: science-question-author
description: >-
  本リポジトリの4択問題JSON執筆慣行（必須フィールド・domain 等）。
  **問題作成の依頼が来たら先に `.cursor/skills/science-question-creation/SKILL.md`
  を使うこと。** 本スキルは統合パイプライン Step 3 の下位参照。
disable-model-invocation: true
---

# Science Question Author

> **入口**: `.cursor/skills/science-question-creation/SKILL.md` — 本ファイルは Step 3 執筆時に読む。

指定された分野、能力軸、難度、出題形式、対象者に応じて、4択問題をJSON形式で作る。

必須出力項目は `title`, `question_text`, `choices`, `correct_choice_index`, `short_explanation`, `detailed_explanation`, `domain`, `ability_axis`, `difficulty_initial`, `source_url`, `source_note`, `currentness_type`, `expires_at`, `tags`。

出題中にリアルタイム生成しない。生成した問題は必ず問題バンクへ保存し、QCと出典確認を通してから公開する。

## レベル別定義（正答率50%の基準）

`difficulty_initial` は、下表のいずれかのレベルに合う内容で作成する。**内容からレベルを決め、分野内の順番や機械的ラダーで付けない。**

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

- **500以下**: 専門一致は不要。
- **600以上**: その問題の `domain` と専門が一致する受験者基準。
- **保存値**: 100, 200, …, 900 の50刻みのみ。中間帯（250, 350など）は設計の参考とし、最終的な `difficulty_initial` は最も近い50刻みにする。

作成後、迷う場合は `science-question-level-calibrator` スキルで再較正してよい。

作成後は必ず `science-question-choice-plausibility` スキルで選択肢を監査・改善してから QC・公開する。
