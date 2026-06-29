import Image from "next/image";
import Link from "next/link";
import { BookOpen, Cloud, Eye, Lock, UserPlus } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { signupAction } from "@/app/auth/actions";
import { TurnstileBox } from "@/components/ui/TurnstileBox";
import { AnonymousSessionInput } from "@/components/auth/AnonymousSessionInput";

export default function SignupPage() {
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
          <form action={signupAction} className="grid gap-5">
            <AnonymousSessionInput />
            {[
              ["メールアドレス", "email", "email"],
              ["パスワード", "password", "password"],
              ["パスワード確認", "passwordConfirm", "password"],
              ["ニックネーム", "nickname", "text"]
            ].map(([label, name, type], i) => (
              <label key={label} className="grid gap-2 font-bold">
                {label}
                <div className="relative">
                  <input name={name} required className="h-14 w-full rounded-2xl border border-[var(--color-border)] px-4 focus:border-[var(--color-primary-700)]" placeholder={i === 0 ? "例）riketokuo@example.com" : i === 3 ? "ランキング等に表示される名前" : ""} type={type} />
                  {i === 1 || i === 2 ? <Eye className="absolute right-4 top-4 text-[var(--color-muted)]" size={20} /> : null}
                </div>
              </label>
            ))}
            <label className="flex gap-3 text-sm leading-7"><input name="terms" type="checkbox" required className="mt-1 h-5 w-5" />13歳未満の場合は保護者同意を得たうえで、利用規約およびプライバシーポリシーに同意します。</label>
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
