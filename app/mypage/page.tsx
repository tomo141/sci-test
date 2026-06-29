import Image from "next/image";
import { Download, Pencil, Trophy } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreHistoryChart } from "@/components/charts/ScoreHistoryChart";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { rankTitle } from "@/src/lib/scoring/rank";
import { MyPageLocalSummary } from "@/components/profile/MyPageLocalSummary";
import { updateProfileAction } from "@/app/auth/actions";

type ScoreHistoryRow = {
  score: number;
  answer_count: number;
  created_at: string;
};

type EducationProfileRow = {
  highest_education: string | null;
  specialty: string | null;
};

export default async function MyPage() {
  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;

  const [{ data: profile }, { data: education }, { data: histories }] = userId && supabase
    ? await Promise.all([
        supabase.from("profiles").select("nickname, full_name, training_unlocked_at, marketing_consent").eq("id", userId).maybeSingle(),
        supabase.from("education_profiles").select("highest_education, specialty").eq("user_id", userId).maybeSingle(),
        supabase.from("score_history").select("score, answer_count, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10)
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const scoreHistory = ((histories || []) as ScoreHistoryRow[]).map((row) => ({
    date: new Date(row.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
    score: Math.round(Number(row.score))
  })).reverse();
  const latest = ((histories || []) as ScoreHistoryRow[])[0];
  const latestScore = latest ? Math.round(Number(latest.score)) : null;
  const answerCount = latest ? Number(latest.answer_count) : 0;

  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-8">
        <h1 className="text-4xl font-black">マイページ</h1>
        <p className="mt-2 font-bold text-[var(--color-ink-soft)]">あなたの学びの記録や成長を確認できます。</p>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <AppCard className="flex flex-col gap-5 md:flex-row md:items-center">
            <Image src="/characters/tomoyoshi/sheet.png" alt="プロフィール画像" width={150} height={150} className="h-36 w-36 rounded-full object-cover object-[50%_12%]" />
            <div className="flex-1">
              <h2 className="text-2xl font-black">{profile?.nickname || "ゲスト"} <Pencil className="inline text-[var(--color-primary-700)]" size={18} /></h2>
              <p className="mt-2 font-bold text-[var(--color-muted)]">{latestScore ? rankTitle(latestScore) : "結果未保存"}</p>
              {latestScore ? <div className="mt-5"><ScoreDisplay score={latestScore} /></div> : <MyPageLocalSummary />}
              <div className="mt-5 flex flex-wrap gap-3"><AppButton href="#profile-edit" variant="secondary"><Pencil />プロフィール編集</AppButton><AppButton href="/karte"><Download />結果を保存</AppButton></div>
            </div>
          </AppCard>
          <AppCard><h2 className="text-xl font-black">スコア履歴</h2><ScoreHistoryChart data={scoreHistory} /></AppCard>
        </section>
        <AppCard id="profile-edit" className="mt-6">
          <h2 className="text-xl font-black">プロフィール編集</h2>
          <form action={updateProfileAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">
              ニックネーム
              <input name="nickname" required defaultValue={profile?.nickname || ""} className="h-12 rounded-2xl border border-[var(--color-border)] px-4 focus:border-[var(--color-primary-700)]" placeholder="ランキング等に表示される名前" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              本名（任意）
              <input name="fullName" defaultValue={profile?.full_name || ""} className="h-12 rounded-2xl border border-[var(--color-border)] px-4 focus:border-[var(--color-primary-700)]" placeholder="非公開" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              最終学歴（任意）
              <input name="highestEducation" defaultValue={(education as EducationProfileRow | null)?.highest_education || ""} className="h-12 rounded-2xl border border-[var(--color-border)] px-4 focus:border-[var(--color-primary-700)]" placeholder="例）大学卒、大学院修了など" />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              専門分野（任意）
              <input name="specialty" defaultValue={(education as EducationProfileRow | null)?.specialty || ""} className="h-12 rounded-2xl border border-[var(--color-border)] px-4 focus:border-[var(--color-primary-700)]" placeholder="例）化学、情報科学など" />
            </label>
            <div className="md:col-span-2">
              <AppButton type="submit">プロフィールを保存</AppButton>
            </div>
          </form>
        </AppCard>
        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <AppCard>
            <h2 className="mb-3 text-xl font-black">最近の検定履歴</h2>
            {histories?.length ? (histories as ScoreHistoryRow[]).slice(0, 3).map((row) => (
              <p key={row.created_at} className="border-b border-[var(--color-border)] py-3 font-bold">
                {new Date(row.created_at).toLocaleString("ja-JP")} {Math.round(Number(row.score))} / 1000
              </p>
            )) : <p className="leading-8 text-[var(--color-ink-soft)]">保存済みの検定履歴はまだありません。</p>}
          </AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">獲得バッジ</h2><div className="flex flex-wrap gap-3">{answerCount > 0 ? ["はじめの一歩", answerCount >= 50 ? "50問達成" : "挑戦中"].map((x) => <StatusBadge key={x} tone="yellow">{x}</StatusBadge>) : <p className="text-sm font-bold text-[var(--color-muted)]">結果保存後に表示されます。</p>}</div><ProgressBar value={Math.min(100, answerCount * 2)} label={`${Math.min(32, Math.floor(answerCount / 3))} / 32`} /></AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">解放した称号</h2>{latestScore ? [rankTitle(latestScore)].map((x) => <p key={x} className="mb-2 rounded-xl bg-[var(--color-primary-50)] p-3 font-bold">{x}</p>) : <p className="leading-8 text-[var(--color-ink-soft)]">スコア保存後に称号が解放されます。</p>}</AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">トレーニング進捗</h2><p className="text-4xl font-black text-[var(--color-primary-800)]">{Math.min(100, answerCount * 2)}%</p><ProgressBar value={Math.min(100, answerCount * 2)} /></AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">メルマガ同意状況</h2><StatusBadge tone={profile?.marketing_consent ? "green" : "yellow"}>{profile?.marketing_consent ? "同意済み" : "未同意"}</StatusBadge><p className="mt-3 text-sm leading-7">同意状況は登録時の設定に基づきます。</p></AppCard>
          <AppCard><h2 className="mb-3 text-xl font-black">トレーニング解放状況</h2><p className="text-4xl font-black text-[var(--color-primary-800)]">{profile?.training_unlocked_at ? "解放済み" : "未解放"}</p></AppCard>
        </section>
        <AppCard className="mt-6"><h2 className="mb-4 text-xl font-black">おすすめの次のアクション</h2><div className="grid gap-4 md:grid-cols-3"><AppButton href="/exam">腕試しを続ける</AppButton><AppButton href="/training" variant="secondary">苦手補強をする</AppButton><AppButton href="/ranking" variant="secondary"><Trophy />ランキングを見る</AppButton></div></AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
