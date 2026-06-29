import { Share2, UserPlus } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RadarScoreChart } from "@/components/charts/RadarScoreChart";
import { domains } from "@/src/lib/data/taxonomy";

export default function ResultPage() {
  const chart = domains.map((name, index) => ({ name, score: 520 + ((index * 43) % 210) }));
  return (
    <>
      <SiteHeader />
      <main className="page-container py-8">
        <h1 className="text-3xl font-black md:text-4xl">腕試し速報</h1>
        <p className="mt-2 font-bold text-[var(--color-ink-soft)]">10問到達時点の推定結果です。50問まで進めると科学力カルテが完成します。</p>
        <section className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <AppCard>
            <StatusBadge tone="yellow">診断精度：速報</StatusBadge>
            <div className="mt-5"><ScoreDisplay score={713} /></div>
            <p className="mt-4 text-2xl font-black text-[var(--color-primary-800)]">推定スコア：610 〜 790</p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div><p className="text-sm font-bold text-[var(--color-muted)]">正答数</p><p className="text-3xl font-black">7 / 10</p></div>
              <div><p className="text-sm font-bold text-[var(--color-muted)]">正答率</p><p className="text-3xl font-black">70%</p></div>
            </div>
          </AppCard>
          <AppCard>
            <h2 className="text-xl font-black">10分野レーダー</h2>
            <RadarScoreChart data={chart} label="10分野レーダーチャート" />
          </AppCard>
        </section>
        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <AppCard><UserPlus className="mb-3 text-[var(--color-primary-700)]" /><h2 className="text-lg font-black">結果を保存する</h2><p className="mt-2 text-sm leading-7">アカウント登録で今回の速報を保存できます。</p></AppCard>
          <AppCard><Share2 className="mb-3 text-[var(--color-primary-700)]" /><h2 className="text-lg font-black">SNSシェアカード</h2><p className="mt-2 text-sm leading-7">個人情報を含めず、推定スコアと得意分野だけを共有します。</p></AppCard>
          <AppCard><h2 className="text-lg font-black">速報ランキング</h2><p className="mt-2 text-sm leading-7">10〜49問の速報ランキングに参加できます。</p></AppCard>
        </section>
        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <AppButton href="/exam">次の問題へ</AppButton>
          <AppButton href="/karte" variant="secondary">終了してカルテを見る</AppButton>
          <AppButton href="/signup" variant="secondary">アカウント登録して保存</AppButton>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
