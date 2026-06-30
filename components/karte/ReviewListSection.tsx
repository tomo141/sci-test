"use client";

import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { loadReviewList, removeFromReviewList, type ReviewListItem } from "@/src/lib/exam/reviewList";
import { useQuestionBank } from "@/components/exam/useQuestionBank";

export function ReviewListSection() {
  const { getById } = useQuestionBank();
  const [items, setItems] = useState<ReviewListItem[]>([]);

  useEffect(() => {
    setItems(loadReviewList());
  }, []);

  const handleRemove = (questionId: string) => {
    setItems(removeFromReviewList(questionId));
  };

  return (
    <AppCard>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-black">復習リスト</h2>
        <StatusBadge tone="blue">🔖 {items.length} 問</StatusBadge>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-primary-50)] p-4 text-sm font-bold leading-7 text-[var(--color-ink-soft)]">
          腕試し受験中に「🔖 あとで復習」を押した問題がここに表示されます。
        </p>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const question = getById(item.questionId);
            if (!question) return null;
            return (
              <div
                key={item.questionId}
                className="rounded-2xl border border-[var(--color-border)] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusBadge tone="blue">{question.domain}</StatusBadge>
                  <span className="text-xs font-bold text-[var(--color-muted)]">
                    {new Date(item.addedAt).toLocaleDateString("ja-JP")} に追加
                  </span>
                </div>
                <p className="font-bold leading-7">{question.question}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">{question.shortExplanation}</p>
                <AppButton
                  className="mt-4 !min-h-10 !px-4 !py-2 !text-xs [&_svg]:hidden"
                  variant="secondary"
                  onClick={() => handleRemove(item.questionId)}
                >
                  🔖 リストから外す
                </AppButton>
              </div>
            );
          })}
        </div>
      )}
    </AppCard>
  );
}
