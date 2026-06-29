import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { resetPasswordAction } from "@/app/auth/actions";
import { TurnstileBox } from "@/components/ui/TurnstileBox";

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container grid min-h-[70vh] place-items-center py-10">
        <AppCard className="w-full max-w-xl">
          <h1 className="text-3xl font-black">パスワード再設定</h1>
          <p className="mt-2 leading-7 text-[var(--color-muted)]">Supabase Authの標準メールで再設定リンクを送信する想定です。</p>
          <form action={resetPasswordAction} className="mt-6 grid gap-5">
            <label className="grid gap-2 font-bold">メールアドレス<input name="email" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4" type="email" /></label>
            <TurnstileBox />
            <AppButton type="submit">再設定メールを送る</AppButton>
          </form>
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
