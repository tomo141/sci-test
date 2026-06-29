"use client";

import { useEffect, useState } from "react";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ClientExamAnswer } from "@/src/lib/exam/session";
import { estimateFromAnswers } from "@/src/lib/scoring";

export function MyPageLocalSummary() {
  const [answers, setAnswers] = useState<ClientExamAnswer[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("sci-test-exam-answers");
    if (!stored) return;
    try {
      setAnswers(JSON.parse(stored) as ClientExamAnswer[]);
    } catch {
      window.localStorage.removeItem("sci-test-exam-answers");
    }
  }, []);

  if (!answers.length) {
    return (
      <div className="mt-5 rounded-2xl bg-[var(--color-primary-50)] p-4 text-sm font-bold leading-7 text-[var(--color-ink-soft)]">
        腕試しを受けると、この端末の回答履歴からスコア目安を表示します。
      </div>
    );
  }

  const estimate = estimateFromAnswers(answers);
  const correctCount = answers.filter((answer) => answer.correct).length;

  return (
    <div className="mt-5">
      <ScoreDisplay score={estimate.overall} />
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge>{correctCount} / {answers.length} 問 正解</StatusBadge>
        <StatusBadge>{estimate.accuracyLabel}</StatusBadge>
      </div>
    </div>
  );
}
