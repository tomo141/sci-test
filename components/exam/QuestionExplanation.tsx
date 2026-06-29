"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { AnswerFeedback } from "@/src/lib/exam/explanation";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-black text-[var(--color-primary-800)]">{title}</p>
      <div className="mt-2 leading-7 text-[var(--color-ink-soft)]">{children}</div>
    </div>
  );
}

export function QuestionExplanation({ feedback }: { feedback: AnswerFeedback }) {
  const ResultIcon = feedback.isCorrect ? CheckCircle2 : XCircle;
  const sections = [
    { title: "解説", body: feedback.conclusion },
    feedback.detailedExplanation
      ? { title: "詳しい解説", body: feedback.detailedExplanation }
      : feedback.basicTerms
        ? { title: "基本用語", body: feedback.basicTerms }
        : null,
    !feedback.isCorrect && feedback.nearMiss ? { title: "惜しいポイント", body: feedback.nearMiss } : null,
    !feedback.isCorrect && feedback.selectedChoice
      ? { title: `あなたが選んだ${feedback.selectedChoice.label}について`, body: feedback.selectedChoice.explanation }
      : null,
    feedback.basicTerms && feedback.detailedExplanation ? { title: "基本用語", body: feedback.basicTerms } : null
  ].filter(Boolean) as { title: string; body: React.ReactNode }[];
  const leftSections = sections.filter((_, index) => index % 2 === 0);
  const rightSections = sections.filter((_, index) => index % 2 === 1);

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

      <div className="grid gap-5 md:hidden">
        {sections.map((section) => (
          <Section key={section.title} title={section.title}>{section.body}</Section>
        ))}
      </div>
      <div className="hidden gap-8 md:grid md:grid-cols-2">
        <div className="grid content-start gap-5">
          {leftSections.map((section) => (
            <Section key={section.title} title={section.title}>{section.body}</Section>
          ))}
        </div>
        <div className="grid content-start gap-5">
          {rightSections.map((section) => (
            <Section key={section.title} title={section.title}>{section.body}</Section>
          ))}
        </div>
      </div>
    </div>
  );
}
