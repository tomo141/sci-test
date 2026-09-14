import { domains,type ScienceDomain } from "@/src/lib/data/taxonomy";
import { MODEL_VERSION,scoreResponses,type Response } from "./model";
import { checked,ScienceError,type Context } from "./server";
export async function currentEstimate(db:Context["db"],owner:{userId:string}|{visitorId:string}){
  const epoch=checked(await db.rpc("science_correction_epoch")) as number;
  const fields=await Promise.all(domains.map(async(domain)=>{
    let query=db.from("science_responses").select("domain,a,b,c,is_correct,answered_at").eq("domain",domain).eq("eligible",true).eq("model_version",MODEL_VERSION);
    query="userId" in owner?query.eq("user_id",owner.userId):query.eq("visitor_id",owner.visitorId);
    const rows=checked(await query.order("answered_at",{ascending:false}).order("attempt_id").order("ordinal",{ascending:false}).limit(100)) as {domain:ScienceDomain;a:number;b:number;c:number;is_correct:boolean;answered_at:string}[];
    return rows.reverse().map((r):Response=>({...r,correct:r.is_correct,eligible:true,answeredAt:r.answered_at}));
  }));
  const result=scoreResponses(fields.flat(),true);
  const through=fields.flat().map(r=>r.answeredAt!).sort().at(-1)??null;
  if("userId" in owner && !checked(await db.rpc("science_store_current",{p_user:owner.userId,p_result:result,p_through:through,p_epoch:epoch})))throw new ScienceError("問題の訂正を反映しています。もう一度開いてください。",409,"correction_pending");
  return result;
}
