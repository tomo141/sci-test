import Image from "next/image";
import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { DomainIcon } from "@/components/ui/DomainIcon";
import { domains } from "@/src/lib/data/taxonomy";
export const metadata={title:"全分野科学検定",description:"あなたの科学は、どこまで広い？20問の腕試しから、10分野の科学マップへ。制作：理系とーく 川村智祥。"};
export default function HomePage(){return <><SiteHeaderWithAuth/><main>
  <section className="bg-[radial-gradient(circle_at_80%_20%,#dcecff,transparent_45%),linear-gradient(180deg,#fff,#f4f8ff)] py-12 md:py-20"><div className="page-container grid items-center gap-8 md:grid-cols-2"><div><p className="text-sm font-black tracking-widest text-[var(--color-primary-700)]">科学が好き。その先へ。</p><h1 className="mt-5 text-4xl font-black leading-snug md:text-6xl">あなたの科学は、<br/>どこまで<span className="text-[var(--color-primary-700)]">広い？</span></h1><p className="mt-6 max-w-xl leading-8">専門の外にも、知っている自分がいる。<br/>数学から人文社会科学まで、10分野を旅する20問。あなたの科学マップを見つけよう。</p><AppButton href="/exam?kind=trial" className="mt-8 px-8 text-lg">20問で腕試しする</AppButton><p className="mt-4 text-sm text-[var(--color-muted)]">無料・登録なしで開始・時間制限なし</p><p className="mt-7 text-xs font-bold">制作「理系とーく 川村智祥」</p></div><div className="relative aspect-[16/10]"><Image src="/images/hero-main.jpg" alt="10の科学分野をめぐる、りけとくおの冒険" fill priority sizes="(max-width:768px) 100vw,50vw" className="rounded-3xl object-contain"/></div></div></section>
  <section className="page-container py-12"><h2 className="text-2xl font-black">広さも、深さも。次の一問へ。</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{[
    {label:"腕試し20問",body:"10分野を2問ずつ。得意と好奇心の入口を見つける、最初の科学マップ。",href:"/exam?kind=trial",cta:"腕試しへ"},
    {label:"本試験",body:"各分野を同じ数ずつ測ります。あなたに合う問題で、実力をもう少し詳しく。",href:"/exam?kind=full",cta:"本試験の案内へ"},
    {label:"この分野をもう20問",body:"得意分野を掘り下げる？ 意外な分野を開く？ 気になる科学を選ぼう。",href:"/exam?kind=domain",cta:"分野を選ぶ"}
  ].map(c=><AppCard key={c.label}><h3 className="text-xl font-black">{c.label}</h3><p className="mt-4 min-h-24 leading-8">{c.body}</p><AppButton href={c.href} variant="secondary" className="mt-5">{c.cta}</AppButton></AppCard>)}</div>
    <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">初期は知識の4択問題です。実験・論述・研究遂行を含む科学の力すべてを測るものではありません。測定値には推定の幅を示します。</p>
  </section>
  <section className="page-container grid gap-6 md:grid-cols-2"><AppCard className="bg-[var(--color-primary-50)]"><p className="text-sm font-bold">毎週月曜、同じ問題で。</p><h2 className="mt-3 text-3xl font-black">今週の10問</h2><p className="mt-4 leading-8">友だちも、専門家も、みんな同じ10問。初回の正答数で週替わりランキングに参加できます。</p><div className="mt-6 flex flex-wrap gap-3"><AppButton href="/exam?kind=weekly">今週の10問に挑む</AppButton><AppButton href="/ranking" variant="ghost">ランキング</AppButton></div></AppCard><AppCard><p className="text-sm font-bold">解く人も、つくる人も、研究仲間。</p><h2 className="mt-3 text-3xl font-black">みんなの出題ラボ</h2><p className="mt-4 leading-8">とっておきの科学を問題に。みんなの問いを解いて、気づきを返して、良問を一緒に育てる場所。</p><AppButton href="/lab" className="mt-6" variant="secondary">出題ラボをのぞく</AppButton></AppCard></section>
  <section className="page-container py-12"><h2 className="text-2xl font-black">10の科学分野</h2><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">{domains.map(domain=><Link key={domain} href={`/exam?kind=domain&domain=${encodeURIComponent(domain)}`} className="rounded-2xl border bg-white p-5 text-center hover:border-[var(--color-primary-700)]"><DomainIcon domain={domain}/><p className="mt-3 text-sm font-bold">{domain}</p></Link>)}</div><p className="mt-5 text-sm leading-7">分野別・小分野別の長い本試験は、検証済みの問題と回答データが揃った範囲から公開します。<Link href="/signup?next=%2Fmypage" className="underline">登録後の配信設定</Link>から、新しい分野の公開案内を選べます。</p></section>
</main><SiteFooter/></>;}
