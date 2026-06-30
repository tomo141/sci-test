"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { QuestionFeedbackKind } from "@/src/lib/exam/feedback";
import { shuffleChoices } from "@/src/lib/exam/shuffleChoices";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { QuestionCard } from "@/components/exam/QuestionCard";
import type { Question } from "@/src/lib/data/questions";
import { buildAnswerFeedback } from "@/src/lib/exam/explanation";
import { estimateFromAnswers } from "@/src/lib/scoring/scoring";
import { examConfig } from "@/src/lib/exam/config";
import {
  EXAM_PLAN_STORAGE_KEY,
  createExamPlan,
  loadOrCreateExamPlan,
  nextQuestionForAnswers,
  type ClientExamAnswer,
  type ExamPlan
} from "@/src/lib/exam/session";

const QUESTIONS_PER_CYCLE = examConfig.questionsPerCycle;
const ANSWER_SCROLL_DELAY_MS = 140;
const ANSWER_SCROLL_DURATION_MS = 500;

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

export default function ExamPage() {
  const questionTopRef = useRef<HTMLDivElement>(null);
  const questionTextRef = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ClientExamAnswer[]>([]);
  const [examPlan, setExamPlan] = useState<ExamPlan | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [serverExplanation, setServerExplanation] = useState<string | null>(null);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<QuestionFeedbackKind | null>(null);
  const shuffledQuestion = useMemo(() => {
    if (!currentQuestion) return null;
    void shuffleKey;
    const shuffled = shuffleChoices(currentQuestion);
    return {
      question: {
        ...currentQuestion,
        choices: shuffled.choices,
        correctIndex: shuffled.correctIndex
      },
      displayToOriginal: shuffled.displayToOriginal
    };
  }, [currentQuestion, shuffleKey]);

  const displayQuestion = shuffledQuestion
    ? {
        ...shuffledQuestion.question,
        shortExplanation: serverExplanation || currentQuestion?.shortExplanation || ""
      }
    : null;
  const answerFeedback = useMemo(() => {
    if (!answered || selected === null || !currentQuestion || !shuffledQuestion) return null;
    const isCorrect = selected === shuffledQuestion.question.correctIndex;
    const originalIndex = shuffledQuestion.displayToOriginal[selected];
    const feedback = buildAnswerFeedback(currentQuestion, originalIndex, isCorrect);
    if (serverExplanation) {
      return { ...feedback, conclusion: serverExplanation };
    }
    return feedback;
  }, [answered, selected, currentQuestion, shuffledQuestion, serverExplanation]);
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

  useEffect(() => {
    const existingAnonymousId = window.localStorage.getItem("sci-test-anonymous-session-id") || crypto.randomUUID();
    window.localStorage.setItem("sci-test-anonymous-session-id", existingAnonymousId);
    setAnonymousSessionId(existingAnonymousId);

    const plan = loadOrCreateExamPlan(window.localStorage.getItem(EXAM_PLAN_STORAGE_KEY));
    window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(plan));
    setExamPlan(plan);

    const existingAnswers = window.localStorage.getItem("sci-test-exam-answers");
    const parsedAnswers = existingAnswers ? (JSON.parse(existingAnswers) as ClientExamAnswer[]) : [];
    setAnswers(parsedAnswers);
    setCurrentQuestion(nextQuestionForAnswers(parsedAnswers, plan)?.question ?? null);

    const activeSessionId = window.localStorage.getItem("sci-test-session-id");
    void fetch(activeSessionId ? `/api/exam/session?sessionId=${encodeURIComponent(activeSessionId)}` : "/api/exam/session")
      .then((response) => response.json())
      .then((data) => {
        if (!data?.answers?.length) return;
        const dbAnswers = data.answers as ClientExamAnswer[];
        setAnswers(dbAnswers);
        window.localStorage.setItem("sci-test-exam-answers", JSON.stringify(dbAnswers));
        if (data.sessionId) {
          setSessionId(data.sessionId);
          window.localStorage.setItem("sci-test-session-id", data.sessionId);
        }
        setCurrentQuestion(nextQuestionForAnswers(dbAnswers, plan)?.question ?? null);
      })
      .catch(() => null);

    fetch("/api/exam/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousSessionId: existingAnonymousId, examPlan: plan })
    })
      .then((response) => response.json())
      .then((data) => {
        setSessionId(data.sessionId);
        window.localStorage.setItem("sci-test-session-id", data.sessionId);
        setAnonymousSessionId(data.anonymousSessionId);
        if (data.examPlan) {
          setExamPlan(data.examPlan);
          window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(data.examPlan));
        }
      })
      .catch(() => setSessionId(`local-${existingAnonymousId}`));
  }, []);

  const answer = async (choiceIndex?: number) => {
    const selectedIndex = choiceIndex ?? selected;
    if (selectedIndex === null || !currentQuestion || !shuffledQuestion || !examPlan) return;
    setSelected(selectedIndex);
    setAnswered(true);
    window.setTimeout(() => {
      if (questionTextRef.current) scrollToElementTop(questionTextRef.current, ANSWER_SCROLL_DURATION_MS);
    }, ANSWER_SCROLL_DELAY_MS);
    const originalChoiceIndex = shuffledQuestion.displayToOriginal[selectedIndex];
    const currentAnswer: ClientExamAnswer = {
      questionId: currentQuestion.id,
      domain: currentQuestion.domain,
      abilityAxis: currentQuestion.abilityAxis,
      difficulty: currentQuestion.difficulty,
      discrimination: currentQuestion.discrimination,
      qualityScore: currentQuestion.qualityScore,
      correct: selectedIndex === shuffledQuestion.question.correctIndex,
      selectedChoiceIndex: originalChoiceIndex,
      answeredAt: new Date().toISOString(),
      responseTimeMs: 0
    };
    const nextAnswers = [...answers, currentAnswer];
    setAnswers(nextAnswers);
    window.localStorage.setItem("sci-test-exam-answers", JSON.stringify(nextAnswers));

    const activeSessionId = sessionId || `local-${anonymousSessionId || "preview"}`;
    const response = await fetch("/api/exam/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: activeSessionId,
        anonymousSessionId,
        questionId: currentQuestion.id,
        selectedChoiceIndex: originalChoiceIndex,
        responseTimeMs: 0,
        previousAnswers: answers,
        examPlan
      })
    }).catch(() => null);
    const payload = response ? await response.json().catch(() => null) : null;
    setServerExplanation(payload?.shortExplanation || currentQuestion.shortExplanation);
  };

  const next = () => {
    if (!examPlan) return;
    const nextAnswers = answers;
    setCurrentQuestion(nextQuestionForAnswers(nextAnswers, examPlan)?.question ?? null);
    setSelected(null);
    setAnswered(false);
    setServerExplanation(null);
    setActiveFeedback(null);
    setShuffleKey((key) => key + 1);
    requestAnimationFrame(() => {
      questionTopRef.current?.scrollIntoView({ block: "start" });
    });
  };

  const restartFromBeginning = async () => {
    if (!window.confirm("回答履歴を消去して、最初からやり直しますか？")) return;

    const newPlan = createExamPlan();
    window.localStorage.removeItem("sci-test-exam-answers");
    window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(newPlan));

    setAnswers([]);
    setExamPlan(newPlan);
    setSelected(null);
    setAnswered(false);
    setServerExplanation(null);
    setActiveFeedback(null);
    setShuffleKey((key) => key + 1);
    setCurrentQuestion(nextQuestionForAnswers([], newPlan)?.question ?? null);

    const anonymousId = anonymousSessionId || crypto.randomUUID();
    window.localStorage.setItem("sci-test-anonymous-session-id", anonymousId);

    try {
      const response = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousSessionId: anonymousId, examPlan: newPlan })
      });
      const data = await response.json();
      setSessionId(data.sessionId);
      window.localStorage.setItem("sci-test-session-id", data.sessionId);
      if (data.examPlan) {
        setExamPlan(data.examPlan);
        window.localStorage.setItem(EXAM_PLAN_STORAGE_KEY, JSON.stringify(data.examPlan));
        setCurrentQuestion(nextQuestionForAnswers([], data.examPlan)?.question ?? null);
      }
    } catch {
      setSessionId(`local-${anonymousId}`);
    }
  };

  if (!currentQuestion) {
    return (
      <>
        <SiteHeader compact />
        <main className="page-container py-8">
          <div className="mb-5 flex items-center justify-end">
            <AppButton variant="ghost" onClick={() => void restartFromBeginning()}>
              最初からやり直す
            </AppButton>
          </div>
          <AppCard>
            <p className="font-bold text-[var(--color-ink-soft)]">出題できる問題がありません。回答をリセットして再開してください。</p>
            <AppButton href="/" className="mt-4">
              トップへ戻る
            </AppButton>
          </AppCard>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader compact />
      <main className="page-container py-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-bold text-[var(--color-primary-700)]">
            ← 戻る
          </Link>
          <AppButton variant="ghost" onClick={() => void restartFromBeginning()}>
            最初からやり直す
          </AppButton>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-black md:text-4xl">腕試し受験ページ</h1>
          <p className="mt-2 font-bold text-[var(--color-ink-soft)]">いまの実力をチェックしよう！</p>
          {examConfig.isShortMode ? (
            <p className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              検証モード: {QUESTIONS_PER_CYCLE}問で完走（本番は{examConfig.defaultQuestionsPerCycle}問）
            </p>
          ) : null}
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
            <p className="text-sm font-bold text-[var(--color-muted)]">推定総合スコア</p>
            <p className="text-3xl font-black text-[var(--color-primary-800)]">
              {estimate.scoreRange[0]} 〜 {estimate.scoreRange[1]}
            </p>
          </div>
        </AppCard>
        <div ref={questionTopRef} className="scroll-mt-4" />
        <section className="mt-6">
          {displayQuestion ? (
            <QuestionCard
              question={displayQuestion}
              index={answers.length}
              selected={selected}
              answered={answered}
              feedback={answerFeedback}
              questionTextRef={questionTextRef}
              onChoiceClick={(choiceIndex) => void answer(choiceIndex)}
              activeFeedback={activeFeedback}
              onFeedbackChange={setActiveFeedback}
            />
          ) : null}
          {answered ? (
            <div className="mt-6 grid gap-3">
              <AppButton onClick={next}>次の問題へ</AppButton>
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
