import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { domains } from "@/src/lib/data/taxonomy";

export const metadata = { title: "検定について", description: "10の科学分野を4択クイズで腕試し。解きながら学び、得意な分野と新しい興味を見つける全分野科学検定です。" };

export default function AboutPage() {
  return <><SiteHeaderWithAuth /><main className="page-container max-w-4xl py-10">
    <p className="text-sm font-bold text-[var(--color-primary-700)]">全分野科学検定について</p>
    <h1 className="mt-3 text-3xl font-black leading-relaxed md:text-4xl">知っている科学も、<br />まだ知らない科学も。</h1>
    <p className="mt-6 leading-8">全分野科学検定は、10の科学分野に挑戦できる4択クイズの検定です。得意な分野で腕試しをしたり、専門の外に思いがけない面白さを見つけたり。科学が好きな方なら、どなたでも楽しめます。</p>
    <AppButton href="/exam?kind=trial" className="mt-6">まずは20問で腕試しする</AppButton>
    <div className="mt-10 grid gap-6">
      <AppCard><h2 className="text-xl font-black">まずは、10分野から2問ずつ</h2>
        <p className="mt-4 leading-8">「20問の腕試し」は無料で、登録せずに始められます。分野ごとの知識を確かめながら、あなたの得意な科学を探してみましょう。</p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="出題する10分野">{domains.map(domain => <li key={domain} className="rounded-full bg-[var(--color-primary-100)] px-4 py-2 text-sm font-bold">{domain}</li>)}</ul>
      </AppCard>
      <AppCard><h2 className="text-xl font-black">一問ごとに、答えと理由がわかる</h2>
        <p className="mt-4 leading-8">回答すると、正誤・正解・短い解説がすぐに表示されます。もっと知りたいときは、詳しい解説や出典を開いて読めます。</p>
        <p className="mt-3 leading-8">時間制限はありません。途中で閉じても、同じ端末から再開できます。腕試しのときは、検索やAI、ほかの人の助けを使わず、自分の知識で答えてみてください。</p>
      </AppCard>
      <AppCard><h2 className="text-xl font-black">得意な分野が、科学マップで見える</h2>
        <p className="mt-4 leading-8">結果には、10分野のスコアをまとめた科学マップが表示されます。分野スコアは1〜99点、総合スコアはその10分野を同じ重みで合計した10〜990点です。</p>
        <p className="mt-3 leading-8">スコアは、正答数だけでなく、答えた問題の難しさも考慮した知識の目安です。回答数が少ないと推定の幅も大きくなります。現在はβ版として精度を検証しており、学歴や研究能力を認定するものではありません。</p>
        <p className="mt-3 leading-8">気に入った結果は、ニックネームを付けてSNSで共有できます。公開するかどうかは、ご自身で選べます。</p>
      </AppCard>
      <AppCard><h2 className="text-xl font-black">もっと解きたくなったら</h2>
        <ul className="mt-4 space-y-4 leading-8">
          <li><strong>総合本試験：</strong>10分野を、腕試しより多くの問題でじっくり確かめます。問題数は受験を始める前に確認できます。</li>
          <li><strong>この分野をもう20問：</strong>気になった分野を選んで、続けて挑戦できます。</li>
          <li><strong>今週の10問：</strong>みんな同じ問題に挑戦する週替わりのクイズです。正答数でランキングを楽しめます。</li>
        </ul>
        <p className="mt-4 leading-8">無料登録はメールアドレスと確認コードだけ。受験記録を残し、別の端末でも続きを楽しめます。登録が必要な受験では、開始前にご案内します。</p>
      </AppCard>
      <AppCard><h2 className="text-xl font-black">解くだけでなく、問題をつくる楽しさも</h2>
        <p className="mt-4 leading-8">「みんなの出題ラボ」では、自分で考えた科学の問題を投稿できます。運営が内容を確認した問題を、ほかの参加者が解き、感想や改善案を寄せます。「この話、面白い！」と思ったら、一問にしてみませんか。</p>
        <AppButton href="/lab" variant="secondary" className="mt-5">みんなの出題ラボへ</AppButton>
      </AppCard>
    </div>
    <p className="mt-8 leading-8">制作：理系とーく 川村智祥</p>
    <p className="mt-2 text-sm leading-7">受験やログインで困ったときは、<Link href="/help" className="underline">ヘルプ</Link>をご覧ください。</p>
  </main><SiteFooter /></>;
}
