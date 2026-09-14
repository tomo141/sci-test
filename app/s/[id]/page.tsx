import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedResult } from "@/src/lib/science/public";
import { ResultSummary } from "@/components/science/ResultSummary";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
export const dynamic="force-dynamic";

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const {id}=await params;const shared=await getSharedResult(id);
  if(!shared)return {title:"公開されていない結果",robots:{index:false,follow:false}};
  const title=`${shared.nickname}さんの${shared.result.definition.label}`;
  const description="科学の得意と、まだ知らない世界。あなたも全分野科学検定に挑戦しよう。";
  return {title,description,robots:{index:false,follow:false},alternates:{canonical:`/s/${id}`},openGraph:{title,description,url:`/s/${id}`,images:[{url:`/s/${id}/image`,width:1200,height:630,alt:title}]},twitter:{card:"summary_large_image",title,description,images:[`/s/${id}/image`]}};
}
export default async function SharedPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const shared=await getSharedResult(id);if(!shared)notFound();
  return <><SiteHeader compact/><main className="page-container max-w-4xl py-8"><ResultSummary result={shared.result} nickname={shared.nickname}/><p className="mt-3 text-sm text-[var(--color-muted)]">受験完了：{new Date(shared.completedAt).toLocaleString("ja-JP",{timeZone:"Asia/Tokyo"})}{shared.result.definition.kind==="weekly"&&!shared.competitive&&" · 参考参加"}</p><AppCard className="mt-6"><h2 className="text-2xl font-black">あなたの科学マップは？</h2><p className="mt-3 leading-8">まずは10分野×2問の腕試し。科学が好きなら、どこからでも。時間制限はありません。</p><div className="mt-5 flex flex-wrap gap-3"><AppButton href={`/exam?kind=trial&ref=${id}`}>無料で20問に挑戦</AppButton>{shared.result.definition.kind==="weekly"&&<AppButton href={`/exam?kind=weekly&ref=${id}`} variant="secondary">自分も今週の10問へ</AppButton>}<AppButton href="/lab" variant="ghost">みんなの出題ラボ</AppButton></div></AppCard></main></>;
}
