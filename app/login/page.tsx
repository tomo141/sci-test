import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { loginAction } from "@/app/auth/actions";
import { TurnstileBox } from "@/components/ui/TurnstileBox";

export default function LoginPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container grid min-h-[70vh] place-items-center py-10">
        <AppCard className="w-full max-w-xl">
          <h1 className="text-3xl font-black">ログイン</h1>
          <p className="mt-2 text-[var(--color-muted)]">保存した結果やマイページを確認できます。</p>
          <form action={loginAction} className="mt-6 grid gap-5">
            <label className="grid gap-2 font-bold">メールアドレス<input name="email" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4" type="email" /></label>
            <label className="grid gap-2 font-bold">パスワード<input name="password" required className="h-14 rounded-2xl border border-[var(--color-border)] px-4" type="password" /></label>
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
