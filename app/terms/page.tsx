import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppCard } from "@/components/ui/AppCard";
import { siteConfig } from "@/src/lib/site-config";

export default function TermsPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-10">
        <AppCard className="prose max-w-none">
          <h1 className="text-3xl font-black">利用規約</h1>
          <p>運営者：{siteConfig.legal.businessName} / 代表者：{siteConfig.legal.representativeName} / 最終更新：{siteConfig.legal.lastUpdated}</p>
          {["サービス内容", "アカウント", "回答履歴・スコアの保存", "ランキング表示", "メルマガ同意と解除", "免責", "未成年の利用", "アカウント削除", `問い合わせ先：${siteConfig.legal.contactEmail}`].map((x) => <section key={x} className="mt-6"><h2 className="text-xl font-black">{x}</h2><p className="mt-2 leading-8">全分野科学検定 β版は独自の推定基準に基づく科学力診断・成長可視化サービスです。学位・採用・進学・資格等を保証または証明するものではありません。</p></section>)}
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
