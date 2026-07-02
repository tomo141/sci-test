"use client";

import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import { BAD_QUESTION_REASONS, type QuestionFeedbackKind } from "@/src/lib/exam/feedback";
import { addToReviewList, isInReviewList, removeFromReviewList } from "@/src/lib/exam/reviewList";
import { cn } from "@/src/lib/utils";

type Props = {
  questionId: string;
  answered: boolean;
  activeFeedback: QuestionFeedbackKind | null;
  onFeedbackChange: (kind: QuestionFeedbackKind | null) => void;
};

async function submitExamFeedback(payload: {
  questionId: string;
  feedback: "good" | "bad";
  reasons?: string[];
  comment?: string;
  anonymousSessionId?: string | null;
}) {
  await fetch("/api/exam/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => null);
}

async function cancelExamFeedback(payload: {
  questionId: string;
  feedback: "good" | "bad";
  anonymousSessionId?: string | null;
}) {
  await fetch("/api/exam/feedback", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => null);
}

export function QuestionFeedbackActions({ questionId, answered, activeFeedback, onFeedbackChange }: Props) {
  const [badModalOpen, setBadModalOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [reviewed, setReviewed] = useState(() => isInReviewList(questionId));

  useEffect(() => {
    setReviewed(isInReviewList(questionId));
    setBadModalOpen(false);
    setSelectedReasons([]);
    setFeedbackComment("");
  }, [questionId]);

  if (!answered) return null;

  const toggleReason = (reasonId: string) => {
    setSelectedReasons((current) =>
      current.includes(reasonId) ? current.filter((id) => id !== reasonId) : [...current, reasonId]
    );
  };

  const anonymousSessionId = () => window.localStorage.getItem("sci-test-anonymous-session-id");

  const submitBadFeedback = async (reasons: string[]) => {
    const comment = feedbackComment.trim() || undefined;
    if (activeFeedback === "good") {
      await cancelExamFeedback({
        questionId,
        feedback: "good",
        anonymousSessionId: anonymousSessionId()
      });
    }
    onFeedbackChange("bad");
    setBadModalOpen(false);
    setSelectedReasons([]);
    setFeedbackComment("");
    await submitExamFeedback({
      questionId,
      feedback: "bad",
      reasons,
      comment,
      anonymousSessionId: anonymousSessionId()
    });
  };

  const handleGood = async () => {
    if (activeFeedback === "good") {
      onFeedbackChange(null);
      await cancelExamFeedback({
        questionId,
        feedback: "good",
        anonymousSessionId: anonymousSessionId()
      });
      return;
    }
    if (activeFeedback === "bad") {
      await cancelExamFeedback({
        questionId,
        feedback: "bad",
        anonymousSessionId: anonymousSessionId()
      });
    }
    onFeedbackChange("good");
    await submitExamFeedback({
      questionId,
      feedback: "good",
      anonymousSessionId: anonymousSessionId()
    });
  };

  const handleReview = () => {
    if (reviewed) {
      removeFromReviewList(questionId);
      setReviewed(false);
      return;
    }
    addToReviewList(questionId);
    setReviewed(true);
  };

  const handleBadClick = () => {
    if (activeFeedback === "bad") {
      onFeedbackChange(null);
      void cancelExamFeedback({
        questionId,
        feedback: "bad",
        anonymousSessionId: anonymousSessionId()
      });
      return;
    }
    setSelectedReasons([]);
    setFeedbackComment("");
    setBadModalOpen(true);
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <FeedbackButton active={activeFeedback === "good"} onClick={() => void handleGood()}>
          👍️ 良問
        </FeedbackButton>
        <FeedbackButton active={activeFeedback === "bad"} onClick={handleBadClick}>
          👎️ 悪問
        </FeedbackButton>
        <FeedbackButton active={reviewed} onClick={handleReview}>
          🔖 あとで復習
        </FeedbackButton>
      </div>

      <AppModal open={badModalOpen} title="悪問と感じた理由（任意）" onClose={() => setBadModalOpen(false)}>
        <p className="text-sm font-bold leading-7 text-[var(--color-ink-soft)]">
          当てはまるものを選んでください。選ばなくても送信できます。
        </p>
        <div className="mt-4 grid gap-2">
          {BAD_QUESTION_REASONS.map((reason) => {
            const selected = selectedReasons.includes(reason.id);
            return (
              <button
                key={reason.id}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                  selected
                    ? "border-[var(--color-primary-700)] bg-[var(--color-primary-100)]"
                    : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]"
                )}
                onClick={() => toggleReason(reason.id)}
                type="button"
              >
                {reason.label}
              </button>
            );
          })}
        </div>
        <textarea
          className="mt-4 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-primary-700)]"
          maxLength={1000}
          onChange={(event) => setFeedbackComment(event.target.value)}
          placeholder="フィードバックコメントがありましたら、ご記載いただけると助かります"
          rows={3}
          value={feedbackComment}
        />
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <AppButton variant="secondary" onClick={() => void submitBadFeedback([])}>
            理由を選ばずに送信
          </AppButton>
          <AppButton onClick={() => void submitBadFeedback(selectedReasons)}>送信</AppButton>
        </div>
      </AppModal>
    </>
  );
}

function FeedbackButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "rounded-2xl border px-4 py-2 text-sm font-bold transition",
        active
          ? "border-[var(--color-primary-700)] bg-[var(--color-primary-100)] text-[var(--color-primary-900)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-border-strong)]"
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
