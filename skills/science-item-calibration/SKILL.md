---
name: science-item-calibration
description: >-
  回答統計に基づく事後較正（正答率・識別力・Bad重み等）。
  作問パイプライン（`.cursor/skills/science-question-creation`）とは別。
  運用開始後のデータ分析・難度 drift 監査時に使う。
disable-model-invocation: true
---

# science-item-calibration

> **作問時は使わない。** 入口は `.cursor/skills/science-question-creation`（公開後の運用フェーズ）。

回答データから正答率、平均回答時間、識別力の暫定値、難度補正候補、品質低下候補、出題頻度低下候補、アーカイブ候補を提案する。

Bad重み、高得点者Bad重み、極端な正答率、極端な回答時間を重視する。最終的な公開停止・再公開の判断は管理者が行う。
