import Image from "next/image";
import Link from "next/link";
import { BookOpen, Cloud, Lock, UserPlus } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AuthFormMessage } from "@/components/auth/AuthFormMessage";
import { signupAction } from "@/app/auth/actions";
import { TurnstileBox } from "@/components/ui/TurnstileBox";
import { AnonymousSessionInput } from "@/components/auth/AnonymousSessionInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新規登録",
  description: "全分野科学検定 β版のアカウントを作成して、受験結果やトレーニング履歴を保存できます。",
  alternates: {
    canonical: "/signup"
  },
  openGraph: {
    title: "新規登録 | 全分野科学検定 β版",
    description: "受験結果やトレーニング履歴を保存できるアカウントを作成します.",
    url: "/signup"
  }
};

type Props = {
  searchParams: Promise<{ error?: string; demo?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container grid gap-8 py-10 lg:grid-cols-2">
        <AppCard className="relative overflow-hidden">
          <h1 className="text-3xl font-black">ようこそ！<br />全分野科学検定へ</h1>
          <p className="mt-5 max-w-md font-bold leading-8 text-[var(--color-ink-soft)]">アカウントを作成すると、あなたの学びがもっと便利に、もっと楽しくなります。</p>
          <div className="relative mt-6 h-72 overflow-hidden rounded-3xl bg-[var(--color-primary-50)]">
            <Image src="/characters/riketokuo/sheet.png" alt="りけとくお" fill className="object-cover object-[66%_12%]" />
          </div>
          <div className="mt-6 grid gap-4">
            {[[Cloud, "結果を保存"], [BookOpen, "50問カルテを完成"], [Lock, "トレーニングページを解放"]].map(([Icon, text]) => (
              <div key={text as string} className="flex items-center gap-4 rounded-2xl bg-[var(--color-primary-50)] p-4">
                <Icon className="text-[var(--color-primary-700)]" />
                <p className="font-black">{text as string}</p>
              </div>
            ))}
          </div>
        </AppCard>
        <AppCard>
          <div className="mb-6 flex items-center gap-3">
            <UserPlus className="text-[var(--color-primary-700)]" />
            <div>
              <h2 className="text-2xl font-black">アカウントを作成</h2>
              <p className="text-sm text-[var(--color-muted)]">すでにお持ちの方は <Link className="font-bold text-[var(--color-primary-700)]" href="/login">ログイン</Link></p>
            </div>
          </div>
          <AuthFormMessage variant="signup" error={params.error} demo={params.demo} />
          <form action={signupAction} className="mt-6 grid gap-5">
            <AnonymousSessionInput />
            <label className="grid gap-2 font-bold">
              メールアドレス
              <input name="email" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4 invalid:[&:not(:placeholder-shown)]:border-red-400" type="email" placeholder="例）riketokuo@example.com" />
              <span className="text-xs font-bold text-[var(--color-muted)]">メールを受け取れるアドレスを入力してください。</span>
            </label>
            <PasswordInput name="password" label="パスワード" hint="パスワードは8文字以上で入力してください。" minLength={8} />
            <PasswordInput name="passwordConfirm" label="パスワード確認" hint="パスワードは8文字以上で入力してください。" minLength={8} />
            <label className="grid gap-2 font-bold">
              ニックネーム
              <input name="nickname" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4 focus:border-[var(--color-primary-700)]" placeholder="ランキング等に表示される名前" type="text" />
              <span className="text-xs font-bold text-[var(--color-muted)]">ランキングに表示される公開名です。</span>
            </label>
            <label className="flex gap-3 text-sm leading-7"><input name="terms" type="checkbox" required className="mt-1 h-5 w-5" />利用規約およびプライバシーポリシーに同意します。13歳未満の場合は保護者の同意を得ています。</label>
            <label className="flex gap-3 text-sm leading-7"><input name="marketingConsent" type="checkbox" className="mt-1 h-5 w-5" />理系とーくから、全分野科学検定のアップデート、科学イベント、理系とーくラボに関する情報を受け取る。</label>
            <TurnstileBox />
            <AppButton type="submit">新規登録</AppButton>
            <button disabled className="min-h-12 rounded-2xl bg-[var(--color-disabled)] px-4 font-bold text-[var(--color-muted)]">Googleで登録（準備中）</button>
          </form>
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
