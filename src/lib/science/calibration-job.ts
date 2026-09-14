import { createHash } from "node:crypto";
import { checked,releaseConfig,type service } from "./server";
import { readAll } from "./queries";
import { MODEL_VERSION } from "./model";
import { calibrateDifficulty,calibrationObservations,type CalibrationAnswer } from "./calibration";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";
type Row={user_id:string|null;visitor_id:string;family_id:string;revision_id:string;domain:ScienceDomain;a:number;b:number;c:number;is_correct:boolean;answered_at:string};
export async function runCalibration(db:ReturnType<typeof service>,jobId:string){
  const release=await db.from("science_releases").select("id").eq("state","active").maybeSingle();
  if(release.error)checked(release);if(!release.data)return {state:"no_active_bank"};
  const from=new Date(Date.now()-90*86400000).toISOString(),to=new Date().toISOString();
  const count=await db.from("science_responses").select("revision_id",{count:"exact",head:true}).eq("eligible",true).eq("model_version",MODEL_VERSION).gte("answered_at",from).lt("answered_at",to);
  if(count.error)checked(count);if(count.count===null)throw new Error("calibration_count_unavailable");
  if(count.count<1000)return {state:"collecting",eligibleResponses:count.count,from,to};
  if(count.count>20000)return {state:"batch_processing_required",eligibleResponses:count.count,from,to};
  const [raw,bank]=await Promise.all([
    readAll<Row>((a,b)=>db.from("science_responses").select("user_id,visitor_id,family_id,revision_id,domain,a,b,c,is_correct,answered_at").eq("eligible",true).eq("model_version",MODEL_VERSION).gte("answered_at",from).lt("answered_at",to).order("answered_at").order("attempt_id").order("ordinal").range(a,b)),
    readAll<{revision_id:string;a:number;b:number;c:number;anchor:boolean;focus:boolean;parameter_evidence:{sourceOwnerCount?:number}}>((a,b)=>db.from("science_release_items").select("revision_id,a,b,c,anchor,focus,parameter_evidence").eq("release_id",release.data!.id).order("revision_id").range(a,b))
  ]);
  const rows:CalibrationAnswer[]=raw.map(r=>({owner:r.user_id?`user:${r.user_id}`:`visitor:${r.visitor_id}`,familyId:r.family_id,revisionId:r.revision_id,domain:r.domain,a:r.a,b:r.b,c:r.c,correct:r.is_correct,eligible:true,answeredAt:r.answered_at}));
  const owners=new Map<string,Set<string>>();for(const row of rows){if(!owners.has(row.revisionId))owners.set(row.revisionId,new Set());owners.get(row.revisionId)!.add(row.owner);}
  const qualified:string[]=[],fits:{revisionId:string;state:string;count:number}[]=[];
  for(const item of bank.filter(q=>q.focus&&!q.anchor&&(owners.get(q.revision_id)?.size??0)>=Math.max(200,(q.parameter_evidence.sourceOwnerCount??0)+50)).slice(0,20)){
    const observations=calibrationObservations(rows,item.revision_id),fit={...calibrateDifficulty(observations,item),sourceOwnerCount:owners.get(item.revision_id)?.size??0};
    const dataVersion=createHash("sha256").update(JSON.stringify(observations.map(o=>[o.owner,o.answeredAt,o.correct,o.prior.mass]))).digest("hex");
    const state=fit.eligible?"qualified":fit.count<200?"collecting":"rejected";
    const candidate=checked<{id:string}>(await db.from("science_calibration_candidates").upsert({revision_id:item.revision_id,release_id:release.data.id,data_version:dataVersion,observed_from:from,observed_to:to,fit,state},{onConflict:"revision_id,release_id,data_version"}).select("id").single());
    fits.push({revisionId:item.revision_id,state:fit.reason,count:fit.count});if(fit.eligible)qualified.push(candidate.id);
  }
  const config=await releaseConfig(db);
  if(qualified.length&&config.automaticCalibration){
    const next=checked(await db.rpc("science_apply_calibration",{p_parent:release.data.id,p_candidates:qualified,p_job:jobId}));
    return {state:"applied",from,to,fits,releaseId:next};
  }
  return {state:qualified.length?"awaiting_activation":"collecting",from,to,eligibleResponses:raw.length,fits};
}
