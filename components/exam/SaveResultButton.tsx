"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";

export function SaveResultButton({ score, scoreLow, scoreHigh, answerCount }: { score: number; scoreLow: number; scoreHigh: number; answerCount: number }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "login" | "error">("idle");
  const [message, setMessage] = useState("");

  const save = async () => {
    setStatus("saving");
    setMessage("");
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
    const payload = await response?.json().catch(() => null);
    if (response?.status === 401) {
      setStatus("login");
      setMessage("ランキングに反映するにはログインが必要です。");
      return;
    }
    setStatus("error");
    setMessage(payload?.error ? `保存できませんでした：${payload.error}` : "保存できませんでした。少し時間をおいてもう一度お試しください。");
  };

  if (status === "saved") return <AppButton variant="secondary">保存しました</AppButton>;
  if (status === "login") {
    return (
      <div className="grid gap-2">
        <AppButton href="/login" variant="secondary">ログインして結果を保存</AppButton>
        <p className="text-sm font-bold text-[var(--color-muted)]">{message}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <AppButton onClick={save} disabled={status === "saving"} variant="secondary">
        <Download />
        {status === "saving" ? "保存中" : "結果を保存"}
      </AppButton>
      {status === "error" ? <p className="text-sm font-bold text-[var(--color-danger-700)]">{message}</p> : null}
    </div>
  );
}
