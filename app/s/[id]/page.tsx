import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedResult } from "@/src/lib/science/public";
import { ResultSummary } from "@/components/science/ResultSummary";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { shareCopy } from "@/src/lib/science/share-copy";
export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const {id}=await params;const shared=await getSharedResult(id);
  if(!shared)return {title:"公開されていない結果",robots:{index:false,follow:false}};
  const title=`${shared.nickname}さんの${shared.result.definition.label}`;
  const description=shareCopy(shared.result,shared.nickname).text;
  return {title,description,robots:{index:false,follow:false},alternates:{canonical:`/s/${id}`},openGraph:{title,description,url:`/s/${id}`,images:[{url:`/s/${id}/image`,width:1200,height:630,alt:title}]},twitter:{card:"summary_large_image",title,description,images:[`/s/${id}/image`]}};
}
export default async function SharedPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const shared=await getSharedResult(id);if(!shared)notFound();
  const weekly=shared.result.definition.kind==="weekly",lab=shared.result.definition.kind==="lab";
  return <><SiteHeader compact/><main className="page-container max-w-4xl py-8"><ResultSummary result={shared.result} nickname={shared.nickname}/><p className="mt-3 text-sm text-[var(--color-muted)]">受験完了：{new Date(shared.completedAt).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"})}{weekly&&!shared.competitive&&" · 参考参加"}</p><AppCard className="mt-6"><h2 className="text-2xl font-black">{weekly?"あなたは何問わかる？":lab?"みんなの問いに、あなたも挑戦。":"あなたの科学マップは？"}</h2><p className="mt-3 leading-8">{weekly?"科学好きな人が、みんな同じ10問に挑む週替わりの腕試し。今週の問題に挑戦してみましょう。":lab?"ユーザーが作った問題を解いて、気づいたことをフィードバック。一緒に良問を育てましょう。":"まずは10分野×2問の腕試し。科学が好きなら、どこからでも。時間制限はありません。"}</p><div className="mt-5 flex flex-wrap gap-3">{(weekly||lab)&&<AppButton href={`/exam?kind=${weekly?"weekly":"lab"}&ref=${id}`}>{weekly?"自分も今週の10問へ":"みんなの問題を解く"}</AppButton>}<AppButton href={`/exam?kind=trial&ref=${id}`} variant={weekly||lab?"secondary":"primary"}>無料で20問に挑戦</AppButton><AppButton href="/lab" variant="ghost">みんなの出題ラボ</AppButton></div></AppCard></main></>;
}
