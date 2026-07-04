"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuestionFeedbackKind } from "@/src/lib/exam/feedback";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { QuestionCardSkeleton } from "@/components/exam/QuestionCardSkeleton";
import type { AnswerFeedback } from "@/src/lib/exam/explanation";
import { estimateFromAnswers } from "@/src/lib/scoring/scoring";
import { examConfig } from "@/src/lib/exam/config";
import type { PublicQuestion } from "@/src/lib/exam/publicQuestion";
import { domains } from "@/src/lib/data/taxonomy";
import {
  EXAM_PLAN_STORAGE_KEY,
  createDomainExamPlan,
  createExamPlan,
  loadOrCreateExamPlan,
  type ClientExamAnswer,
  type ExamPlan
} from "@/src/lib/exam/session";

const QUESTIONS_PER_CYCLE = examConfig.questionsPerCycle;
const ANSWER_SCROLL_DELAY_MS = 140;
const ANSWER_SCROLL_DURATION_MS = 500;
const LOADING_HELP_DELAY_MS = 5000;
const ANSWERS_STORAGE_KEY = "sci-test-exam-answers";
const SESSION_STORAGE_KEY = "sci-test-session-id";
const ANONYMOUS_SESSION_STORAGE_KEY = "sci-test-anonymous-session-id";
const ACTIVE_SESSION_STORAGE_KEY = "sci-test-active-exam-session";
const ANSWER_SYNC_QUEUE_STORAGE_KEY = "sci-test-answer-sync-queue";
const DEFAULT_EXAM_VALUE = "overall";

type ActiveExamSession = {
  sessionId: string | null;
  anonymousSessionId: string;
  sessionSeed: string;
  answerCount: number;
  updatedAt: string;
};

type AnswerSyncPayload = {
  sessionId: string;
  anonymousSessionId: string | null;
  questionId: string;
  selectedDisplayIndex: number;
  responseTimeMs: number;
  previousAnswers: ClientExamAnswer[];
  examPlan: ExamPlan;
};

type QueuedAnswerSync = {
  id: string;
  payload: AnswerSyncPayload;
  queuedAt: string;
  attempts: number;
};

type AnswerHighlight = {
  correctDisplayIndex: number;
  selectedDisplayIndex: number;
};

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function scrollToElementTop(element: HTMLElement, durationMs: number) {
  const startY = window.scrollY;
  const targetY = startY + element.getBoundingClientRect().top;
  const distance = targetY - startY;
  const startTime = performance.now();
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
      return;
    }
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }

  requestAnimationFrame(step);
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function saveActiveSession(meta: ActiveExamSession) {
  window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(meta));
}

function isSameActiveSession(meta: ActiveExamSession | null, sessionId: string | null, plan: ExamPlan) {
  if (!meta) return true;
  return meta.sessionSeed === plan.sessionSeed && (!sessionId || !meta.sessionId || meta.sessionId === sessionId);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest("input, textarea, select, [contenteditable='true']");
}

async function fetchExamQuestion(examPlan: ExamPlan, previousAnswers: ClientExamAnswer[]) {
  const response = await fetch("/api/exam/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ examPlan, previousAnswers })
  }).catch(() => null);

  if (!response?.ok) return null;
  const payload = await response.json().catch(() => null);
  return (payload?.question as PublicQuestion | undefined) ?? null;
}

