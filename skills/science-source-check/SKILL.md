---
name: science-source-check
description: >-
  問題の出典URL・source_note・時事有効期限の確認。
  **問題作成の依頼が来たら先に `.cursor/skills/science-question-creation/SKILL.md`
  を使うこと。** 本スキルは統合パイプライン Step 6 の下位参照。
disable-model-invocation: true
---

# science-source-check

> **入口**: `.cursor/skills/science-question-creation/SKILL.md` — 本スキルは Step 6。

出典URL形式、出典メモ、時事問題の有効期限を確認する。一次情報・公式情報を優先し、古い時事問題や根拠が薄い問題を検出する。

出典が欠けている場合は公開停止候補とし、`source_note` に確認理由を残す。
