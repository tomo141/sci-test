import { BarChart3, BookOpenCheck, Medal, Sparkles } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";

const points = [
  [BookOpenCheck, "10分野を横断して診断", "数学・物理・化学から人文社会科学まで、幅広い科学リテラシーを腕試しできます。"],
  [BarChart3, "スコアは成長の目安", "結果は独自基準による推定値です。強みや次に伸ばす領域を見つけるために使います。"],
  [Medal, "ランキングと称号", "保存した結果は公開用ニックネームでランキングに参加できます。個人情報は表示されません。"],
  [Sparkles, "β版として改善中", "問題の品質、難度推定、トレーニング機能を回答データに基づいて継続的に改善します。"]
];

export default function AboutPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <p className="font-black text-[var(--color-primary-700)]">検定について</p>
            <h1 className="mt-3 text-4xl font-black md:text-5xl">科学力を、学びの地図にする。</h1>
            <p className="mt-5 max-w-3xl leading-8 text-[var(--color-ink-soft)]">
              全分野科学検定 β版は、科学に関する問題への回答から、現在の理解度や分野ごとの傾向を可視化するサービスです。
              学位・資格・採用・進学を証明するものではなく、学びを楽しく続けるための診断とトレーニングを提供します。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <AppButton href="/exam">腕試しを始める</AppButton>
            </div>
          </div>
          <AppCard>
            <h2 className="text-xl font-black">表示されるもの</h2>
            <ul className="mt-4 grid gap-3 text-sm font-bold leading-7 text-[var(--color-ink-soft)]">
              <li>総合スコアと推定レンジ</li>
              <li>分野別バランス</li>
              <li>正答率と診断精度</li>
              <li>復習リストとトレーニング導線</li>
            </ul>
          </AppCard>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {points.map(([Icon, title, text]) => (
            <AppCard key={title as string}>
              <Icon className="text-[var(--color-primary-700)]" />
              <h2 className="mt-4 text-xl font-black">{title as string}</h2>
              <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">{text as string}</p>
            </AppCard>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
