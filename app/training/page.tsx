"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Dice5, Target } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useQuestionBank } from "@/components/exam/useQuestionBank";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { trainingConfig } from "@/src/lib/training/config";
import { DomainIcon } from "@/components/ui/DomainIcon";

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

export default function TrainingPage() {
  const { questions, loaded: questionsLoaded } = useQuestionBank();
  const [mode, setMode] = useState<TrainingMode>("domain");
  const [domain, setDomain] = useState<ScienceDomain>("化学");
  const [history, setHistory] = useState<TrainingAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [randomOrder, setRandomOrder] = useState<string[]>([]);
  const [access, setAccess] = useState<TrainingAccess | null>(null);

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
  }, [mode, publishedQuestions]);

  const question = poolQuestions[questionIndex % Math.max(poolQuestions.length, 1)];
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
  };

  const choose = (index: number) => {
    if (answered || !question || !canAnswerMore) return;
    const isCorrect = index === question.correctIndex;
    const nextHistory = [...history, { questionId: question.id, correct: isCorrect, answeredAt: new Date().toISOString() }];
    setSelected(index);
    setAnswered(true);
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
    setQuestionIndex((value) => value + 1);
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
        <AppCard className="mt-6 flex flex-wrap items-center gap-3">
          <StatusBadge>{mode === "domain" ? `分野：${domain}` : "全分野ランダム"}</StatusBadge>
          <StatusBadge>回答数：{totalAnswerCount}</StatusBadge>
          {!marketingConsented ? (
            <StatusBadge tone="yellow">無料枠 {Math.min(totalAnswerCount, freeLimit)} / {freeLimit} 問</StatusBadge>
          ) : (
            <StatusBadge tone="green">メルマガ同意済み・制限なし</StatusBadge>
          )}
          {mode === "domain" ? (
            <select
              value={domain}
              onChange={(event) => {
                setDomain(event.target.value as ScienceDomain);
                setQuestionIndex(0);
                setSelected(null);
                setAnswered(false);
              }}
              className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold"
            >
              {domains.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          ) : null}
        </AppCard>
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
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <AppCard>
            <div className="mb-4 flex items-center gap-3">
              {mode === "domain" ? <DomainIcon domain={domain} size="sm" /> : null}
              <StatusBadge>{mode === "domain" ? domain : "全分野"}</StatusBadge>
              <span className="font-black">
                問題 {(questionIndex % Math.max(poolQuestions.length, 1)) + 1} / {poolQuestions.length}
              </span>
            </div>
            {question ? (
              <>
                <h2 className="text-xl font-black leading-9">{question.question}</h2>
                {question.choices.map((choice, index) => {
                  const isCorrect = answered && index === question.correctIndex;
                  const isWrong = answered && selected === index && !isCorrect;
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={!canAnswerMore && !answered}
                      onClick={() => choose(index)}
                      className={`mt-3 w-full rounded-2xl border p-4 text-left font-bold disabled:cursor-not-allowed disabled:opacity-50 ${isCorrect ? "border-green-500 bg-green-50 text-green-800" : isWrong ? "border-red-300 bg-red-50 text-red-800" : "border-[var(--color-border)] hover:bg-[var(--color-primary-50)]"}`}
                    >
                      {index + 1}. {choice}
                    </button>
                  );
                })}
                {answered && canAnswerMore ? <AppButton className="mt-5 w-full" onClick={next}>次の問題へ</AppButton> : null}
              </>
            ) : (
              <p className="leading-8 text-[var(--color-ink-soft)]">この条件で出題できる問題がまだありません。</p>
            )}
          </AppCard>
          <AppCard>
            <h2 className="text-xl font-black">解説</h2>
            {answered && question ? (
              <>
                <StatusBadge tone={selected === question.correctIndex ? "green" : "yellow"}>{selected === question.correctIndex ? "正解！" : "復習しよう"}</StatusBadge>
                <p className="mt-4 leading-8">{question.shortExplanation}</p>
                <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4">
                  <p className="font-black">ポイント</p>
                  <p className="mt-2 leading-8">{question.detailedExplanation}</p>
                </div>
              </>
            ) : (
              <p className="mt-4 leading-8 text-[var(--color-ink-soft)]">選択肢を選ぶと、ここに解説が表示されます。</p>
            )}
          </AppCard>
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
