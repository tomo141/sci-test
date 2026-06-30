"use client";

import { useMemo } from "react";
import { BookOpen, Star, Trophy } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RadarScoreChart } from "@/components/charts/RadarScoreChart";
import { SaveResultButton } from "@/components/exam/SaveResultButton";
import { useExamAnswers } from "@/components/exam/useExamAnswers";
import { ReviewListSection } from "@/components/karte/ReviewListSection";
import { domains } from "@/src/lib/data/taxonomy";
import { scoringConfig } from "@/src/lib/scoring/config";
import { domainScorePercent } from "@/src/lib/scoring/domainScore";
import { estimateFromAnswers } from "@/src/lib/scoring/estimate";
import { rankTitle } from "@/src/lib/scoring/rank";

function percent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function topDomains(domainScores: { name: string; score: number }[]) {
  return [...domainScores].sort((a, b) => b.score - a.score).slice(0, 3);
}

export function KarteResultClient() {
  const { answers, loaded, source } = useExamAnswers();

  const estimate = useMemo(() => estimateFromAnswers(answers), [answers]);
  const correctCount = answers.filter((answer) => answer.correct).length;
  const correctRate = answers.length ? correctCount / answers.length : 0;
  const domainData = domains.map((name) => ({ name, score: estimate.domains[name] }));
  const bestDomains = topDomains(domainData);
  const title = rankTitle(estimate.overall);
  const badges = [
    answers.length > 0 ? "挑戦者" : null,
    answers.length >= 10 ? "10問到達" : null,
    answers.length >= 50 ? "50問達成" : null,
    correctRate >= 0.7 ? "安定正答" : null,
    new Set(answers.map((answer) => answer.domain)).size >= 10 ? "10分野踏破" : null
  ].filter(Boolean) as string[];

  if (!loaded) {
    return (
      <AppCard className="mt-6">
        <h2 className="text-2xl font-black">カルテを読み込んでいます</h2>
        <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">
          {source === "database" ? "保存済みの受験データを表示しています。" : "この端末に保存された回答履歴を確認しています。"}
        </p>
      </AppCard>
    );
  }

  if (loaded && !answers.length) {
    return (
      <AppCard className="mt-6">
        <h2 className="text-2xl font-black">まだカルテを作成できる回答がありません</h2>
        <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">腕試しを始めると、回答履歴からスコア・正答率・分野バランスを計算して表示します。</p>
        <AppButton href="/exam" className="mt-5">腕試しを始める</AppButton>
      </AppCard>
    );
  }

  return (
    <>
      <AppCard className="mt-6 grid gap-5 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div><h2 className="mb-3 font-black">総合スコア</h2><ScoreDisplay score={estimate.overall} /></div>
        {[
          ["総合ランク", title, "科学力ランク"],
          ["回答数", String(answers.length), "/ 50問"],
          ["正答率", percent(correctRate * 100), `(${correctCount} / ${answers.length}問)`],
          ["診断精度", estimate.accuracyLabel, `${estimate.scoreRange[0]}〜${estimate.scoreRange[1]}`]
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-[var(--color-border)] p-4 text-center">
            <p className="text-sm font-bold text-[var(--color-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-black text-[var(--color-primary-800)]">{value}</p>
            <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">{note}</p>
          </div>
        ))}
      </AppCard>
      <section className="mt-6">
        <AppCard><h2 className="text-xl font-black">10の科学分野バランス</h2><RadarScoreChart data={domainData} label="10の科学分野バランス" maxScore={scoringConfig.domainMaxScore} /></AppCard>
      </section>
      <section className="mt-6">
        <ReviewListSection />
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <AppCard>
          <h2 className="mb-4 text-xl font-black">分野別スコア詳細</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {domainData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm font-bold">
                  <span>{item.name}</span>
                  <span>
                    {item.score} / {scoringConfig.domainMaxScore}
                  </span>
                </div>
                <ProgressBar value={domainScorePercent(item.score)} />
              </div>
            ))}
          </div>
        </AppCard>
        <div className="grid gap-6">
          <AppCard><h2 className="mb-3 text-xl font-black">得意分野 TOP3</h2>{bestDomains.map((item, i) => <p key={item.name} className="mb-2 rounded-xl bg-[var(--color-primary-50)] p-3 font-bold">{i + 1}. {item.name} {item.score}点</p>)}</AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">獲得バッジ</h2><div className="flex flex-wrap gap-3">{badges.length ? badges.map((x) => <StatusBadge key={x} tone="yellow"><Star size={14} />{x}</StatusBadge>) : <p className="text-sm font-bold text-[var(--color-muted)]">回答を進めるとバッジが表示されます。</p>}</div></AppCard>
        </div>
      </section>
      <div className="mt-8 grid gap-3 md:grid-cols-3">
        <AppButton href="/training"><BookOpen />トレーニングページへ</AppButton>
        <SaveResultButton score={estimate.overall} scoreLow={estimate.scoreRange[0]} scoreHigh={estimate.scoreRange[1]} answerCount={answers.length} />
        <AppButton href="/ranking" variant="secondary"><Trophy />ランキングを見る</AppButton>
      </div>
    </>
  );
}
