"use client";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { scienceApi, type RequestError } from "@/src/lib/science/client";
import type { AnswerExplanation } from "@/src/lib/science/types";
import { FeedbackForm } from "./FeedbackForm";

export function AnswerActions({ attemptId, explanation, signedIn }: { attemptId: string; explanation: AnswerExplanation; signedIn: boolean }) {
  const [good, setGood] = useState(false), [bookmarked, setBookmarked] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function save(kind: "good" | "bookmark") {
    setBusy(true); setError("");
    try {
      if (kind === "good") { await scienceApi("feedback", { attemptId, ordinal: explanation.ordinal, category: "good", body: "", evidence: "" }); setGood(true); }
      else { await scienceApi("bookmark", { attemptId, revisionId: explanation.revisionId, enabled: true }); setBookmarked(true); }
    } catch (issue) { setError((issue as RequestError).message); } finally { setBusy(false); }
  }
  return <div className="mt-6 border-t pt-4"><div className="flex flex-wrap gap-2">
    <AppButton variant="ghost" disabled={busy || good} onClick={() => void save("good")}>{good ? "👍 良問を送信済み" : "👍 良問"}</AppButton>
    {signedIn ? <AppButton variant="ghost" disabled={busy || bookmarked} onClick={() => void save("bookmark")}>{bookmarked ? "🔖 復習用に保存済み" : "🔖 あとで復習"}</AppButton> : <AppButton variant="ghost" href={`/signup?next=${encodeURIComponent(`/exam?attempt=${attemptId}&feedback=${explanation.ordinal}`)}`}>🔖 無料登録して復習を保存</AppButton>}
  </div><FeedbackForm attemptId={attemptId} ordinal={explanation.ordinal} label="👎 悪問・改善を報告" />
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
