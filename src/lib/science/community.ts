import { z } from "zod";
import { domains, isSubdomainOf, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { checked, releaseConfig, requireUser, ScienceError, type Context } from "./server";
import { readAll } from "./queries";
import { trustExposureWeight, trustScore, type QualityEvidence } from "./trust";
import type { Content } from "./types";
import type { ScienceResult } from "./model";
import { publishedLicense } from "./licenses";

export { questionContent } from "./question-content";
const draftContent=z.object({question:z.string().max(2000),choices:z.array(z.string().max(500)).length(4),correctIndex:z.number().int().min(0).max(3),explanation:z.string().max(4000),distractorRationales:z.array(z.string().max(1000)).length(4),sources:z.array(z.object({title:z.string().max(300),url:z.string().max(2000).optional()}).strict()).min(1).max(5)}).strict();
export const draftInput=z.object({id:z.string().uuid(),revision:z.number().int().min(0),domain:z.enum(domains),subdomain:z.string().trim().min(1).max(100),content:draftContent,creditName:z.string().trim().max(30),aiAssisted:z.boolean()}).strict().refine(d=>isSubdomainOf(d.domain,d.subdomain),"分野を選び直してください");
export type Draft={id:string;revision:number;domain:ScienceDomain;subdomain:string;content:Content;state:string;review_note:string|null;revision_id:string|null;updated_at:string;author_credit:string;ai_assisted:boolean};
type Evidence=QualityEvidence&{user_id:string;domain:ScienceDomain};

export async function trustInputs(ctx:Context,userIds:string[]){
  if(!userIds.length)return {evidence:[] as Evidence[],estimates:[] as {user_id:string;result:ScienceResult}[]};
  const [evidence,estimates]=await Promise.all([
    readAll<Evidence>((a,b)=>ctx.db.from("science_trust_evidence").select("id,user_id,domain,role,positive").in("user_id",userIds).order("id").range(a,b)),
    readAll<{user_id:string;result:ScienceResult}>((a,b)=>ctx.db.from("science_current_estimates").select("user_id,result").in("user_id",userIds).order("user_id").range(a,b))
  ]);
  return {evidence,estimates};
}
export function fieldTrust(inputs:Awaited<ReturnType<typeof trustInputs>>,userId:string,domain:ScienceDomain){
  const estimate=inputs.estimates.find(e=>e.user_id===userId)?.result;
  return trustScore(inputs.evidence.filter(e=>e.user_id===userId&&e.domain===domain),{domain:estimate?.domains[domain]?.score??null,overall:estimate?.total??null});
}
export async function authorWeights(ctx:Context,candidates:{authorId:string|null;domain:ScienceDomain}[]){
  const userIds=[...new Set(candidates.flatMap(c=>c.authorId?[c.authorId]:[]))];
  const inputs=await trustInputs(ctx,userIds);
  return candidates.map(c=>c.authorId?trustExposureWeight(fieldTrust(inputs,c.authorId,c.domain)):1);
}
export async function communityData(ctx:Context){
  const config=await releaseConfig(ctx.db);
  const license=config.labSubmissions&&config.licenseVersion?await publishedLicense(ctx.db,config.licenseVersion):null;
  const count=await ctx.db.from("science_items").select("id",{count:"exact",head:true}).in("status",["lab","published"]).not("author_id","is",null).eq("rights_checked",true);
  if(count.error||count.count===null)throw new ScienceError("ラボの状況を取得できませんでした。",503);
  const base={signedIn:!!ctx.userId,open:!!license?.active,licenseVersion:license?.version??null,licenseHash:license?.sha256??null,licenseSummary:license?.terms.summary??null,questionCount:count.count,drafts:[] as Draft[],trust:[] as {domain:ScienceDomain;score:ReturnType<typeof trustScore>}[]};
  if(!ctx.userId)return base;
  const [drafts,inputs]=await Promise.all([
    ctx.db.from("science_submission_drafts").select("id,revision,domain,subdomain,content,state,review_note,revision_id,updated_at,author_credit,ai_assisted").eq("author_id",ctx.userId).order("updated_at",{ascending:false}).limit(100),
    trustInputs(ctx,[ctx.userId])
  ]);
  return {...base,drafts:checked(drafts) as Draft[],trust:domains.map(domain=>({domain,score:fieldTrust(inputs,ctx.userId!,domain)}))};
}
export type CommunityData=Awaited<ReturnType<typeof communityData>>;
export async function saveDraft(ctx:Context,input:z.infer<typeof draftInput>){
  const userId=requireUser(ctx);
  const existing=await ctx.db.from("science_submission_drafts").select("id,revision,state").eq("id",input.id).eq("author_id",userId).maybeSingle();
  if(existing.error)checked(existing);
  const fields={domain:input.domain,subdomain:input.subdomain,content:input.content,updated_at:new Date().toISOString(),author_credit:input.creditName,ai_assisted:input.aiAssisted};
  if(!existing.data){
    if(input.revision!==0)throw new ScienceError("下書きの保存状態を確認してください。",409,"conflict");
    return checked(await ctx.db.from("science_submission_drafts").insert({id:input.id,author_id:userId,...fields,revision:1}).select("id,revision").single());
  }
  if(!["draft","changes_requested"].includes(existing.data.state)||existing.data.revision!==input.revision)throw new ScienceError("投稿が更新されています。一覧から開き直してください。",409,"conflict");
  return checked(await ctx.db.from("science_submission_drafts").update({...fields,revision:input.revision+1}).eq("id",input.id).eq("author_id",userId).eq("revision",input.revision).in("state",["draft","changes_requested"]).select("id,revision").single());
}
