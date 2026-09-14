import { createHash } from "node:crypto";
import { domains } from "@/src/lib/data/taxonomy";
import { checked,service } from "./server";
import { readAll } from "./queries";
import { periodBounds } from "./definition";
import { currentEstimate } from "./current";
import type { Item,Attempt } from "./types";
import { refreshCorrectedAttempt } from "./corrections";
import { runCalibration } from "./calibration-job";

async function weeklySet(db:ReturnType<typeof service>,date=new Date()){
  const week=periodBounds("week",date);
  const existing=await db.from("science_weekly_sets").select("id").eq("id",week.key).maybeSingle();
  if(existing.error)checked(existing);if(existing.data)return {state:"already_published",week:week.key};
  const [items,formal,previous]=await Promise.all([
    readAll<Item>((a,b)=>db.from("science_items").select("*").eq("status","published").eq("rights_checked",true).eq("quality_passed",true).order("id").range(a,b)),
    readAll<{revision_id:string}>((a,b)=>db.from("science_release_items").select("release_id,revision_id").order("release_id").order("revision_id").range(a,b)),
    readAll<{revision_ids:string[]}>((a,b)=>db.from("science_weekly_sets").select("id,revision_ids").order("id").range(a,b))
  ]);
  const reserved=new Set([...formal.map(r=>r.revision_id),...previous.flatMap(r=>r.revision_ids)]);
  const rank=(id:string)=>createHash("sha256").update(week.key+":"+id).digest("hex");
  const picked=domains.map(domain=>items.filter(q=>q.domain===domain&&!reserved.has(q.id)&&(!q.expires_at||new Date(q.expires_at).getTime()>=Date.parse(week.end))).sort((a,b)=>rank(a.id).localeCompare(rank(b.id)))[0]);
  if(picked.some(q=>!q))return {state:"needs_reviewed_weekly_questions",week:week.key,missingDomains:domains.filter((_,i)=>!picked[i])};
  const created=checked(await db.rpc("science_publish_week",{p_id:week.key,p_starts:week.start,p_ends:week.end,p_revisions:picked.map(q=>q.id)}));
  return {state:created?"published":"already_published",week:week.key};
}

export async function runDailyJobs(){
  const db=service();
  const lease=await db.rpc("science_begin_job",{p_kind:"daily"});
  if(lease.error)checked(lease);if(!lease.data)return {state:"already_running"};
  const jobId=lease.data as string;
  const summary:Record<string,unknown>={observedAt:new Date().toISOString(),processed:0,mail:"not_processed_by_this_job"};
  try{
    const corrections=checked(await db.from("science_attempts").select("*").eq("needs_recalculation",true).order("completed_at").limit(20)) as Attempt[];
    for(const attempt of corrections)await refreshCorrectedAttempt(db,attempt);
    summary.correctedResults=corrections.length;
    summary.weekly={current:await weeklySet(db),next:await weeklySet(db,new Date(Date.now()+7*86400000))};
    const queue=checked(await db.from("science_outbox").select("id,user_id,kind,payload,attempts").eq("state","pending").in("kind",["attempt_completed","submission_status","result_correction"]).lte("available_at",new Date().toISOString()).order("available_at").limit(20));
    const users=new Set<string>();
    for(const message of queue){
      if(message.user_id){
        if(!users.has(message.user_id)){
          await currentEstimate(db,{userId:message.user_id});
          const badges=await db.rpc("science_award_badges",{p_user:message.user_id});if(badges.error)checked(badges);users.add(message.user_id);
        }
        if(message.kind!=="attempt_completed")checked(await db.from("science_notifications").upsert({user_id:message.user_id,source_id:message.id,kind:message.kind,payload:message.payload},{onConflict:"source_id",ignoreDuplicates:true}).select("id"));
      }
      checked(await db.from("science_outbox").update({state:"accepted",attempts:message.attempts+1,error_code:null,processed_at:new Date().toISOString()}).eq("id",message.id).eq("state","pending").select("id"));
      summary.processed=Number(summary.processed)+1;
    }
    const cleanup=await db.from("science_rate_limits").delete().lt("window_start",new Date(Date.now()-7*86400_000).toISOString());if(cleanup.error)checked(cleanup);
    summary.calibration=await runCalibration(db,jobId);
    checked(await db.rpc("science_end_job",{p_job:jobId,p_state:"completed",p_summary:summary}));
    return {state:"completed",...summary};
  }catch(error){
    await db.rpc("science_end_job",{p_job:jobId,p_state:"failed",p_summary:{...summary,errorType:error instanceof Error?error.name:"unknown"}});
    throw error;
  }
}
