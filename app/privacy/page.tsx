import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppCard } from "@/components/ui/AppCard";
import { siteConfig } from "@/src/lib/site-config";

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-container py-10">
        <AppCard>
          <h1 className="text-3xl font-black">プライバシーポリシー</h1>
          <p className="mt-2 text-[var(--color-muted)]">運営者：{siteConfig.legal.businessName} / 代表者：{siteConfig.legal.representativeName} / 最終更新：{siteConfig.legal.lastUpdated}</p>
          {["収集する情報", "メールアドレス・パスワードの扱い", "回答履歴・スコアの保存", "問題難度・品質改善への利用", "ランキングの表示範囲", "メルマガ同意・解除", "アカウント削除", `問い合わせ先：${siteConfig.legal.contactEmail}`].map((x) => <section key={x} className="mt-6"><h2 className="text-xl font-black">{x}</h2><p className="mt-2 leading-8 text-[var(--color-ink-soft)]">必要な範囲で情報を取得し、サービス提供、品質改善、本人確認、同意に基づく案内のために利用します。メルマガ解除とアカウント削除は別の手続きとして扱います。</p></section>)}
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
