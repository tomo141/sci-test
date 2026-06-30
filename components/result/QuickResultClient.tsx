"use client";

import { useMemo } from "react";
import { Share2, UserPlus } from "lucide-react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RadarScoreChart } from "@/components/charts/RadarScoreChart";
import { SaveResultButton } from "@/components/exam/SaveResultButton";
import { useExamAnswers } from "@/components/exam/useExamAnswers";
import { domains } from "@/src/lib/data/taxonomy";
import { examConfig } from "@/src/lib/exam/config";
import { estimateFromAnswers } from "@/src/lib/scoring/estimate";

function percent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function accuracyTone(label: string): "yellow" | "blue" | "green" {
  if (label === "安定") return "green";
  if (label === "高い") return "blue";
  return "yellow";
}

function resultSubtitle(answerCount: number) {
  if (answerCount === examConfig.quickResultThreshold) {
    return "10問到達時点の推定結果です。50問まで進めると科学力カルテが完成します。";
  }
  return `${answerCount}問時点の推定結果です。50問まで進めると科学力カルテが完成します。`;
}

export function QuickResultClient() {
  const { answers, loaded, source } = useExamAnswers();

  const estimate = useMemo(() => estimateFromAnswers(answers), [answers]);
  const correctCount = answers.filter((answer) => answer.correct).length;
  const correctRate = answers.length ? correctCount / answers.length : 0;
  const domainData = domains.map((name) => ({ name, score: estimate.domains[name] }));
  const canViewQuickResult = examConfig.canViewQuickResult(answers.length);
  const canViewKarte = examConfig.canViewKarte(answers.length);

  if (!loaded) {
    return (
      <AppCard className="mt-6">
        <h2 className="text-2xl font-black">速報を読み込んでいます</h2>
        <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">
          {source === "database" ? "保存済みの受験データを表示しています。" : "この端末に保存された回答履歴を確認しています。"}
        </p>
      </AppCard>
    );
  }

  if (!answers.length) {
    return (
      <AppCard className="mt-6">
        <h2 className="text-2xl font-black">まだ速報を表示できる回答がありません</h2>
        <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">腕試しを始めると、10問回答した時点で推定結果を確認できます。</p>
        <AppButton href="/exam" className="mt-5">腕試しを始める</AppButton>
      </AppCard>
    );
  }

  if (canViewKarte) {
    return (
      <AppCard className="mt-6">
        <h2 className="text-2xl font-black">50問完走済みです</h2>
        <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">全問回答が完了しているため、科学力カルテで結果を確認できます。</p>
        <AppButton href="/karte" className="mt-5">科学力カルテを見る</AppButton>
      </AppCard>
    );
  }

  if (!canViewQuickResult) {
    return (
      <>
        <p className="mt-2 font-bold text-[var(--color-ink-soft)]">
          10問到達後に腕試し速報を表示します。50問まで進めると科学力カルテが完成します。
        </p>
        <AppCard className="mt-6">
          <h2 className="text-2xl font-black">速報は10問到達後に表示されます</h2>
          <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">
            現在 {answers.length} 問回答済みです。あと {examConfig.quickResultThreshold - answers.length} 問で腕試し速報が確認できます。
          </p>
          <AppButton href="/exam" className="mt-5">腕試しを続ける</AppButton>
        </AppCard>
      </>
    );
  }

  return (
    <>
      <p className="mt-2 font-bold text-[var(--color-ink-soft)]">{resultSubtitle(answers.length)}</p>
      <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <AppCard>
          <StatusBadge tone={accuracyTone(estimate.accuracyLabel)}>診断精度：{estimate.accuracyLabel}</StatusBadge>
          <div className="mt-5">
            <ScoreDisplay score={estimate.overall} />
          </div>
          <p className="mt-4 text-2xl font-black text-[var(--color-primary-800)]">
            推定スコア：{estimate.scoreRange[0]} 〜 {estimate.scoreRange[1]}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-muted)]">正答数</p>
              <p className="text-3xl font-black">
                {correctCount} / {answers.length}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-muted)]">正答率</p>
              <p className="text-3xl font-black">{percent(correctRate * 100)}</p>
            </div>
          </div>
        </AppCard>
        <AppCard>
          <h2 className="text-xl font-black">10分野レーダー</h2>
          <RadarScoreChart data={domainData} label="10分野レーダーチャート" />
        </AppCard>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <AppCard>
          <UserPlus className="mb-3 text-[var(--color-primary-700)]" />
          <h2 className="text-lg font-black">結果を保存する</h2>
          <p className="mt-2 text-sm leading-7">アカウント登録で今回の速報を保存できます。</p>
          <div className="mt-4">
            <SaveResultButton
              score={estimate.overall}
              scoreLow={estimate.scoreRange[0]}
              scoreHigh={estimate.scoreRange[1]}
              answerCount={answers.length}
            />
          </div>
        </AppCard>
        <AppCard>
          <Share2 className="mb-3 text-[var(--color-primary-700)]" />
          <h2 className="text-lg font-black">SNSシェアカード</h2>
          <p className="mt-2 text-sm leading-7">個人情報を含めず、推定スコアと得意分野だけを共有します。</p>
        </AppCard>
        <AppCard>
          <h2 className="text-lg font-black">速報ランキング</h2>
          <p className="mt-2 text-sm leading-7">10〜49問の速報ランキングに参加できます。</p>
          <AppButton href="/ranking" variant="secondary" className="mt-4">
            ランキングを見る
          </AppButton>
        </AppCard>
      </section>
      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <AppButton href="/exam">次の問題へ</AppButton>
        <AppButton href="/karte" variant="secondary">
          終了してカルテを見る
        </AppButton>
        <AppButton href="/signup" variant="secondary">
          アカウント登録して保存
        </AppButton>
      </div>
    </>
  );
}
