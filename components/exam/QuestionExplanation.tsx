"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { AnswerFeedback } from "@/src/lib/exam/explanation";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <p className="font-black text-[var(--color-primary-800)]">{title}</p>
      <div className="mt-2 leading-7 text-[var(--color-ink-soft)]">{children}</div>
    </div>
  );
}

export function QuestionExplanation({ feedback }: { feedback: AnswerFeedback }) {
  const ResultIcon = feedback.isCorrect ? CheckCircle2 : XCircle;

  return (
    <div className="grid gap-4">
      <div className={`flex items-center gap-4 rounded-2xl border p-4 ${feedback.isCorrect ? "border-[var(--color-success-700)] bg-[var(--color-success-100)]" : "border-[var(--color-danger-700)] bg-[var(--color-danger-100)]"}`}>
        <ResultIcon className={feedback.isCorrect ? "text-[var(--color-success-700)]" : "text-[var(--color-danger-700)]"} size={34} />
        <div>
          <p className={`text-xl font-black ${feedback.isCorrect ? "text-[var(--color-success-700)]" : "text-[var(--color-danger-700)]"}`}>
            {feedback.isCorrect ? "正解" : "不正解"}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--color-ink-soft)]">
            {feedback.isCorrect ? "いい調子です！" : "もう一度解説を確認しましょう。"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="解説">{feedback.conclusion}</Section>

        {feedback.detailedExplanation ? (
          <Section title="詳しい解説">{feedback.detailedExplanation}</Section>
        ) : feedback.basicTerms ? (
          <Section title="基本用語">{feedback.basicTerms}</Section>
        ) : null}

        {!feedback.isCorrect && feedback.nearMiss ? (
          <Section title="惜しいポイント">{feedback.nearMiss}</Section>
        ) : null}

        {!feedback.isCorrect && feedback.selectedChoice ? (
          <Section title={`あなたが選んだ${feedback.selectedChoice.label}について`}>
            <p>{feedback.selectedChoice.explanation}</p>
          </Section>
        ) : null}

        {feedback.basicTerms && feedback.detailedExplanation ? <Section title="基本用語">{feedback.basicTerms}</Section> : null}
      </div>
    </div>
  );
}
