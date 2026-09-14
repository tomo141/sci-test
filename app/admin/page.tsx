import { BarChart3, ClipboardList, Download, Users } from "lucide-react";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDashboardData } from "@/src/lib/admin/dashboard";
import { getBankHealthData } from "@/src/lib/admin/bankHealth";
import { isAdminUser } from "@/src/lib/admin/role";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

const nav = ["ダッシュボード", "受験状況", "問題管理", "ユーザー管理", "お知らせ管理", "トレーニング管理", "ランキング管理", "メルマガ管理", "設定", "ログ管理"];

function NoAdminAccess() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page)] p-6">
      <AppCard className="max-w-xl text-center">
        <h1 className="text-3xl font-black">管理者権限がありません</h1>
        <p className="mt-4 leading-8 text-[var(--color-ink-soft)]">
          このページは管理者メールアドレスでログインしているユーザーのみ閲覧できます。
        </p>
        <AppButton href="/" className="mt-6">トップへ戻る</AppButton>
      </AppCard>
    </main>
  );
}

function PendingButton({ label }: { label: string }) {
  return (
    <button disabled className="mt-4 w-full min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-disabled)] px-4 py-3 text-sm font-bold text-[var(--color-muted)]">
      {label}（準備中）
    </button>
  );
}

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;
  const admin = supabase && userId
    ? await isAdminUser(
        supabase,
        userId,
        user.data.user?.email ?? (user.data.user?.user_metadata?.email as string | undefined)
      )
    : false;

  if (!admin) return <NoAdminAccess />;

  const dashboard = await getAdminDashboardData();
  const bankHealth = await getBankHealthData();
  const kpis = [
    ["受験開始数", `${dashboard.examStarts.toLocaleString()}人`, "実データ"],
    ["速報到達率", `${dashboard.completed10Rate}%`, "実データ"],
    ["50問到達率", `${dashboard.completed50Rate}%`, "実データ"],
    ["登録率", `${dashboard.signupRate}%`, "実データ"],
    ["メルマガ同意率", `${dashboard.marketingConsentRate}%`, "実データ"],
    ["トレーニング利用率", `${dashboard.trainingUsageRate}%`, "実データ"]
  ];
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-page)] p-5">
        <h1 className="mb-8 text-xl font-black">全分野科学検定 <span className="rounded bg-[var(--color-primary-700)] px-2 py-1 text-xs text-white">β版</span></h1>
        <nav className="grid gap-2">
          {nav.map((label, index) => (
            <button
              key={label}
              disabled={index !== 0}
              className={`rounded-xl px-4 py-3 text-left text-sm font-bold ${
                index === 0 ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]" : "text-[var(--color-muted)]"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span>{label}</span>
                {index !== 0 ? <StatusBadge tone="yellow">準備中</StatusBadge> : null}
              </span>
            </button>
          ))}
        </nav>
        <AppCard className="mt-8">
          <p className="font-black">りけとくおサポート</p>
          <p className="mt-2 text-sm leading-7">使い方や設定でお困りですか？</p>
          <PendingButton label="サポートを見る" />
        </AppCard>
      </aside>
      <section className="p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-black">管理画面</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">上部KPIは実データ、下段の一部グラフ・表はモック表示です。</p>
          </div>
          <button disabled className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-disabled)] px-4 py-3 font-bold text-[var(--color-muted)]">
            期間フィルター（準備中）
          </button>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map(([label, value, note]) => (
            <AppCard key={label}>
              <p className="text-sm font-bold text-[var(--color-muted)]">{label}</p>
              <p className="mt-5 text-3xl font-black">{value}</p>
              <p className="mt-4 text-sm font-bold text-[var(--color-success-700)]">{note}</p>
            </AppCard>
          ))}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <AppCard>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-black">分野別正答率</h3>
              <StatusBadge tone="yellow">モックデータ</StatusBadge>
            </div>
            {["数学 64.2", "物理 58.7", "化学 57.1", "生物 66.3", "情報・計算機科学 44.6"].map((x) => {
              const [name, v] = x.split(" ");
              return (
                <div key={x} className="mb-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{name}</span>
                    <span>{v}%</span>
                  </div>
                  <ProgressBar value={Number(v)} />
                </div>
              );
            })}
          </AppCard>
          <AppCard>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-xl font-black">回答数推移</h3>
              <StatusBadge tone="yellow">モックデータ</StatusBadge>
            </div>
            <div className="grid h-72 place-items-center rounded-2xl bg-[var(--color-primary-50)] text-center font-bold text-[var(--color-muted)]">
              <BarChart3 />
              受験開始数の折れ線グラフ（準備中）
            </div>
          </AppCard>
        </section>
        <AppCard className="mt-6 overflow-x-auto">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-black">問題バンク健全性</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {bankHealth.generatedAt ? `最終更新: ${bankHealth.generatedAt}` : "pnpm questions:gaps 実行後に表示されます"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="yellow">不足 {bankHealth.totalGap}</StatusBadge>
              <StatusBadge tone="yellow">未達 {bankHealth.belowTarget}/{bankHealth.totalSubdomains}</StatusBadge>
              <StatusBadge tone="green">達成 {bankHealth.complete}</StatusBadge>
            </div>
          </div>
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                {["大分野", "小分野", "現在", "目標", "不足", "L100-300", "L400-600", "L700-900", "公開済"].map((h) => (
                  <th key={h} className="border-b border-[var(--color-border)] p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bankHealth.worstRows.map((row) => (
                <tr key={`${row.domain}/${row.subdomain}`}>
                  <td className="border-b border-[var(--color-border)] p-3 font-bold">{row.domain}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.subdomain}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.current}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.target}</td>
                  <td className="border-b border-[var(--color-border)] p-3 font-black text-[var(--color-danger-700)]">{row.gap}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.levels["L100-300"] ?? 0}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.levels["L400-600"] ?? 0}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.levels["L700-900"] ?? 0}</td>
                  <td className="border-b border-[var(--color-border)] p-3">{row.statuses?.published ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
        <AppCard className="mt-6 overflow-x-auto">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">要改善の問題</h3>
            <div className="flex items-center gap-3">
              <StatusBadge tone="yellow">モックデータ</StatusBadge>
              <button disabled className="min-h-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-disabled)] px-4 py-3 text-sm font-bold text-[var(--color-muted)]">
                すべて見る（準備中）
              </button>
            </div>
          </div>
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-[var(--color-muted)]">
                {["問題ID", "分野", "問題タイトル", "正答率", "Bad重み", "Bad数", "状態", "最終報告日"].map((h) => (
                  <th key={h} className="border-b border-[var(--color-border)] p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Q-245678 化学 中和反応に関する計算問題 18.2 2.40 124", "Q-187654 物理 運動方程式の応用 21.5 1.95 98", "Q-312456 数学 確率の基本 22.3 1.80 87"].map((r) => {
                const c = r.split(" ");
                return (
                  <tr key={r}>
                    {c.map((x) => (
                      <td key={x} className="border-b border-[var(--color-border)] p-3">{x}</td>
                    ))}
                    <td className="border-b border-[var(--color-border)] p-3"><StatusBadge tone="yellow">要確認</StatusBadge></td>
                    <td className="border-b border-[var(--color-border)] p-3">2026/06/28</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </AppCard>
        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <AppCard>
            <ClipboardList className="text-[var(--color-primary-700)]" />
            <h3 className="mt-3 text-xl font-black">問題管理</h3>
            <PendingButton label="問題一覧" />
          </AppCard>
          <AppCard>
            <Download className="text-[var(--color-primary-700)]" />
            <h3 className="mt-3 text-xl font-black">データ出力</h3>
            <AppButton href="/api/admin/marketing-consents.csv" variant="secondary" className="mt-4 w-full">メルマガ同意者CSV</AppButton>
          </AppCard>
          <AppCard>
            <Users className="text-[var(--color-primary-700)]" />
            <h3 className="mt-3 text-xl font-black">ランキング状況</h3>
            <PendingButton label="ユーザーランキング" />
          </AppCard>
        </section>
      </section>
    </main>
  );
}
