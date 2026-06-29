"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

export function SaveResultButton({ score, scoreLow, scoreHigh, answerCount }: { score: number; scoreLow: number; scoreHigh: number; answerCount: number }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "login">("idle");

  const save = async () => {
    setStatus("saving");
    const sessionId = window.localStorage.getItem("sci-test-session-id") || "local-preview";
    const response = await fetch("/api/exam/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, score, scoreLow, scoreHigh, answerCount })
    }).catch(() => null);
    if (response?.ok) {
      setStatus("saved");
      return;
    }
    setStatus("login");
  };

  if (status === "saved") return <AppButton variant="secondary">保存しました</AppButton>;
  if (status === "login") return <AppButton href="/signup" variant="secondary">登録して結果を保存</AppButton>;
  return (
    <AppButton onClick={save} disabled={status === "saving"} variant="secondary">
      <Download />
      {status === "saving" ? "保存中" : "結果を保存"}
    </AppButton>
  );
}
