# science-question-author

指定された分野、能力軸、難度、出題形式、対象者に応じて、4択問題をJSON形式で作る。

必須出力項目は `title`, `question_text`, `choices`, `correct_choice_index`, `short_explanation`, `detailed_explanation`, `domain`, `ability_axis`, `difficulty_initial`, `source_url`, `source_note`, `currentness_type`, `expires_at`, `tags`。

出題中にリアルタイム生成しない。生成した問題は必ず問題バンクへ保存し、QCと出典確認を通してから公開する。
