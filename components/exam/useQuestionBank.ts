"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "@/src/lib/data/questions";

type QuestionBankState = {
  questions: Question[];
  loaded: boolean;
  error: string | null;
  getById: (id: string) => Question | null;
};

export function useQuestionBank(): QuestionBankState {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch("/api/questions").catch(() => null);
      if (!response?.ok) {
        if (!cancelled) {
          setError("問題の読み込みに失敗しました。");
          setLoaded(true);
        }
        return;
      }

      const payload = await response.json().catch(() => null);
      if (!cancelled) {
        setQuestions((payload?.questions as Question[]) ?? []);
        setLoaded(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);

  return {
    questions,
    loaded,
    error,
    getById: (id: string) => byId.get(id) ?? null
  };
}
