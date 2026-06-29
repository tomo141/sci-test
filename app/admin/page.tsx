import { BarChart3, ClipboardList, Download, Mail, Settings, Users } from "lucide-react";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDashboardData } from "@/src/lib/admin/dashboard";
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
  const kpis = [
    ["受験開始数", `${dashboard.examStarts.toLocaleString()}人`, "実データ"],
    ["10問到達率", `${dashboard.completed10Rate}%`, "実データ"],
    ["50問到達率", `${dashboard.completed50Rate}%`, "実データ"],
    ["登録率", `${dashboard.signupRate}%`, "実データ"],
    ["メルマガ同意率", `${dashboard.marketingConsentRate}%`, "実データ"],
    ["トレーニング利用率", `${dashboard.trainingUsageRate}%`, "実データ"]
  ];
  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r border-[var(--color-border)] bg-[var(--color-page)] p-5">
        <h1 className="mb-8 text-xl font-black">全分野科学検定 <span className="rounded bg-[var(--color-primary-700)] px-2 py-1 text-xs text-white">β版</span></h1>
        <nav className="grid gap-2">{nav.map((x, i) => <button key={x} className={`rounded-xl px-4 py-3 text-left text-sm font-bold ${i === 0 ? "bg-[var(--color-primary-100)] text-[var(--color-primary-700)]" : ""}`}>{x}</button>)}</nav>
        <AppCard className="mt-8"><p className="font-black">りけとくおサポート</p><p className="mt-2 text-sm leading-7">使い方や設定でお困りですか？</p><AppButton variant="secondary" className="mt-3 w-full">サポートを見る</AppButton></AppCard>
      </aside>
      <section className="p-5 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-black">管理画面</h2><p className="mt-2 text-sm text-[var(--color-muted)]">最終ログイン：2026/06/28 10:24</p></div>
          <button className="rounded-2xl border border-[var(--color-border)] px-4 py-3 font-bold">2026/06/22 〜 2026/06/28</button>
        </div>
        <section className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {kpis.map(([label, value, note]) => <AppCard key={label}><p className="text-sm font-bold text-[var(--color-muted)]">{label}</p><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-4 text-sm font-bold text-[var(--color-warning-700)]">{note}</p></AppCard>)}
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <AppCard><h3 className="mb-5 text-xl font-black">分野別正答率</h3>{["数学 64.2", "物理 58.7", "化学 57.1", "生物 66.3", "情報・計算機科学 44.6"].map((x) => { const [name, v] = x.split(" "); return <div key={x} className="mb-3"><div className="flex justify-between text-sm font-bold"><span>{name}</span><span>{v}%</span></div><ProgressBar value={Number(v)} /></div>; })}</AppCard>
          <AppCard><h3 className="mb-5 text-xl font-black">回答数推移</h3><div className="grid h-72 place-items-center rounded-2xl bg-[var(--color-primary-50)] text-center font-bold text-[var(--color-muted)]"><BarChart3 />受験開始数の折れ線グラフ</div></AppCard>
        </section>
        <AppCard className="mt-6 overflow-x-auto">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black">要改善の問題</h3><AppButton variant="secondary">すべて見る</AppButton></div>
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="text-left text-[var(--color-muted)]">{["問題ID", "分野", "問題タイトル", "正答率", "Bad重み", "Bad数", "状態", "最終報告日"].map((h) => <th key={h} className="border-b border-[var(--color-border)] p-3">{h}</th>)}</tr></thead>
            <tbody>{["Q-245678 化学 中和反応に関する計算問題 18.2 2.40 124", "Q-187654 物理 運動方程式の応用 21.5 1.95 98", "Q-312456 数学 確率の基本 22.3 1.80 87"].map((r) => { const c = r.split(" "); return <tr key={r}>{c.map((x) => <td key={x} className="border-b border-[var(--color-border)] p-3">{x}</td>)}<td className="border-b border-[var(--color-border)] p-3"><StatusBadge tone="yellow">要確認</StatusBadge></td><td className="border-b border-[var(--color-border)] p-3">2026/06/28</td></tr>; })}</tbody>
          </table>
        </AppCard>
        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <AppCard><ClipboardList className="text-[var(--color-primary-700)]" /><h3 className="mt-3 text-xl font-black">問題管理</h3><AppButton variant="secondary" className="mt-4 w-full">問題一覧</AppButton></AppCard>
          <AppCard><Download className="text-[var(--color-primary-700)]" /><h3 className="mt-3 text-xl font-black">データ出力</h3><AppButton href="/api/admin/marketing-consents.csv" variant="secondary" className="mt-4 w-full">メルマガ同意者CSV</AppButton></AppCard>
          <AppCard><Users className="text-[var(--color-primary-700)]" /><h3 className="mt-3 text-xl font-black">ランキング状況</h3><AppButton variant="secondary" className="mt-4 w-full">ユーザーランキング</AppButton></AppCard>
        </section>
      </section>
    </main>
  );
}
