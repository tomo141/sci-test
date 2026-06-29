import type { Question } from "@/src/lib/data/questions";

export type AnswerFeedback = {
  isCorrect: boolean;
  headline: "正解！" | "不正解！";
  nearMiss?: string;
  conclusion: string;
  basicTerms?: string;
  selectedChoice?: {
    label: string;
    text: string;
    explanation: string;
  };
  detailedExplanation: string;
};

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

export function choiceLabel(index: number): string {
  return CHOICE_LABELS[index] ?? String(index + 1);
}

export function formatMisconceptionDiagnosis(commonMisconception: string): string {
  const trimmed = commonMisconception.trim().replace(/[。．]+$/g, "");
  if (!trimmed) return "";

  if (/かもしれません$|かもしれない$/.test(trimmed)) {
    return trimmed.endsWith("。") ? trimmed : `${trimmed}。`;
  }

  if (
    trimmed.includes("混同") ||
    trimmed.includes("誤解") ||
    trimmed.includes("誤り") ||
    trimmed.includes("と考える") ||
    trimmed.includes("と思い") ||
    trimmed.includes("取り違え")
  ) {
    const core = trimmed
      .replace(/という誤解.*/, "")
      .replace(/と誤解.*/, "")
      .replace(/しがち.*/, "")
      .replace(/です$/, "")
      .replace(/だ$/, "")
      .trim();
    if (core.includes("と") && (core.includes("混同") || core.includes("誤"))) {
      return `${core}かもしれません。`;
    }
    return `「${core}」という点を取り違えているかもしれません。`;
  }

  return `「${trimmed}」という判断軸を取り違えているかもしれません。`;
}

function formatSelectedChoiceExplanation(rationale: string, choiceText: string): string {
  const trimmed = rationale.trim().replace(/[。．]+$/g, "");
  if (!trimmed) {
    return `「${choiceText}」は一見もっともらしい選択肢ですが、この問題の意図とはずれています。`;
  }

  if (trimmed === "正解" || trimmed === "正しい説明です" || trimmed === "正しい説明") {
    return `「${choiceText}」は一見もっともらしい選択肢ですが、この問題の意図とはずれています。`;
  }

  if (trimmed.startsWith("正解（誤った説明）")) {
    const rest = trimmed.replace(/^正解（誤った説明）[。.、]?\s*/, "").trim();
    return rest ? `${rest}。` : `「${choiceText}」はこの問題では誤りです。`;
  }

  if (/^(正解|正しい)/.test(trimmed)) {
    return trimmed.endsWith("。") ? trimmed : `${trimmed}。`;
  }

  return trimmed.endsWith("。") ? trimmed : `${trimmed}。`;
}

export function buildAnswerFeedback(
  question: Pick<
    Question,
    | "correctIndex"
    | "choices"
    | "shortExplanation"
    | "detailedExplanation"
    | "commonMisconception"
    | "distractorRationales"
    | "basicTerms"
  >,
  selectedOriginalIndex: number | null,
  isCorrect: boolean
): AnswerFeedback {
  const feedback: AnswerFeedback = {
    isCorrect,
    headline: isCorrect ? "正解！" : "不正解！",
    conclusion: question.shortExplanation,
    detailedExplanation: question.detailedExplanation
  };

  if (question.basicTerms?.trim()) {
    feedback.basicTerms = question.basicTerms.trim();
  }

  if (!isCorrect) {
    const diagnosis = formatMisconceptionDiagnosis(question.commonMisconception);
    if (diagnosis) {
      feedback.nearMiss = diagnosis;
    }

    if (selectedOriginalIndex !== null && selectedOriginalIndex >= 0) {
      const rationale = question.distractorRationales[selectedOriginalIndex] ?? "";
      feedback.selectedChoice = {
        label: choiceLabel(selectedOriginalIndex),
        text: question.choices[selectedOriginalIndex] ?? "",
        explanation: formatSelectedChoiceExplanation(rationale, question.choices[selectedOriginalIndex] ?? "")
      };
    }
  }

  return feedback;
}
