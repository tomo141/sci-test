import { checked, releaseConfig, requireAdmin, type Context } from "./server";
import type { ExperimentRow } from "./experiment";
import type { Content } from "./types";
import type { Draft } from "./community";
export type AdminData={
  observedAt:string;
  submissions:(Draft&{author_id:string})[];
  feedback:{id:string;category:string;body:string;evidence:string;created_at:string;revision_id:string;science_items:{family_id:string;domain:string;content:Content}}[];
  jobs:{id:string;kind:string;state:string;summary:Record<string,unknown>;started_at:string;finished_at:string|null}[];
  corrections:{id:string;mode:"exclude"|"explanation";reason:string;created_by:string|null;canApprove:boolean;source:{id:string;family_id:string;domain:string;author_id:string|null;content:Content};replacement:{content:Content}}[];
  holds:{id:string;family_id:string;domain:string;content:Content;held_from_status:"published"|"lab"|null;held_at:string|null;pending_correction:boolean;canReopen:boolean}[];
  quality:{id:string;revision_id:string;code:string;priority:number;state:string;evidence:Record<string,unknown>;last_observed_at:string;review_note:string|null;science_items:{family_id:string;domain:string;content:Content}}[];
  metrics:{label:string;value:number}[];
  repeats:{attempt_id:string;kind:string;repeat_count:number;presented_count:number;last_repeat_at:string;domains:string;max_presentation_count:number}[]|null;
  experiment:{id:string;from:string;to:string;rows:ExperimentRow[]};
};
export async function adminData(ctx:Context):Promise<AdminData>{
  const userId=await requireAdmin(ctx);
  const operator = ctx.verifiedEmail?.toLowerCase() === "tomoyoshi@rikei-talk.com";
  const config=await releaseConfig(ctx.db),to=new Date().toISOString(),from=new Date(Date.now()-28*86400000).toISOString();
  const [drafts,feedback,jobs,metrics,experiment,corrections,quality,holds,repeats]=await Promise.all([
    ctx.db.from("science_submission_drafts").select("*").in("state",["submitted","lab"]).order("created_at").limit(50),
    ctx.db.from("science_feedback").select("id,category,body,evidence,created_at,revision_id,science_items!inner(family_id,domain,content)").eq("state","pending").order("created_at").limit(50),
    ctx.db.from("science_jobs").select("id,kind,state,summary,started_at,finished_at").order("started_at",{ascending:false}).limit(20),
    ctx.db.rpc("science_admin_metrics"),
    ctx.db.rpc("science_experiment_results",{p_from:from,p_to:to,p_experiment:config.experiment}),
    ctx.db.from("science_correction_proposals").select("id,mode,reason,created_by,source:science_items!science_correction_proposals_source_revision_fkey(id,family_id,domain,author_id,content),replacement:science_items!science_correction_proposals_replacement_revision_fkey(content)").eq("state","pending").order("created_at").limit(30),
    ctx.db.from("science_quality_signals").select("id,revision_id,code,priority,state,evidence,last_observed_at,review_note,science_items!inner(family_id,domain,content)").in("state",["open","acknowledged"]).order("priority").order("last_observed_at",{ascending:false}).limit(50),
    ctx.db.from("science_unresolved_holds").select("id,family_id,domain,content,author_id,held_from_status,held_at,pending_correction").order("held_at").order("id").limit(50),
    operator ? ctx.db.from("science_repeat_alerts").select("attempt_id,kind,repeat_count,presented_count,last_repeat_at,domains,max_presentation_count").order("last_repeat_at",{ascending:false}).limit(30) : Promise.resolve({data:[],error:null})
  ]);
  const pending=checked(drafts) as AdminData["submissions"],reports=checked(feedback) as unknown as AdminData["feedback"];
  const pendingCorrections=checked(corrections) as unknown as AdminData["corrections"];
  const qualitySignals=checked(quality) as unknown as AdminData["quality"];
  const heldItems=checked(holds) as (Omit<AdminData["holds"][number],"canReopen">&{author_id:string|null})[];
  // Viewing answer keys marks the family seen before returning them to the reviewer.
  const families=[...new Set([...pending.map(d=>`community:${d.id}`),...reports.map(f=>f.science_items.family_id),...pendingCorrections.map(c=>c.source.family_id),...qualitySignals.map(q=>q.science_items.family_id),...heldItems.map(q=>q.family_id)])];
  if(families.length)checked(await ctx.db.from("science_exposures").upsert(families.map(family_id=>({visitor_id:ctx.visitor.id,user_id:userId,family_id,reason:"reviewer"})),{onConflict:"visitor_id,family_id",ignoreDuplicates:true}).select("family_id"));
  return {observedAt:new Date().toISOString(),submissions:pending,feedback:reports,quality:qualitySignals,repeats:operator ? checked(repeats) as AdminData["repeats"] : null,
    holds:heldItems.map(({author_id,...q})=>({...q,canReopen:author_id!==userId&&!q.pending_correction&&!!q.held_from_status})),
    corrections:pendingCorrections.map(c=>({...c,canApprove:c.created_by!==userId&&c.source.author_id!==userId})),jobs:checked(jobs),metrics:checked(metrics) as AdminData["metrics"],experiment:{id:config.experiment,from,to,rows:checked(experiment) as ExperimentRow[]}};
}
