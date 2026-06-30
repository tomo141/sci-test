"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Dice5, Target } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { useQuestionBank } from "@/components/exam/useQuestionBank";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { trainingConfig } from "@/src/lib/training/config";
import { DomainIcon } from "@/components/ui/DomainIcon";
import { shuffleChoices } from "@/src/lib/exam/shuffleChoices";
import { buildAnswerFeedback } from "@/src/lib/exam/explanation";
import type { QuestionFeedbackKind } from "@/src/lib/exam/feedback";

type TrainingMode = "domain" | "random";

type TrainingAccess = {
  freeLimit: number;
  answerCount: number;
  marketingConsented: boolean;
  canAnswer: boolean;
  isLoggedIn: boolean;
};

const modes: [typeof Target | typeof Dice5, TrainingMode, string, string][] = [
  [Target, "domain", "分野指定", "特定の分野を集中的にトレーニングする"],
  [Dice5, "random", "全分野ランダム", "ランダムに出題される問題で総合力を鍛える"]
];

const TRAINING_STORAGE_KEY = "sci-test-training-history";

type TrainingAnswer = {
  questionId: string;
  correct: boolean;
  answeredAt: string;
};

function loadHistory(): TrainingAnswer[] {
  if (typeof window === "undefined") return [];
  const stored = window.localStorage.getItem(TRAINING_STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as TrainingAnswer[];
  } catch {
    window.localStorage.removeItem(TRAINING_STORAGE_KEY);
    return [];
  }
}

function shuffleQuestions<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

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

