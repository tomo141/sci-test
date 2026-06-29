import Image from "next/image";
import { Download, Pencil, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreHistoryChart } from "@/components/charts/ScoreHistoryChart";

export default function MyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-container py-8">
        <h1 className="text-4xl font-black">マイページ</h1>
        <p className="mt-2 font-bold text-[var(--color-ink-soft)]">あなたの学びの記録や成長を確認できます。</p>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <AppCard className="flex flex-col gap-5 md:flex-row md:items-center">
            <Image src="/characters/tomoyoshi/sheet.png" alt="プロフィール画像" width={150} height={150} className="h-36 w-36 rounded-full object-cover object-[50%_12%]" />
            <div className="flex-1">
              <h2 className="text-2xl font-black">みずしま こういち <Pencil className="inline text-[var(--color-primary-700)]" size={18} /></h2>
              <p className="mt-2 font-bold text-[var(--color-muted)]">理系ビギナー</p>
              <div className="mt-5"><ScoreDisplay score={763} /></div>
              <div className="mt-5 flex gap-3"><AppButton variant="secondary"><Pencil />プロフィール編集</AppButton><AppButton><Download />結果を保存</AppButton></div>
            </div>
          </AppCard>
          <AppCard><h2 className="text-xl font-black">スコア履歴</h2><ScoreHistoryChart /></AppCard>
        </section>
        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <AppCard><h2 className="mb-3 text-xl font-black">最近の検定履歴</h2>{["2026/6/12 763", "2026/6/5 710", "2026/5/29 730"].map((x) => <p key={x} className="border-b border-[var(--color-border)] py-3 font-bold">{x} / 1000</p>)}</AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">獲得バッジ</h2><div className="flex flex-wrap gap-3">{["はじめの一歩", "連続チャレンジ", "スコア700達成", "理系の扉を開く"].map((x) => <StatusBadge key={x} tone="yellow">{x}</StatusBadge>)}</div><ProgressBar value={47} label="15 / 32" /></AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">解放した称号</h2>{["理系ビギナー", "探究の芽生え", "実験マスター見習い"].map((x) => <p key={x} className="mb-2 rounded-xl bg-[var(--color-primary-50)] p-3 font-bold">{x}</p>)}</AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">トレーニング進捗</h2><p className="text-4xl font-black text-[var(--color-primary-800)]">12%</p><ProgressBar value={12} /></AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">メルマガ同意状況</h2><StatusBadge tone="green">同意済み</StatusBadge><p className="mt-3 text-sm leading-7">最新情報や科学イベント情報をお届けします。</p></AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">トレーニング解放状況</h2><p className="text-4xl font-black text-[var(--color-primary-800)]">24 / 200</p></AppCard>
        </section>
        <AppCard className="mt-6"><h2 className="mb-4 text-xl font-black">おすすめの次のアクション</h2><div className="grid gap-4 md:grid-cols-3"><AppButton href="/exam">腕試しを続ける</AppButton><AppButton href="/training" variant="secondary">苦手補強をする</AppButton><AppButton href="/ranking" variant="secondary"><Trophy />ランキングを見る</AppButton></div></AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
