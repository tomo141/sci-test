export const BAD_QUESTION_REASONS = [
  { id: "unclear_question", label: "問題文がわかりにくい" },
  { id: "bad_choices", label: "選択肢が不適切" },
  { id: "wrong_answer", label: "正解が間違っている" },
  { id: "bad_explanation", label: "解説が不十分・誤り" },
  { id: "wrong_difficulty", label: "難易度が合っていない" },
  { id: "outdated", label: "内容が古い・誤っている" },
  { id: "other", label: "その他" }
] as const;

export type QuestionFeedbackKind = "good" | "bad";

export type QuestionFeedbackState = {
  kind: QuestionFeedbackKind;
  reasons?: string[];
  comment?: string;
  submittedAt: string;
};
