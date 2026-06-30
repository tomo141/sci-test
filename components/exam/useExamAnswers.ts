"use client";

import { useEffect, useState } from "react";
import type { ClientExamAnswer } from "@/src/lib/exam/session";

const STORAGE_KEY = "sci-test-exam-answers";
const SESSION_KEY = "sci-test-session-id";

function loadLocalAnswers(): ClientExamAnswer[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as ClientExamAnswer[];
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function useExamAnswers() {
  const [answers, setAnswers] = useState<ClientExamAnswer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<"database" | "local" | "none">("none");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const sessionId = window.localStorage.getItem(SESSION_KEY);
      const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
      const response = await fetch(`/api/exam/session${params}`).catch(() => null);
      const payload = response?.ok ? await response.json().catch(() => null) : null;

      if (!cancelled && payload?.answers?.length) {
        setAnswers(payload.answers as ClientExamAnswer[]);
        setSource("database");
        setLoaded(true);
        return;
      }

      const localAnswers = loadLocalAnswers();
      if (!cancelled) {
        setAnswers(localAnswers);
        setSource(localAnswers.length ? "local" : "none");
        setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { answers, loaded, source };
}
