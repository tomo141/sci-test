"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { QuestionExplanation } from "@/components/exam/QuestionExplanation";
import { QuestionFeedbackActions } from "@/components/exam/QuestionFeedbackActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/src/lib/utils";
import type { AnswerFeedback } from "@/src/lib/exam/explanation";
import type { QuestionFeedbackKind } from "@/src/lib/exam/feedback";
import type { Question } from "@/src/lib/data/questions";

export function QuestionCard({
  question,
  index,
  selected,
  answered,
  onChoiceClick,
  activeFeedback,
  onFeedbackChange,
  feedback = null
}: {
  question: Question;
  index: number;
  selected: number | null;
  answered: boolean;
  onChoiceClick: (index: number) => void;
  activeFeedback: QuestionFeedbackKind | null;
  onFeedbackChange: (kind: QuestionFeedbackKind | null) => void;
  feedback?: AnswerFeedback | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusBadge>第 {index + 1} 問</StatusBadge>
        <StatusBadge tone="blue">{question.domain}</StatusBadge>
      </div>
      <h1 className="mb-6 text-2xl font-black leading-10 md:text-3xl">{question.question}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {question.choices.map((choice, choiceIndex) => {
          const label = String.fromCharCode(65 + choiceIndex);
          const isSelected = selected === choiceIndex;
          const isCorrect = answered && question.correctIndex === choiceIndex;
          const isWrongSelection = answered && isSelected && !isCorrect;
          return (
            <button
              key={`${choiceIndex}-${choice}`}
              className={cn(
                "relative flex min-h-24 items-center gap-4 rounded-2xl border px-5 py-4 text-left text-base font-bold transition",
                isSelected && !answered ? "border-[var(--color-primary-700)] bg-[var(--color-primary-100)]" : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]",
                isCorrect && "border-[var(--color-success-700)] bg-[var(--color-success-100)] text-[var(--color-success-700)]",
                isWrongSelection && "border-[var(--color-danger-700)] bg-[var(--color-danger-100)] text-[var(--color-danger-700)]"
              )}
              onClick={() => !answered && onChoiceClick(choiceIndex)}
              type="button"
            >
              {isCorrect ? <CheckCircle2 className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-white text-[var(--color-success-700)]" size={24} /> : null}
              {isWrongSelection ? <XCircle className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-white text-[var(--color-danger-700)]" size={24} /> : null}
              <span className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-white text-lg font-black",
                isCorrect && "border-green-200 text-[var(--color-success-700)]",
                isWrongSelection && "border-red-200 text-[var(--color-danger-700)]"
              )}>{label}</span>
              <span className="flex-1">{choice}</span>
              {isCorrect ? <span className="rounded-xl bg-white/70 px-3 py-1 text-xs font-black text-[var(--color-success-700)]">{isSelected ? "正解" : "正答"}</span> : null}
              {isWrongSelection ? <span className="rounded-xl bg-white/70 px-3 py-1 text-xs font-black text-[var(--color-danger-700)]">あなたの回答</span> : null}
            </button>
          );
        })}
      </div>
      {answered && feedback ? (
        <div className="mt-6">
          <QuestionExplanation feedback={feedback} />
          <QuestionFeedbackActions
            questionId={question.id}
            answered={answered}
            activeFeedback={activeFeedback}
            onFeedbackChange={onFeedbackChange}
          />
        </div>
      ) : null}
    </div>
  );
}
