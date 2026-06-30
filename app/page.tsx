import Image from "next/image";
import { Trophy } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { domains } from "@/src/lib/data/taxonomy";
import { getPublicLeaderboard } from "@/src/lib/public/leaderboard";
import { LocalScoreSummary } from "@/components/profile/LocalScoreSummary";
import { DomainIcon } from "@/components/ui/DomainIcon";

export default async function HomePage() {
  const top3 = await getPublicLeaderboard(3);

  return (
    <>
      <SiteHeaderWithAuth />
      <main>
        <section className="overflow-hidden bg-[radial-gradient(circle_at_82%_18%,rgba(68,132,255,0.14),transparent_32%),linear-gradient(180deg,#fff_0%,#f7faff_100%)] py-10 md:py-16">
          <div className="page-container grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-4 text-lg font-black text-[var(--color-primary-900)]">科学が好きなすべての人へ</p>
              <h1 className="text-4xl font-black leading-tight md:text-6xl">
                あなたの<span className="text-[var(--color-primary-700)]">科学力</span>を、<br />
                すべての分野で<span className="text-[var(--color-primary-700)]">可視化</span>する。
              </h1>
              <p className="mt-6 max-w-xl text-base font-bold leading-8 text-[var(--color-ink-soft)]">
                10の科学分野で、あなたの強みと伸ばすと面白い領域を診断。学びやキャリア、チームでの挑戦に役立てよう。
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <AppButton href="/exam" className="text-base">今すぐ腕試しを始める</AppButton>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <StatusBadge>ログインなしで受験開始</StatusBadge>
                <StatusBadge>10の科学分野</StatusBadge>
              </div>
            </div>
            <div className="relative min-h-[360px]">
              <div className="absolute inset-0 rounded-[32px] bg-[var(--color-primary-100)] opacity-70" />
              <Image src="/characters/riketokuo/sheet.png" alt="メインキャラクター りけとくお" fill priority className="object-cover object-[66%_12%]" />
            </div>
          </div>
        </section>

        <section className="page-container mt-10">
          <h2 className="mb-5 text-2xl font-black">10の科学分野</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {domains.map((domain) => (
              <AppCard key={domain} className="grid min-h-28 place-items-center text-center">
                <DomainIcon domain={domain} />
                <p className="mt-2 text-sm font-black">{domain}</p>
              </AppCard>
            ))}
          </div>
        </section>

        <section className="page-container mt-8 grid gap-6 lg:grid-cols-2">
          <AppCard>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-black"><Trophy className="text-[var(--color-accent-yellow-600)]" />ランキング TOP3</h2>
              <AppButton href="/ranking" variant="ghost">もっと見る</AppButton>
            </div>
            <div className="grid gap-4">
              {top3.length ? (
                top3.map((row, index) => (
                  <div key={`${row.rank}-${row.nickname}`} className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] p-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-accent-yellow-100)] font-black text-[var(--color-warning-700)]">{row.rank || index + 1}</span>
                      <p className="font-black">{row.nickname}</p>
                    </div>
                    <p className="text-2xl font-black text-[var(--color-primary-700)]">{row.score}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4">
                  <p className="font-black">ランキングはまだ集計前です</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-ink-soft)]">受験結果が保存されると、公開用ニックネームとスコアだけが表示されます。</p>
                </div>
              )}
            </div>
          </AppCard>
          <AppCard>
            <h2 className="mb-5 text-xl font-black">あなたの科学スコア</h2>
            <LocalScoreSummary />
            <p className="mt-5 leading-7 text-[var(--color-ink-soft)]">分野別のバランスから、得意分野と次に伸ばす領域を見つけられます。</p>
          </AppCard>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
