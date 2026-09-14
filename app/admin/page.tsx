import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { getAdminDashboardData } from "@/src/lib/admin/dashboard";
import { getBankHealthData } from "@/src/lib/admin/bankHealth";
import { isAdminUser } from "@/src/lib/admin/role";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const user = (await supabase?.auth.getUser())?.data.user;
  if (!supabase || !user || !await isAdminUser(supabase, user.id, user.email)) {
    return <main className="mx-auto max-w-3xl p-8"><AppCard><h1 className="text-2xl font-black">管理者権限が必要です</h1><AppButton href="/login" className="mt-6">ログイン</AppButton></AppCard></main>;
  }
  const [dashboard, bank] = await Promise.all([getAdminDashboardData(), getBankHealthData()]);
  const metrics = dashboard.state === "available" ? [
    ["旧版の受験記録", dashboard.sessions], ["アカウント", dashboard.profiles],
    ["配信同意の記録", dashboard.consents], ["旧版の回答記録", dashboard.answers]
  ] as const : [];
  return <main className="mx-auto max-w-6xl p-5 md:p-8">
    <h1 className="text-3xl font-black">全分野科学検定の運営</h1>
    <p className="mt-3 text-sm text-[var(--color-muted)]">実DBの全期間の件数。確認時刻 {dashboard.observedAt}。受験記録の件数は人数ではありません。</p>
    {dashboard.state === "unavailable" ? <AppCard className="mt-6"><p role="alert">データを取得できませんでした。接続・権限を確認して再読み込みしてください。</p></AppCard> :
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value]) => <AppCard key={label}><p>{label}</p><p className="mt-3 text-3xl font-black">{value.toLocaleString()}件</p></AppCard>)}</section>}
    <AppCard className="mt-6">
      <h2 className="text-xl font-black">既存の問題バンク</h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">公開状態の問題を実DBから取得。出典欄の有無は内容の品質審査に合格したことを意味しません。</p>
      {bank.state === "unavailable" ? <p role="alert" className="mt-4">問題バンクを取得できませんでした。</p> :
        <table className="mt-4 w-full text-left text-sm"><thead><tr><th className="p-2">大分野</th><th>公開状態</th><th>出典欄あり</th></tr></thead><tbody>{bank.rows.map((row) => <tr key={row.domain} className="border-t"><td className="p-2">{row.domain}</td><td>{row.published}</td><td>{row.withSource}</td></tr>)}</tbody></table>}
    </AppCard>
    <AppButton href="/api/admin/marketing-consents.csv" variant="secondary" className="mt-6">配信同意者CSV</AppButton>
  </main>;
}
