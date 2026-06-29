"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { estimateFromAnswers } from "@/src/lib/scoring";
import { rankTitle } from "@/src/lib/scoring/rank";
import type { ClientExamAnswer } from "@/src/lib/exam/session";

export function LocalScoreSummary() {
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
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4">
        <p className="font-black text-[var(--color-primary-900)]">まだ受験結果がありません</p>
        <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">腕試しを始めると、ここにあなたの推定スコアが表示されます。</p>
      </div>
    );
  }

  const estimate = estimateFromAnswers(answers);
  const correctCount = answers.filter((answer) => answer.correct).length;

  return (
    <>
      <ScoreDisplay score={estimate.overall} />
      <div className="mt-4 flex flex-wrap gap-3">
        <StatusBadge tone="yellow">
          <Crown size={14} />
          {rankTitle(estimate.overall)}
        </StatusBadge>
        <StatusBadge>{correctCount} / {answers.length} 問 正解</StatusBadge>
        <StatusBadge>{estimate.accuracyLabel}</StatusBadge>
      </div>
    </>
  );
}
