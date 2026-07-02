import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AuthFormMessage } from "@/components/auth/AuthFormMessage";
import { resetPasswordAction } from "@/app/auth/actions";
import { TurnstileBox } from "@/components/ui/TurnstileBox";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "パスワード再設定",
  description: "全分野科学検定 β版のパスワード再設定メールを送信します。",
  alternates: {
    canonical: "/reset-password"
  },
  openGraph: {
    title: "パスワード再設定 | 全分野科学検定 β版",
    description: "登録メールアドレス宛に再設定リンクを送信します。",
    url: "/reset-password"
  }
};

type Props = {
  searchParams: Promise<{ error?: string; sent?: string; demo?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container grid min-h-[70vh] place-items-center py-10">
        <AppCard className="w-full max-w-xl">
          <h1 className="text-3xl font-black">パスワード再設定</h1>
          <p className="mt-2 leading-7 text-[var(--color-muted)]">
            登録したメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
          </p>
          <div className="mt-4">
            <AuthFormMessage variant="reset-password" error={params.error} sent={params.sent} demo={params.demo} />
          </div>
          <form action={resetPasswordAction} className="mt-6 grid gap-5">
            <label className="grid gap-2 font-bold">
              メールアドレス
              <input name="email" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4" type="email" placeholder="例）riketokuo@example.com" />
              <span className="text-xs font-bold text-[var(--color-muted)]">登録済みのメールアドレスを入力してください。</span>
            </label>
            <TurnstileBox />
            <AppButton type="submit">再設定メールを送る</AppButton>
          </form>
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
