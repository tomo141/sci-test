import Image from "next/image";
import { BookOpen, Crown, Star, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RadarScoreChart } from "@/components/charts/RadarScoreChart";
import { domains } from "@/src/lib/data/taxonomy";
import { SaveResultButton } from "@/components/exam/SaveResultButton";
import { ReviewListSection } from "@/components/karte/ReviewListSection";

export default function KartePage() {
  const domainData = domains.map((name, index) => ({ name, score: [820, 780, 760, 720, 680, 740, 700, 800, 660, 640][index] }));
  return (
    <>
      <SiteHeader />
      <main className="page-container py-8">
        <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <p className="text-sm font-black text-[var(--color-primary-700)]">腕試しカルテ ＞ 結果</p>
            <h1 className="mt-4 text-3xl font-black md:text-5xl">あなたの科学力カルテ</h1>
            <p className="mt-3 font-bold text-[var(--color-ink-soft)]">全50問の腕試しが完了しました！あなたの科学力を診断したよ。</p>
          </div>
          <div className="relative min-h-32 rounded-3xl bg-[var(--color-primary-50)] p-5">
            <p className="max-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm font-bold leading-7">すばらしい挑戦だったよ！知ることは、未来をつくる力になるよ！</p>
            <Image src="/characters/riketokuo/sheet.png" alt="りけとくお" width={140} height={140} className="absolute bottom-0 right-2 h-32 w-32 rounded-full object-cover object-[68%_14%]" />
          </div>
        </div>
        <AppCard className="mt-6 grid gap-5 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div><h2 className="mb-3 font-black">総合スコア</h2><ScoreDisplay score={763} /></div>
          {[
            ["総合ランク", "A", "偏差値 62.3"],
            ["回答数", "50", "/ 50問"],
            ["正答率", "76.3%", "(38 / 50問)"],
            ["称号", "修士基礎相当", "科学力ランク"]
          ].map(([label, value, note]) => (
            <div key={label} className="rounded-2xl border border-[var(--color-border)] p-4 text-center">
              <p className="text-sm font-bold text-[var(--color-muted)]">{label}</p>
              <p className="mt-2 text-2xl font-black text-[var(--color-primary-800)]">{value}</p>
              <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">{note}</p>
            </div>
          ))}
        </AppCard>
        <section className="mt-6">
          <AppCard><h2 className="text-xl font-black">10の科学分野バランス</h2><RadarScoreChart data={domainData} label="10の科学分野バランス" /></AppCard>
        </section>
        <section className="mt-6">
          <ReviewListSection />
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <AppCard>
            <h2 className="mb-4 text-xl font-black">分野別スコア詳細</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {domainData.map((item) => <div key={item.name}><div className="flex justify-between text-sm font-bold"><span>{item.name}</span><span>{Math.round(item.score / 10)} / 100</span></div><ProgressBar value={item.score / 10} /></div>)}
            </div>
          </AppCard>
          <div className="grid gap-6">
            <AppCard><h2 className="mb-3 text-xl font-black">得意分野 TOP3</h2>{["数学 82点", "情報・計算機科学 80点", "物理 78点"].map((x, i) => <p key={x} className="mb-2 rounded-xl bg-[var(--color-primary-50)] p-3 font-bold">{i + 1}. {x}</p>)}</AppCard>
            <AppCard><h2 className="mb-3 text-xl font-black">獲得バッジ</h2><div className="flex flex-wrap gap-3">{["挑戦者", "探究心", "50問達成", "バランス型", "未来をつくる人"].map((x) => <StatusBadge key={x} tone="yellow"><Star size={14} />{x}</StatusBadge>)}</div></AppCard>
          </div>
        </section>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <AppButton href="/training"><BookOpen />トレーニングページへ</AppButton>
          <SaveResultButton score={763} scoreLow={735} scoreHigh={790} answerCount={50} />
          <AppButton href="/ranking" variant="secondary"><Trophy />ランキングを見る</AppButton>
        </div>
        <p className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4 text-center text-sm font-bold text-[var(--color-primary-900)]">
          本スコアは全分野科学検定独自の推定基準です。学位の保有、採用、進学、資格等を保証・証明するものではありません。
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
