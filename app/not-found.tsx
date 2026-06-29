import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";

export default function NotFound() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container grid min-h-[60vh] place-items-center py-10">
        <AppCard className="max-w-xl text-center">
          <h1 className="text-3xl font-black">ページが見つかりません</h1>
          <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">URLを確認するか、トップページからもう一度お試しください。</p>
          <AppButton href="/" className="mt-6">トップへ戻る</AppButton>
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
