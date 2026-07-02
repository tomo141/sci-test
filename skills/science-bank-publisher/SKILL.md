---
name: science-bank-publisher
description: >-
  問題JSONのスキーマ検証・QC・Supabase投入・公開判定。
  **問題作成の依頼が来たら先に `.cursor/skills/science-question-creation/SKILL.md`
  を使うこと。** 本スキルは統合パイプライン Step 7 の下位参照。
disable-model-invocation: true
---

# science-bank-publisher

> **入口**: `.cursor/skills/science-question-creation/SKILL.md` — 本スキルは Step 7。

JSON / CSVの問題インポート、スキーマ検証、QC実行、公開・下書き判定、Supabase投入、エラー一覧出力を行う。

`supabase/seed/question_schema.json` に準拠する。AI生成問題は本番受験中にリアルタイム生成せず、公開済み問題のみ出題する。
