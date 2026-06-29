import { HelpCircle, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { siteConfig } from "@/src/lib/site-config";

const faqs = [
  ["スコアは何を意味しますか？", "回答履歴から推定した独自スコアです。学位・資格・採用・進学などを保証するものではありません。"],
  ["ランキングに何が表示されますか？", "公開用ニックネーム、スコア、回答数、称号などです。メールアドレスや本名は表示されません。"],
  ["トレーニングが使えません", "ページを再読み込みしても動かない場合は、ブラウザのローカル保存を許可しているか確認してください。"],
  ["最初からやり直せますか？", "腕試しページ右上の「最初からやり直す」から、この端末の回答履歴をリセットできます。"]
];

export default function HelpPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-10">
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="font-black text-[var(--color-primary-700)]">ヘルプ</p>
            <h1 className="mt-3 text-4xl font-black md:text-5xl">困ったときの案内</h1>
            <p className="mt-5 max-w-3xl leading-8 text-[var(--color-ink-soft)]">
              腕試し、カルテ、ランキング、アカウントに関する基本的な使い方をまとめています。
            </p>
          </div>
          <AppCard>
            <Mail className="text-[var(--color-primary-700)]" />
            <h2 className="mt-3 text-xl font-black">お問い合わせ</h2>
            <p className="mt-3 break-all text-sm font-bold leading-7 text-[var(--color-ink-soft)]">{siteConfig.legal.contactEmail}</p>
            <AppButton href={`mailto:${siteConfig.legal.contactEmail}`} className="mt-5 w-full">メールする</AppButton>
          </AppCard>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <AppCard key={question}>
              <HelpCircle className="text-[var(--color-primary-700)]" />
              <h2 className="mt-3 text-xl font-black">{question}</h2>
              <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">{answer}</p>
            </AppCard>
          ))}
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <AppCard>
            <RotateCcw className="text-[var(--color-primary-700)]" />
            <h2 className="mt-3 text-xl font-black">受験データの扱い</h2>
            <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">ログインなしの回答は、この端末のブラウザに保存されます。ログインして結果を保存すると、マイページやランキングに反映されます。</p>
          </AppCard>
          <AppCard>
            <ShieldCheck className="text-[var(--color-primary-700)]" />
            <h2 className="mt-3 text-xl font-black">法務情報</h2>
            <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">利用条件や個人情報の取り扱いは、利用規約とプライバシーポリシーに記載しています。</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <AppButton href="/terms" variant="secondary">利用規約</AppButton>
              <AppButton href="/privacy" variant="secondary">プライバシーポリシー</AppButton>
            </div>
          </AppCard>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
