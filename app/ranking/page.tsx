import { Suspense } from "react";
import { Crown, Trophy } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RankingDomainFilter } from "@/components/ranking/RankingDomainFilter";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { getPublicLeaderboard } from "@/src/lib/public/leaderboard";
import { scoringConfig } from "@/src/lib/scoring/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ domain?: string }>;
};

function isDomainFilter(value: string | undefined): value is ScienceDomain {
  return !!value && (domains as readonly string[]).includes(value);
}

export default async function RankingPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeDomain = isDomainFilter(params.domain) ? params.domain : "総合";
  const rows = await getPublicLeaderboard(100, activeDomain);
  const isDomainRanking = activeDomain !== "総合";
  const scoreLabel = isDomainRanking ? "分野スコア" : "最新推定スコア";
  const formatScore = (score: number) =>
    isDomainRanking ? `${score} / ${scoringConfig.domainMaxScore}` : String(score);

  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-8">
        <h1 className="flex items-center gap-3 text-4xl font-black"><Trophy className="text-[var(--color-accent-yellow-600)]" />ランキング</h1>
        <p className="mt-2 font-bold text-[var(--color-ink-soft)]">
          {activeDomain === "総合" ? "総合スコアのランキングです。" : `${activeDomain}分野のランキングです。`}
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section>
            {rows.length ? (
              <>
                <AppCard className="mb-6 grid gap-4 md:grid-cols-3 md:items-end">
                  {rows.slice(0, 3).map((row) => (
                    <div key={`${row.rank}-${row.nickname}`} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-5 text-center">
                      <Crown className="mx-auto text-[var(--color-accent-yellow-600)]" />
                      <p className="mt-2 text-lg font-black">{row.rank}位 {row.nickname}</p>
                      <p className="mt-2 text-4xl font-black text-[var(--color-primary-700)]">{formatScore(row.score)}</p>
                    </div>
                  ))}
                </AppCard>
                <AppCard className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-muted)]">
                        {["順位", "ニックネーム", scoreLabel, "回答数", "称号"].map((h) => (
                          <th key={h} className="border-b border-[var(--color-border)] p-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={`${row.rank}-${row.nickname}`}>
                          <td className="border-b border-[var(--color-border)] p-3 font-black">{row.rank}</td>
                          <td className="border-b border-[var(--color-border)] p-3 font-bold">{row.nickname}</td>
                          <td className="border-b border-[var(--color-border)] p-3 text-right text-xl font-black text-[var(--color-primary-700)]">{formatScore(row.score)}</td>
                          <td className="border-b border-[var(--color-border)] p-3">{row.answerCount}</td>
                          <td className="border-b border-[var(--color-border)] p-3"><StatusBadge tone="yellow">{row.title || "挑戦者"}</StatusBadge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AppCard>
              </>
            ) : (
              <AppCard>
                <h2 className="text-xl font-black">
                  {activeDomain === "総合" ? "ランキングはまだ集計前です" : `${activeDomain}のランキングはまだ集計前です`}
                </h2>
                <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">
                  保存済みの受験結果がランキング集計に反映されると、公開用ニックネーム・スコア・回答数・称号だけが表示されます。メールアドレスや本名は表示されません。
                </p>
                <AppButton href="/exam" className="mt-5">腕試しを始める</AppButton>
              </AppCard>
            )}
          </section>
          <aside className="grid gap-5">
            <Suspense fallback={<AppCard><p className="font-bold text-[var(--color-muted)]">分野を読み込み中...</p></AppCard>}>
              <RankingDomainFilter active={activeDomain} />
            </Suspense>
            <AppCard>
              <h2 className="text-xl font-black">あなたの順位</h2>
              <p className="mt-4 text-lg font-bold leading-8 text-[var(--color-ink-soft)]">ログインして結果を保存すると、自分の順位を確認できます。</p>
              <AppButton href="/karte" className="mt-5 w-full">カルテで詳細を見る</AppButton>
            </AppCard>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
