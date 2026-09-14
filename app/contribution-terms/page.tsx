import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppCard } from "@/components/ui/AppCard";
import { publishedLicense } from "@/src/lib/science/licenses";
import { releaseConfig, service } from "@/src/lib/science/server";
import draft from "@/content/policies/contribution-v1-draft.json";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"投稿条件",robots:{index:false,follow:false}};
export default async function ContributionTerms({searchParams}:{searchParams:Promise<{version?:string;draft?:string}>}){
  const query=await searchParams;
  let version=query.version;
  if(version&&!/^[a-zA-Z0-9._-]{1,100}$/.test(version))notFound();
  const explicitDraft=query.draft==="1"&&!version;
  let license:Awaited<ReturnType<typeof publishedLicense>>=null;
  try{
    if(!version&&!explicitDraft){const config=await releaseConfig();if(config.labSubmissions)version=config.licenseVersion??undefined;}
    if(version)license=await publishedLicense(service(),version);
  }catch{
    return <><SiteHeaderWithAuth/><main className="page-container max-w-4xl py-10"><AppCard><h1 className="text-3xl font-black">投稿条件を取得できませんでした</h1><p role="alert" className="mt-5 leading-8">適用される条件を確認できないため、時間を置いて再読み込みしてください。</p><div className="mt-5 flex flex-wrap gap-5"><Link href="/contribution-terms" className="underline">再読み込み</Link><Link href="/contribution-terms?draft=1" className="underline">確認用の案を読む</Link></div></AppCard></main><SiteFooter/></>;
  }
  if(version&&!license)notFound();
  const sections=license?.terms.sections??draft.sections;
  return <><SiteHeaderWithAuth/><main className="page-container max-w-4xl py-10"><AppCard><Link href="/lab" className="text-sm underline">みんなの出題ラボへ</Link><h1 className="mt-5 text-3xl font-black">{license?"投稿規約":"投稿条件（確認中の案）"}</h1>
    {license?<><p className="mt-4 text-sm leading-7">運営者：{license.operator_name}<br/>版：{license.version} · 公開日：{new Date(license.published_at).toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"})}</p><p className="mt-5 rounded-xl bg-[var(--color-page)] p-5 leading-8">{license.terms.summary}</p>{!license.active&&<p className="mt-4 text-sm">過去の投稿に適用された版です。現在の新規投稿には適用していません。</p>}</>:<><p className="mt-4 rounded-xl bg-amber-50 p-5 leading-8">{explicitDraft?"以下は確認用の案で、投稿の契約条件として適用しているものではありません。現在の適用条件は通常の投稿規約ページから確認してください。":"投稿条件を確認しているため、現在は下書きの保存まで利用できます。以下は確認用の案で、投稿の契約条件として適用しているものではありません。"}</p>{explicitDraft&&<Link href="/contribution-terms" className="mt-4 inline-block underline">投稿規約ページへ</Link>}<p className="mt-5 leading-8">著作権は作者に残し、理系とーくが問題の公開・改善・商用提供を継続できる利用許諾を得る方針です。</p></>}
    <div className="mt-8 grid gap-7">{sections.map((s,i)=><section key={s.title}><h2 className="text-xl font-bold">{i+1}. {s.title}</h2>{s.body.map((p,j)=><p key={j} className="mt-3 whitespace-pre-wrap leading-8">{p}</p>)}</section>)}</div>
    <p className="mt-8 text-sm leading-7">投稿や権利に関する相談は、<a href="mailto:tomoyoshi@rikei-talk.com" className="underline">運営の問い合わせ窓口</a>へご連絡ください。</p>
  </AppCard></main><SiteFooter/></>;
}
