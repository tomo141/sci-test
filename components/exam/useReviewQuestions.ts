"use client";

import { useEffect, useState } from "react";

type ReviewQuestion = {
  id: string;
  domain: string;
  question: string;
  shortExplanation: string;
};

export function useReviewQuestions(questionIds: string[]) {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const questionKey = questionIds.join(",");

  useEffect(() => {
    const ids = questionKey ? questionKey.split(",") : [];
    if (!ids.length) {
      setQuestions([]);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ ids: questionKey });

    void fetch(`/api/questions/review?${params}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!cancelled) {
          setQuestions((payload?.questions as ReviewQuestion[]) ?? []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuestions([]);
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [questionKey]);

  const byId = new Map(questions.map((question) => [question.id, question]));

  return {
    loaded,
    getById: (id: string) => byId.get(id) ?? null
  };
}
