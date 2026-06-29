import Image from "next/image";
import { BarChart3, CheckCircle2, Dice5, Target, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";

const modes = [
  [Target, "分野指定", "特定の分野を集中的にトレーニングする"],
  [BarChart3, "苦手補強", "苦手な分野を集中的に克服する"],
  [TrendingUp, "次の100点帯を目指す", "次のスコア帯に向けて効率的に学習する"],
  [Dice5, "全分野ランダム", "ランダムに出題される問題で総合力を鍛える"]
];

export default function TrainingPage() {
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
        <AppCard className="mt-6 flex flex-wrap gap-3">
          {["分野：化学", "難易度：標準"].map((x) => <StatusBadge key={x}>{x}</StatusBadge>)}
          <AppButton variant="secondary">設定を変更する</AppButton>
        </AppCard>
        <section className="mt-6">
          <h2 className="mb-4 text-xl font-black">トレーニングモードを選ぶ</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {modes.map(([Icon, title, text], i) => (
              <AppCard key={title as string} className={i === 0 ? "border-2 border-[var(--color-primary-700)] bg-[var(--color-primary-50)]" : ""}>
                <div className="flex justify-between"><Icon className="text-[var(--color-primary-700)]" />{i === 0 ? <CheckCircle2 className="text-[var(--color-primary-700)]" /> : null}</div>
                <h3 className="mt-4 font-black">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">{text as string}</p>
              </AppCard>
            ))}
          </div>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <AppCard>
            <div className="mb-4 flex items-center gap-3"><StatusBadge>化学</StatusBadge><span className="font-black">問題 4 / 10</span></div>
            <h2 className="text-xl font-black leading-9">水の電気分解について正しいものを1つ選びなさい。</h2>
            {["陰極から酸素が発生し、陽極から水素が発生する。", "陰極から水素が発生し、陽極から酸素が発生する。", "陰極・陽極のどちらからも水素が発生する。", "陰極・陽極のどちらからも酸素が発生する。"].map((x, i) => (
              <div key={x} className={`mt-3 rounded-2xl border p-4 font-bold ${i === 1 ? "border-[var(--color-primary-700)] bg-[var(--color-primary-100)]" : "border-[var(--color-border)]"}`}>{i + 1}. {x}</div>
            ))}
            <AppButton className="mt-5 w-full">次の問題へ</AppButton>
          </AppCard>
          <AppCard>
            <h2 className="text-xl font-black">解説</h2>
            <StatusBadge tone="green">正解！</StatusBadge>
            <p className="mt-4 leading-8">正解は2です。水の電気分解では、陰極で還元が起こって水素、陽極で酸化が起こって酸素が発生します。</p>
            <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4">
              <p className="font-black">ポイントまとめ</p>
              <ul className="mt-2 list-disc pl-5 leading-8">
                <li>陰極は電子を受け取り、還元が起こる</li>
                <li>陽極は電子を失い、酸化が起こる</li>
                <li>体積比は水素：酸素 = 2：1</li>
              </ul>
            </div>
          </AppCard>
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <AppCard><h3 className="font-black">今日のトレーニング</h3><p className="mt-4 text-4xl font-black">7 / 10問</p><ProgressBar value={70} /></AppCard>
          <AppCard><h3 className="font-black">苦手分野 TOP3</h3><p className="mt-3 leading-8">化学・反応と計算<br />物理・力学<br />生物・細胞と遺伝</p></AppCard>
          <AppCard><h3 className="font-black">おすすめの次トピック</h3><p className="mt-3 leading-8">化学：中和と塩<br />標準レベル</p></AppCard>
          <AppCard><h3 className="font-black">りけとくおコーチから</h3><p className="mt-3 leading-8">あと少しで目標達成！この調子でがんばろう！</p></AppCard>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
