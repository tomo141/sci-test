"use client";

import { CheckCircle2 } from "lucide-react";
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusBadge>第 {index + 1} 問</StatusBadge>
        <StatusBadge tone="blue">{question.domain}</StatusBadge>
      </div>
      <h1 className="mb-6 text-xl font-bold leading-9 md:text-2xl">{question.question}</h1>
      <div className="grid gap-3">
        {question.choices.map((choice, choiceIndex) => {
          const isSelected = selected === choiceIndex;
          const isCorrect = answered && question.correctIndex === choiceIndex;
          return (
            <button
              key={`${choiceIndex}-${choice}`}
              className={cn(
                "flex min-h-14 items-center gap-4 rounded-2xl border px-4 py-3 text-left text-base font-bold transition",
                isSelected ? "border-[var(--color-primary-700)] bg-[var(--color-primary-100)]" : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]",
                isCorrect && "border-[var(--color-success-700)] bg-[var(--color-success-100)]"
              )}
              onClick={() => !answered && onChoiceClick(choiceIndex)}
              type="button"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary-700)] text-white">{choiceIndex + 1}</span>
              <span className="flex-1">{choice}</span>
              {isSelected || isCorrect ? <CheckCircle2 size={20} className={isCorrect ? "text-[var(--color-success-700)]" : "text-[var(--color-primary-700)]"} /> : null}
            </button>
          );
        })}
      </div>
      {answered && feedback ? (
        <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4">
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
