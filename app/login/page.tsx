import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AuthFormMessage } from "@/components/auth/AuthFormMessage";
import { loginAction } from "@/app/auth/actions";
import { TurnstileBox } from "@/components/ui/TurnstileBox";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ログイン",
  description: "全分野科学検定 β版にログインして、保存した結果やマイページを確認できます。",
  alternates: {
    canonical: "/login"
  },
  openGraph: {
    title: "ログイン | 全分野科学検定 β版",
    description: "保存した結果やマイページを確認できます。",
    url: "/login"
  }
};

type Props = {
  searchParams: Promise<{ error?: string; demo?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container grid min-h-[70vh] place-items-center py-10">
        <AppCard className="w-full max-w-xl">
          <h1 className="text-3xl font-black">ログイン</h1>
          <p className="mt-2 text-[var(--color-muted)]">保存した結果やマイページを確認できます。</p>
          <div className="mt-4">
            <AuthFormMessage variant="login" error={params.error} demo={params.demo} />
          </div>
          <form action={loginAction} className="mt-6 grid gap-5">
            <label className="grid gap-2 font-bold">
              メールアドレス
              <input name="email" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4 invalid:[&:not(:placeholder-shown)]:border-red-400" type="email" placeholder="例）riketokuo@example.com" />
              <span className="text-xs font-bold text-[var(--color-muted)]">登録したメールアドレスを入力してください。</span>
            </label>
            <PasswordInput name="password" label="パスワード" hint="パスワードを入力してください。" />
            <TurnstileBox />
            <AppButton type="submit">ログイン</AppButton>
          </form>
          <div className="mt-5 flex justify-between text-sm font-bold text-[var(--color-primary-700)]">
            <Link href="/reset-password">パスワード再設定</Link>
            <Link href="/signup">新規登録</Link>
          </div>
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