export default function TrainingPage() {
  const { questions, loaded: questionsLoaded } = useQuestionBank();
  const questionTopRef = useRef<HTMLDivElement>(null);
  const questionTextRef = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState<TrainingMode>("domain");
  const [domain, setDomain] = useState<ScienceDomain>("化学");
  const [history, setHistory] = useState<TrainingAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [randomOrder, setRandomOrder] = useState<string[]>([]);
  const [access, setAccess] = useState<TrainingAccess | null>(null);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<QuestionFeedbackKind | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    void fetch("/api/training/access")
      .then((response) => response.json())
      .then((payload: TrainingAccess) => setAccess(payload))
      .catch(() =>
        setAccess({
          freeLimit: trainingConfig.freeAnswerLimit,
          answerCount: 0,
          marketingConsented: false,
          canAnswer: true,
          isLoggedIn: false
        })
      );
  }, []);

  const publishedQuestions = useMemo(() => questions.filter((question) => question.published), [questions]);

  const poolQuestions = useMemo(() => {
    if (mode === "domain") {
      return publishedQuestions.filter((question) => question.domain === domain);
    }
    if (!randomOrder.length) return publishedQuestions;
    const byId = new Map(publishedQuestions.map((question) => [question.id, question]));
    return randomOrder.map((id) => byId.get(id)).filter((question) => question !== undefined);
  }, [domain, mode, publishedQuestions, randomOrder]);

  useEffect(() => {
    if (mode !== "random") return;
    setRandomOrder(shuffleQuestions(publishedQuestions).map((question) => question.id));
    setQuestionIndex(0);
    setSelected(null);
    setAnswered(false);
    setActiveFeedback(null);
    setShuffleKey((key) => key + 1);
  }, [mode, publishedQuestions]);

  const question = poolQuestions[questionIndex % Math.max(poolQuestions.length, 1)];
  const shuffledQuestion = useMemo(() => {
    if (!question) return null;
    void shuffleKey;
    const shuffled = shuffleChoices(question);
    return {
      question: {
        ...question,
        choices: shuffled.choices,
        correctIndex: shuffled.correctIndex
      },
      displayToOriginal: shuffled.displayToOriginal
    };
  }, [question, shuffleKey]);
  const displayQuestion = shuffledQuestion?.question ?? null;
  const answerFeedback = useMemo(() => {
    if (!answered || selected === null || !question || !shuffledQuestion) return null;
    const isCorrect = selected === shuffledQuestion.question.correctIndex;
    const originalIndex = shuffledQuestion.displayToOriginal[selected];
    return buildAnswerFeedback(question, originalIndex, isCorrect);
  }, [answered, selected, question, shuffledQuestion]);
  const totalAnswerCount = Math.max(history.length, access?.answerCount ?? 0);
  const marketingConsented = access?.marketingConsented ?? false;
  const freeLimit = access?.freeLimit ?? trainingConfig.freeAnswerLimit;
  const canAnswerMore = marketingConsented || totalAnswerCount < freeLimit;
  const sessionAnswers = history.filter((answer) => poolQuestions.some((item) => item.id === answer.questionId));
  const correctCount = sessionAnswers.filter((answer) => answer.correct).length;
  const progress = Math.min(100, sessionAnswers.length * 10);
  const weakDomains = domains
    .map((item) => {
      const domainIds = new Set(publishedQuestions.filter((questionItem) => questionItem.domain === item).map((questionItem) => questionItem.id));
      const answers = history.filter((answer) => domainIds.has(answer.questionId));
      const rate = answers.length ? answers.filter((answer) => answer.correct).length / answers.length : 1;
      return { domain: item, rate, count: answers.length };
    })
    .sort((a, b) => a.rate - b.rate || b.count - a.count)
    .slice(0, 3);

  const selectMode = (nextMode: TrainingMode) => {
    setMode(nextMode);
    setQuestionIndex(0);
    setSelected(null);
    setAnswered(false);
    setActiveFeedback(null);
    setShuffleKey((key) => key + 1);
  };

  const choose = (index: number) => {
    if (answered || !question || !shuffledQuestion || !canAnswerMore) return;
    const isCorrect = index === shuffledQuestion.question.correctIndex;
    const nextHistory = [...history, { questionId: question.id, correct: isCorrect, answeredAt: new Date().toISOString() }];
    setSelected(index);
    setAnswered(true);
    window.setTimeout(() => {
      if (questionTextRef.current) scrollToElementTop(questionTextRef.current, ANSWER_SCROLL_DURATION_MS);
    }, ANSWER_SCROLL_DELAY_MS);
    setHistory(nextHistory);
    window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(nextHistory));
    void fetch("/api/training/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, correct: isCorrect, mode })
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await fetch("/api/training/access").then((r) => r.json())) as TrainingAccess;
        setAccess(payload);
      })
      .catch(() => null);
  };

  const next = () => {
    setSelected(null);
    setAnswered(false);
    setActiveFeedback(null);
    setShuffleKey((key) => key + 1);
    setQuestionIndex((value) => value + 1);
    requestAnimationFrame(() => {
      questionTopRef.current?.scrollIntoView({ block: "start" });
    });
  };

  if (!questionsLoaded) {
    return (
      <>
        <SiteHeader />
        <main className="page-container py-16 text-center">
          <p className="font-bold text-[var(--color-ink-soft)]">問題を読み込んでいます…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="page-container py-8">
        <div className="grid gap-6 md:grid-cols-[1fr_380px] md:items-center">
          <div>
            <h1 className="text-4xl font-black">トレーニングページ</h1>
            <p className="mt-3 font-bold text-[var(--color-ink-soft)]">自分に合ったモードで、科学力を伸ばそう！</p>
          </div>
          <div className="relative min-h-32 rounded-3xl bg-[var(--color-primary-50)] p-5">
            <p className="max-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm font-bold leading-7">一緒にがんばろう！コツコツ続けることが力になるよ！</p>
            <Image src="/characters/riketokuo/sheet.png" alt="りけとくお" width={120} height={120} className="absolute bottom-0 right-2 h-28 w-28 rounded-full object-cover object-[68%_14%]" />
          </div>
        </div>
        <section className="mt-6">
          <h2 className="mb-4 text-xl font-black">トレーニングモードを選ぶ</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {modes.map(([Icon, value, title, text]) => (
              <button key={value} type="button" onClick={() => selectMode(value)} className="text-left">
                <AppCard className={mode === value ? "border-2 border-[var(--color-primary-700)] bg-[var(--color-primary-50)]" : ""}>
                  <div className="flex justify-between">
                    <Icon className="text-[var(--color-primary-700)]" />
                    {mode === value ? <CheckCircle2 className="text-[var(--color-primary-700)]" /> : null}
                  </div>
                  <h3 className="mt-4 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{text}</p>
                </AppCard>
              </button>
            ))}
          </div>
        </section>
        <AppCard className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge>分野</StatusBadge>
          <StatusBadge>回答数：{totalAnswerCount}</StatusBadge>
          {mode === "domain" ? (
            <select
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value as ScienceDomain);
                setQuestionIndex(0);
                setSelected(null);
                setAnswered(false);
                setActiveFeedback(null);
                setShuffleKey((key) => key + 1);
              }}
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold"
            >
              {domains.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          ) : (
            <StatusBadge tone="blue">全分野ランダム</StatusBadge>
          )}
        </AppCard>
        {!canAnswerMore ? (
          <AppCard className="mt-6 border-2 border-[var(--color-primary-700)] bg-[var(--color-primary-50)]">
            <h2 className="text-xl font-black">無料枠（{freeLimit}問）を使い切りました</h2>
            <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">
              トレーニングを続けるには、理系とーくからの案内メール（全分野科学検定のアップデート、科学イベント、理系とーくラボ等）の受信に同意してください。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {access?.isLoggedIn ? (
                <AppButton href="/mypage#marketing-consent">マイページでメルマガに同意する</AppButton>
              ) : (
                <>
                  <AppButton href="/signup">アカウント登録して同意する</AppButton>
                  <AppButton href="/login" variant="secondary">ログイン</AppButton>
                </>
              )}
            </div>
          </AppCard>
        ) : null}
        <div ref={questionTopRef} className="scroll-mt-4" />
        <section className="mt-6">
          {displayQuestion ? (
            <QuestionCard
              question={displayQuestion}
              index={questionIndex}
              selected={selected}
              answered={answered}
              feedback={answerFeedback}
              questionTextRef={questionTextRef}
              onChoiceClick={(choiceIndex) => choose(choiceIndex)}
              activeFeedback={activeFeedback}
              onFeedbackChange={setActiveFeedback}
            />
          ) : (
            <AppCard>
              <p className="leading-8 text-[var(--color-ink-soft)]">この条件で出題できる問題がまだありません。</p>
            </AppCard>
          )}
          {answered && canAnswerMore ? (
            <div className="mt-6 grid gap-3">
              <AppButton onClick={next}>次の問題へ</AppButton>
            </div>
          ) : null}
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <AppCard><h3 className="font-black">今日のトレーニング</h3><p className="mt-4 text-4xl font-black">{totalAnswerCount}問</p><ProgressBar value={marketingConsented ? progress : Math.min(100, (totalAnswerCount / freeLimit) * 100)} /></AppCard>
          <AppCard><h3 className="font-black">正答数</h3><p className="mt-4 text-4xl font-black">{correctCount} / {sessionAnswers.length}</p></AppCard>
          <AppCard><h3 className="font-black">苦手候補 TOP3</h3><div className="mt-3 grid gap-2">{weakDomains.map((item) => <p key={item.domain} className="flex items-center gap-2 text-sm font-bold"><DomainIcon domain={item.domain} size="sm" />{item.domain}</p>)}</div></AppCard>
          <AppCard><h3 className="font-black">りけとくおコーチから</h3><p className="mt-3 leading-8">間違えた問題ほど伸びしろだよ。解説を見て、もう一問いこう！</p></AppCard>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
