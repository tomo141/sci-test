# science-bank-publisher

JSON / CSVの問題インポート、スキーマ検証、QC実行、公開・下書き判定、Supabase投入、エラー一覧出力を行う。

`supabase/seed/question_schema.json` に準拠する。AI生成問題は本番受験中にリアルタイム生成せず、公開済み問題のみ出題する。
