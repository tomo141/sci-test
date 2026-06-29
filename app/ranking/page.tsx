import { Crown, Trophy } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { domains } from "@/src/lib/data/taxonomy";

const rows = ["はやかわ ゆい", "みずしま こういち", "おかもと たかし", "さとう あやか", "たなか りょう", "いとう まなみ", "やまだ こうき", "ふじた みお", "なかむら しんや", "おおた ひより"].map((name, i) => ({
  rank: i + 1,
  name,
  score: [956, 892, 881, 846, 823, 802, 791, 773, 761, 742][i],
  answers: 248 - i * 9,
  accuracy: `${(96.2 - i * 0.8).toFixed(1)}%`,
  title: ["科学マスター", "理系エース", "探究リーダー", "努力の星"][i % 4]
}));

export default function RankingPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-8">
        <h1 className="flex items-center gap-3 text-4xl font-black"><Trophy className="text-[var(--color-accent-yellow-600)]" />ランキング</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section>
            <div className="mb-5 flex flex-wrap gap-3">{["24時間", "7日間", "速報", "カルテ", "総合", "分野別"].map((x, i) => <StatusBadge key={x} tone={i === 0 || i === 4 ? "blue" : "yellow"}>{x}</StatusBadge>)}</div>
            <AppCard className="mb-6 grid gap-4 md:grid-cols-3 md:items-end">
              {rows.slice(0, 3).map((row) => (
                <div key={row.name} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-5 text-center">
                  <Crown className="mx-auto text-[var(--color-accent-yellow-600)]" />
                  <p className="mt-2 text-lg font-black">{row.rank}位 {row.name}</p>
                  <p className="mt-2 text-4xl font-black text-[var(--color-primary-700)]">{row.score}</p>
                </div>
              ))}
            </AppCard>
            <AppCard className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead><tr className="text-left text-[var(--color-muted)]">{["順位", "ニックネーム", "最新推定スコア", "回答数", "診断精度", "称号"].map((h) => <th key={h} className="border-b border-[var(--color-border)] p-3">{h}</th>)}</tr></thead>
                <tbody>{rows.map((row) => <tr key={row.name}><td className="border-b border-[var(--color-border)] p-3 font-black">{row.rank}</td><td className="border-b border-[var(--color-border)] p-3 font-bold">{row.name}</td><td className="border-b border-[var(--color-border)] p-3 text-right text-xl font-black text-[var(--color-primary-700)]">{row.score}</td><td className="border-b border-[var(--color-border)] p-3">{row.answers}</td><td className="border-b border-[var(--color-border)] p-3">{row.accuracy}</td><td className="border-b border-[var(--color-border)] p-3"><StatusBadge tone="yellow">{row.title}</StatusBadge></td></tr>)}</tbody>
              </table>
            </AppCard>
          </section>
          <aside className="grid gap-5">
            <AppCard><h2 className="mb-4 text-xl font-black">分野選択</h2><div className="grid grid-cols-2 gap-2">{["総合", ...domains].map((d) => <button key={d} className="rounded-xl border border-[var(--color-border)] p-3 text-sm font-bold">{d}</button>)}</div></AppCard>
            <AppCard><h2 className="text-xl font-black">あなたの順位</h2><p className="mt-4 text-5xl font-black text-[var(--color-primary-800)]">12位</p><p className="mt-2 font-bold">最新推定スコア 713</p><AppButton href="/karte" className="mt-5 w-full">カルテで詳細を見る</AppButton></AppCard>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
