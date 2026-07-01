"use client";

import { useEffect, useState } from "react";
import type { ClientExamAnswer } from "@/src/lib/exam/session";

const STORAGE_KEY = "sci-test-exam-answers";
const SESSION_KEY = "sci-test-session-id";
const ANONYMOUS_SESSION_KEY = "sci-test-anonymous-session-id";
const EXAM_PLAN_KEY = "sci-test-exam-plan";
const ACTIVE_SESSION_KEY = "sci-test-active-exam-session";

type ActiveExamSession = {
  sessionId: string | null;
  anonymousSessionId: string;
  sessionSeed: string;
  answerCount: number;
  updatedAt: string;
};

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

function loadJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function isSameActiveSession(meta: ActiveExamSession | null, sessionId: string | null) {
  const plan = loadJson<{ sessionSeed?: string }>(EXAM_PLAN_KEY);
  if (!meta || !plan?.sessionSeed) return true;
  return meta.sessionSeed === plan.sessionSeed && (!sessionId || !meta.sessionId || meta.sessionId === sessionId);
}

export function useExamAnswers() {
  const [answers, setAnswers] = useState<ClientExamAnswer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<"database" | "local" | "none">("none");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const localAnswers = loadLocalAnswers();
      const sessionId = window.localStorage.getItem(SESSION_KEY);
      const activeSession = loadJson<ActiveExamSession>(ACTIVE_SESSION_KEY);
      const anonymousSessionId = window.localStorage.getItem(ANONYMOUS_SESSION_KEY);
      const params = new URLSearchParams();
      if (sessionId) params.set("sessionId", sessionId);
      if (anonymousSessionId) params.set("anonymousSessionId", anonymousSessionId);
      const response = await fetch(`/api/exam/session${params.toString() ? `?${params}` : ""}`).catch(() => null);
      const payload = response?.ok ? await response.json().catch(() => null) : null;
      const dbAnswers = (payload?.answers || []) as ClientExamAnswer[];

      if (!cancelled && isSameActiveSession(activeSession, payload?.sessionId || sessionId) && dbAnswers.length > localAnswers.length) {
        setAnswers(dbAnswers);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dbAnswers));
        if (payload.sessionId) {
          window.localStorage.setItem(SESSION_KEY, payload.sessionId);
        }
        setSource("database");
        setLoaded(true);
        return;
      }

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
