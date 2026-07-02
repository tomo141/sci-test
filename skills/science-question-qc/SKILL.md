---
name: science-question-qc
description: >-
  4択問題の公開前QC。**問題作成の依頼が来たら先に
  `.cursor/skills/science-question-creation/SKILL.md` を使うこと。**
  本スキルは統合パイプライン Step 5 の下位参照。
disable-model-invocation: true
---

# science-question-qc

> **入口**: `.cursor/skills/science-question-creation/SKILL.md` — 本スキルは Step 5（choice-plausibility の後）。

4択問題の品質確認を行う。正解が1つだけか、選択肢数が4つか、問題文が曖昧でないか、前提不足がないか、選択肢に正解のヒントがないか、解説が正誤理由を説明しているか、難度と内容が整合しているか、不適切・攻撃的・危険な表現がないか、出典があるか、時事問題に有効期限があるか、既存問題と重複しすぎていないかを確認する。

**選択肢の消去可能性**（`のみ`/`すべて`/`必ず` の不正解集中、無関係用語の並列）は `science-question-choice-plausibility` で先に修正する。

重大な懸念がある問題は `draft` のままにし、管理画面の要確認候補へ回す。
