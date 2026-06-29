"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AnswerFeedback } from "@/src/lib/exam/explanation";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="font-black text-[var(--color-primary-800)]">{title}</p>
      <div className="mt-2 leading-7 text-[var(--color-ink-soft)]">{children}</div>
    </div>
  );
}

export function QuestionExplanation({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <div>
      <StatusBadge tone={feedback.isCorrect ? "green" : "red"}>{feedback.headline}</StatusBadge>

      {!feedback.isCorrect && feedback.nearMiss ? (
        <Section title="惜しいポイント：">{feedback.nearMiss}</Section>
      ) : null}

      <Section title="結論：">{feedback.conclusion}</Section>

      {feedback.basicTerms ? <Section title="基本用語">{feedback.basicTerms}</Section> : null}

      {!feedback.isCorrect && feedback.selectedChoice ? (
        <Section title={`あなたが選んだ${feedback.selectedChoice.label}について：`}>
          <p>{feedback.selectedChoice.explanation}</p>
        </Section>
      ) : null}

      {feedback.detailedExplanation ? (
        <Section title="詳しい解説">{feedback.detailedExplanation}</Section>
      ) : null}
    </div>
  );
}