async function postAnswerSync(payload: AnswerSyncPayload) {
  const response = await fetch("/api/exam/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => null);
  return response?.ok ? response : null;
}

function enqueueAnswerSync(payload: AnswerSyncPayload) {
  const queue = loadJson<QueuedAnswerSync[]>(ANSWER_SYNC_QUEUE_STORAGE_KEY, []);
  queue.push({
    id: crypto.randomUUID(),
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 0
  });
  window.localStorage.setItem(ANSWER_SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

async function flushAnswerSyncQueue(sessionId: string | null, plan: ExamPlan) {
  const queue = loadJson<QueuedAnswerSync[]>(ANSWER_SYNC_QUEUE_STORAGE_KEY, []);
  if (!queue.length) return;

  const remaining: QueuedAnswerSync[] = [];
  for (const item of queue) {
    if (item.payload.sessionId !== sessionId || item.payload.examPlan.sessionSeed !== plan.sessionSeed) {
      remaining.push(item);
      continue;
    }

    const response = await postAnswerSync(item.payload);
    if (!response) {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  if (remaining.length) {
    window.localStorage.setItem(ANSWER_SYNC_QUEUE_STORAGE_KEY, JSON.stringify(remaining));
  } else {
    window.localStorage.removeItem(ANSWER_SYNC_QUEUE_STORAGE_KEY);
  }
}

export default function ExamPage() {
  const questionTopRef = useRef<HTMLDivElement>(null);
  const questionTextRef = useRef<HTMLHeadingElement>(null);
  const prefetchedNextRef = useRef<PublicQuestion | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ClientExamAnswer[]>([]);
  const [examPlan, setExamPlan] = useState<ExamPlan | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PublicQuestion | null>(null);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [answerHighlight, setAnswerHighlight] = useState<AnswerHighlight | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<QuestionFeedbackKind | null>(null);
  const [showLoadingHelp, setShowLoadingHelp] = useState(false);
  const [startReady, setStartReady] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [selectedExamValue, setSelectedExamValue] = useState(DEFAULT_EXAM_VALUE);

  const estimate = useMemo(() => estimateFromAnswers(answers), [answers]);
  const correctCount = answers.filter((a) => a.correct).length;
  const rate = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
  const questionNumber = answers.length + 1;
  const cycleNumber = Math.floor(answers.length / QUESTIONS_PER_CYCLE) + 1;
  const positionInCycle = (answers.length % QUESTIONS_PER_CYCLE) + 1;
  const progressLabel =
    cycleNumber === 1
      ? `第 ${questionNumber} 問 / ${QUESTIONS_PER_CYCLE} 問`
      : `第 ${questionNumber} 問（${cycleNumber}周目 ${positionInCycle}/${QUESTIONS_PER_CYCLE}）`;
  const examModeLabel =
    examPlan?.mode === "domain" && examPlan.targetDomain ? `分野スコア（${examPlan.targetDomain}）` : "総合スコア";

  const loadQuestion = useCallback(async (plan: ExamPlan, previousAnswers: ClientExamAnswer[]) => {
    setQuestionLoading(true);
    setQuestionError(null);
    const question = await fetchExamQuestion(plan, previousAnswers);
    if (!question) {
      setQuestionError("次の問題を取得できませんでした。");
      setCurrentQuestion(null);
    } else {
      setCurrentQuestion(question);
    }
    setQuestionLoading(false);
  }, []);

  const applyQuestion = useCallback((question: PublicQuestion | null) => {
    prefetchedNextRef.current = null;
    setQuestionError(question ? null : "次の問題を取得できませんでした。");
    setCurrentQuestion(question);
    setQuestionLoading(false);
  }, []);

  useEffect(() => {
    if (!questionLoading) {
      setShowLoadingHelp(false);
      return;
    }

    const timer = window.setTimeout(() => setShowLoadingHelp(true), LOADING_HELP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [questionLoading]);

  useEffect(() => {
    const existingAnonymousId = window.localStorage.getItem(ANONYMOUS_SESSION_STORAGE_KEY) || crypto.randomUUID();
    window.localStorage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, existingAnonymousId);
    setAnonymousSessionId(existingAnonymousId);

    const storedPlan = window.localStorage.getItem(EXAM_PLAN_STORAGE_KEY);
    const activeSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const existingAnswers = window.localStorage.getItem(ANSWERS_STORAGE_KEY);
    const hasLocalAnswers = !!existingAnswers && existingAnswers !== "[]";

    if (!storedPlan && !activeSessionId && !hasLocalAnswers) {
      setQuestionLoading(false);
      setStartReady(true);
      return;
    }

    const plan = loadOrCreateExamPlan(storedPlan);
    window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(plan));
    setExamPlan(plan);
    setExamStarted(true);
    setStartReady(true);
    setSelectedExamValue(plan.mode === "domain" && plan.targetDomain ? plan.targetDomain : DEFAULT_EXAM_VALUE);

    const activeSession = loadJson<ActiveExamSession | null>(ACTIVE_SESSION_STORAGE_KEY, null);
    const parsedAnswers = existingAnswers ? (JSON.parse(existingAnswers) as ClientExamAnswer[]) : [];
    const localAnswers = isSameActiveSession(activeSession, activeSessionId, plan) ? parsedAnswers : [];
    setAnswers(localAnswers);

    void loadQuestion(plan, localAnswers);

    const params = new URLSearchParams();
    if (activeSessionId) params.set("sessionId", activeSessionId);
    params.set("anonymousSessionId", existingAnonymousId);

    void fetch(`/api/exam/session${params.toString() ? `?${params}` : ""}`)
      .then((response) => response.json())
      .then((data) => {
        const dbAnswers = (data.answers || []) as ClientExamAnswer[];
        if (dbAnswers.length > localAnswers.length) {
          setAnswers(dbAnswers);
          window.localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(dbAnswers));
        }
        if (data.sessionId) {
          setSessionId(data.sessionId);
          window.localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
        }
        saveActiveSession({
          sessionId: data.sessionId || activeSessionId,
          anonymousSessionId: existingAnonymousId,
          sessionSeed: plan.sessionSeed,
          answerCount: dbAnswers.length,
          updatedAt: new Date().toISOString()
        });
      })
      .catch(() => null);

    if (activeSessionId && isSameActiveSession(activeSession, activeSessionId, plan)) {
      setSessionId(activeSessionId);
      saveActiveSession({
        sessionId: activeSessionId,
        anonymousSessionId: existingAnonymousId,
        sessionSeed: plan.sessionSeed,
        answerCount: localAnswers.length,
        updatedAt: new Date().toISOString()
      });
      void flushAnswerSyncQueue(activeSessionId, plan);
      return;
    }

    fetch("/api/exam/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousSessionId: existingAnonymousId, examPlan: plan })
    })
      .then((response) => response.json())
      .then((data) => {
        setSessionId(data.sessionId);
        window.localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
        setAnonymousSessionId(data.anonymousSessionId);
        saveActiveSession({
          sessionId: data.sessionId,
          anonymousSessionId: data.anonymousSessionId,
          sessionSeed: (data.examPlan || plan).sessionSeed,
          answerCount: localAnswers.length,
          updatedAt: new Date().toISOString()
        });
        if (data.examPlan) {
          setExamPlan(data.examPlan);
          window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(data.examPlan));
        }
        void flushAnswerSyncQueue(data.sessionId, data.examPlan || plan);
      })
      .catch(() => {
        const localSessionId = `local-${existingAnonymousId}`;
        setSessionId(localSessionId);
        saveActiveSession({
          sessionId: localSessionId,
          anonymousSessionId: existingAnonymousId,
          sessionSeed: plan.sessionSeed,
          answerCount: localAnswers.length,
          updatedAt: new Date().toISOString()
        });
      });
  }, [loadQuestion]);

  const startExam = async () => {
    const targetDomain = domains.find((domain) => domain === selectedExamValue);
    const newPlan = targetDomain ? createDomainExamPlan(targetDomain) : createExamPlan();
    window.localStorage.removeItem(ANSWERS_STORAGE_KEY);
    window.localStorage.removeItem(ANSWER_SYNC_QUEUE_STORAGE_KEY);
    window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(newPlan));

    setAnswers([]);
    setExamPlan(newPlan);
    setExamStarted(true);
    setQuestionLoading(true);
    setQuestionError(null);
    prefetchedNextRef.current = null;

    const anonymousId = anonymousSessionId || crypto.randomUUID();
    window.localStorage.setItem(ANONYMOUS_SESSION_STORAGE_KEY, anonymousId);

    try {
      const response = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousSessionId: anonymousId, examPlan: newPlan })
      });
      const data = await response.json();
      setSessionId(data.sessionId);
      window.localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      setAnonymousSessionId(data.anonymousSessionId || anonymousId);
      saveActiveSession({
        sessionId: data.sessionId,
        anonymousSessionId: data.anonymousSessionId || anonymousId,
        sessionSeed: (data.examPlan || newPlan).sessionSeed,
        answerCount: 0,
        updatedAt: new Date().toISOString()
      });
      if (data.examPlan) {
        setExamPlan(data.examPlan);
        window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(data.examPlan));
      }
      void loadQuestion(data.examPlan || newPlan, []);
    } catch {
      const localSessionId = `local-${anonymousId}`;
      setSessionId(localSessionId);
      saveActiveSession({
        sessionId: localSessionId,
        anonymousSessionId: anonymousId,
        sessionSeed: newPlan.sessionSeed,
        answerCount: 0,
        updatedAt: new Date().toISOString()
      });
      void loadQuestion(newPlan, []);
    }
  };

  const answer = useCallback(async (choiceIndex?: number) => {
    const selectedIndex = choiceIndex ?? selected;
    if (selectedIndex === null || !currentQuestion || !examPlan || answered) return;

    const activeSessionId = sessionId || `local-${anonymousSessionId || "preview"}`;
    const syncPayload: AnswerSyncPayload = {
      sessionId: activeSessionId,
      anonymousSessionId,
      questionId: currentQuestion.id,
      selectedDisplayIndex: selectedIndex,
      responseTimeMs: 0,
      previousAnswers: answers,
      examPlan
    };

    setSelected(selectedIndex);
    setAnswered(true);
    setFeedbackLoading(true);
    setAnswerHighlight(null);
    setAnswerFeedback(null);
    window.setTimeout(() => {
      if (questionTextRef.current) scrollToElementTop(questionTextRef.current, ANSWER_SCROLL_DURATION_MS);
    }, ANSWER_SCROLL_DELAY_MS);

    const response = await fetch("/api/exam/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncPayload)
    }).catch(() => null);

    if (!response?.ok) {
      setSelected(null);
      setAnswered(false);
      setFeedbackLoading(false);
      enqueueAnswerSync(syncPayload);
      setQuestionError("回答の送信に失敗しました。通信状況を確認してください。");
      return;
    }

    void flushAnswerSyncQueue(activeSessionId, examPlan);
    const payload = await response.json().catch(() => null);
    const correct = payload?.correct === true;
    const currentAnswer: ClientExamAnswer = {
      questionId: currentQuestion.id,
      domain: currentQuestion.domain,
      abilityAxis: currentQuestion.abilityAxis,
      difficulty: currentQuestion.difficulty,
      discrimination: currentQuestion.discrimination,
      qualityScore: currentQuestion.qualityScore,
      correct,
      selectedChoiceIndex: selectedIndex,
      answeredAt: new Date().toISOString(),
      responseTimeMs: 0
    };
    const nextAnswers = [...answers, currentAnswer];
    setAnswers(nextAnswers);
    window.localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(nextAnswers));
    saveActiveSession({
      sessionId: activeSessionId,
      anonymousSessionId: anonymousSessionId || "",
      sessionSeed: examPlan.sessionSeed,
      answerCount: nextAnswers.length,
      updatedAt: new Date().toISOString()
    });

    setAnswerHighlight({
      correctDisplayIndex: payload?.correctDisplayIndex ?? selectedIndex,
      selectedDisplayIndex: payload?.selectedDisplayIndex ?? selectedIndex
    });
    setAnswerFeedback(
      payload?.feedback
        ? {
            ...payload.feedback,
            conclusion: payload.feedback.conclusion || payload.shortExplanation || ""
          }
        : null
    );
    setFeedbackLoading(false);
    if (payload?.nextQuestion) {
      prefetchedNextRef.current = payload.nextQuestion as PublicQuestion;
    }
  }, [anonymousSessionId, answered, answers, currentQuestion, examPlan, selected, sessionId]);

  const next = useCallback(() => {
    if (!examPlan) return;
    const latestAnswers = loadJson<ClientExamAnswer[]>(ANSWERS_STORAGE_KEY, answers);
    setSelected(null);
    setAnswered(false);
    setAnswerFeedback(null);
    setFeedbackLoading(false);
    setAnswerHighlight(null);
    setActiveFeedback(null);

    const prefetched = prefetchedNextRef.current;
    if (prefetched) {
      prefetchedNextRef.current = null;
      applyQuestion(prefetched);
    } else {
      void loadQuestion(examPlan, latestAnswers);
    }

    requestAnimationFrame(() => {
      questionTopRef.current?.scrollIntoView({ block: "start" });
    });
  }, [answers, applyQuestion, examPlan, loadQuestion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) return;

      if (!answered && !questionLoading && currentQuestion && /^[1-4]$/.test(event.key)) {
        const choiceIndex = Number(event.key) - 1;
        if (choiceIndex < currentQuestion.choices.length) {
          event.preventDefault();
          void answer(choiceIndex);
        }
        return;
      }

      if (event.code === "Space" && answered && answerFeedback && !feedbackLoading) {
        event.preventDefault();
        next();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answer, answerFeedback, answered, currentQuestion, feedbackLoading, next, questionLoading]);

  const restartFromBeginning = async () => {
    if (!window.confirm("回答履歴を消去して、最初からやり直しますか？")) return;

    window.localStorage.removeItem(ANSWERS_STORAGE_KEY);
    window.localStorage.removeItem(ANSWER_SYNC_QUEUE_STORAGE_KEY);
    window.localStorage.removeItem(EXAM_PLAN_STORAGE_KEY);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);

    setAnswers([]);
    setExamPlan(null);
    setExamStarted(false);
    setStartReady(true);
    setQuestionLoading(false);
    setCurrentQuestion(null);
    setSelected(null);
    setAnswered(false);
    setAnswerFeedback(null);
    setFeedbackLoading(false);
    setAnswerHighlight(null);
    setActiveFeedback(null);
    prefetchedNextRef.current = null;
  };

  if (startReady && !examStarted) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <AppCard>
          <p className="text-sm font-black text-[var(--color-primary-700)]">腕試し受験</p>
          <h1 className="mt-3 text-3xl font-black">受験する</h1>
          <div className="mt-6 grid gap-3">
            <label className="text-sm font-bold text-[var(--color-muted)]" htmlFor="exam-kind">受験タイプ</label>
            <select
              id="exam-kind"
              className="h-12 rounded-lg border border-[var(--color-border)] bg-white px-4 font-bold text-[var(--color-ink)]"
              value={selectedExamValue}
              onChange={(event) => setSelectedExamValue(event.target.value)}
            >
              <option value={DEFAULT_EXAM_VALUE}>総合スコア</option>
              {domains.map((domain) => (
                <option key={domain} value={domain}>分野スコア（{domain}）</option>
              ))}
            </select>
          </div>
          <AppButton className="mt-6 w-full" onClick={() => void startExam()}>
            受験する
          </AppButton>
        </AppCard>
      </main>
    );
  }

  if (!examPlan) {
    return (
      <main className="page-container py-8">
        <QuestionCardSkeleton showDifficulty />
      </main>
    );
  }

  if (questionError && !currentQuestion && !questionLoading) {
    return (
      <>
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <AppCard>
            <h1 className="text-2xl font-black">問題を読み込めませんでした</h1>
            <p className="mt-3 font-bold text-[var(--color-ink-soft)]">{questionError || "出題可能な問題がありません。"}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <AppButton onClick={() => window.location.reload()}>再読み込み</AppButton>
              <AppButton href="/" variant="secondary">トップへ戻る</AppButton>
            </div>
          </AppCard>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="page-container py-8">
        <div className="mb-5 flex justify-end">
          <AppButton variant="ghost" onClick={() => void restartFromBeginning()}>
            最初からやり直す
          </AppButton>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-black md:text-4xl">腕試し受験ページ</h1>
          <p className="mt-2 font-bold text-[var(--color-ink-soft)]">{examModeLabel}をチェックしよう！</p>
        </div>
        <AppCard className="mb-6 grid gap-5 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-[var(--color-muted)]">{progressLabel}</p>
            <ProgressBar
              value={(positionInCycle / QUESTIONS_PER_CYCLE) * 100}
              label={`${Math.round((positionInCycle / QUESTIONS_PER_CYCLE) * 100)}%`}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-muted)]">正答数 / 出題数（正答率）</p>
            <p className="text-3xl font-black text-[var(--color-primary-800)]">
              {correctCount} / {answers.length} <span className="text-xl">（{rate}%）</span>
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-muted)]">推定{examModeLabel}</p>
            <p className="text-3xl font-black text-[var(--color-primary-800)]">
              {estimate.scoreRange[0]} 〜 {estimate.scoreRange[1]}
            </p>
          </div>
        </AppCard>
        <div ref={questionTopRef} className="scroll-mt-4" />
        <section className="mt-6">
          {currentQuestion ? (
            <QuestionCard
              question={currentQuestion}
              index={answers.length}
              selected={selected}
              answered={answered}
              feedback={answerFeedback}
              feedbackLoading={feedbackLoading}
              questionTextRef={questionTextRef}
              showDifficulty
              answerHighlight={answerHighlight}
              onChoiceClick={(choiceIndex) => void answer(choiceIndex)}
              activeFeedback={activeFeedback}
              onFeedbackChange={setActiveFeedback}
            />
          ) : (
            <QuestionCardSkeleton showDifficulty />
          )}
          {showLoadingHelp && questionLoading && !currentQuestion ? (
            <div className="mt-6 rounded-2xl border border-yellow-300 bg-[var(--color-warning-100)] p-4 text-center">
              <p className="font-bold text-[var(--color-warning-700)]">
                読み込みに時間がかかっています。通信状況を確認して、再読み込みをお試しください。
              </p>
              <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                <AppButton onClick={() => window.location.reload()}>再読み込み</AppButton>
                <AppButton href="/" variant="secondary">トップへ戻る</AppButton>
              </div>
            </div>
          ) : null}
          {answered ? (
            <div className="mt-6 grid gap-3">
              <AppButton onClick={next}>次の問題へ</AppButton>
              {answerFeedback && !feedbackLoading ? (
                <p className="text-center text-xs font-bold text-[var(--color-muted)]">
                  スペースキーでも次の問題へ進めます
                </p>
              ) : null}
              {examConfig.canViewKarte(answers.length) ? (
                <AppButton href="/karte" variant="secondary">
                  腕試しカルテを見る
                </AppButton>
              ) : examConfig.canViewQuickResult(answers.length) ? (
                <AppButton href="/result" variant="secondary">
                  腕試し速報を見る
                </AppButton>
              ) : null}
            </div>
          ) : null}
          <p className="mt-3 text-xs leading-6 text-[var(--color-muted)]">
            ※検索や生成AIを使わず、今の自分の科学力で挑戦することをおすすめします。正答率が概ね60〜80％になるよう、回答状況に応じて問題の難しさを調整します。
          </p>
        </section>
      </main>
    </>
  );
}
