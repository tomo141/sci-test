import { checked, releaseConfig, requireAdmin, type Context } from "./server";
import type { ExperimentRow } from "./experiment";
import type { Content } from "./types";
import type { Draft } from "./community";
export type AdminData={
  observedAt:string;
  submissions:(Draft&{author_id:string})[];
  feedback:{id:string;category:string;body:string;evidence:string;created_at:string;revision_id:string;science_items:{family_id:string;domain:string;content:Content}}[];
  jobs:{id:string;kind:string;state:string;summary:Record<string,unknown>;started_at:string;finished_at:string|null}[];
  metrics:{label:string;value:number}[];
  experiment:{id:string;from:string;to:string;rows:ExperimentRow[]};
};
export async function adminData(ctx:Context):Promise<AdminData>{
  const userId=await requireAdmin(ctx);
  const config=await releaseConfig(ctx.db),to=new Date().toISOString(),from=new Date(Date.now()-28*86400000).toISOString();
  const [drafts,feedback,jobs,metrics,experiment]=await Promise.all([
    ctx.db.from("science_submission_drafts").select("*").in("state",["submitted","lab"]).order("created_at").limit(50),
    ctx.db.from("science_feedback").select("id,category,body,evidence,created_at,revision_id,science_items!inner(family_id,domain,content)").eq("state","pending").order("created_at").limit(50),
    ctx.db.from("science_jobs").select("id,kind,state,summary,started_at,finished_at").order("started_at",{ascending:false}).limit(20),
    ctx.db.rpc("science_admin_metrics"),
    ctx.db.rpc("science_experiment_results",{p_from:from,p_to:to,p_experiment:config.experiment})
  ]);
  const pending=checked(drafts) as AdminData["submissions"],reports=checked(feedback) as unknown as AdminData["feedback"];
  // Viewing answer keys marks the family seen before returning them to the reviewer.
  const families=[...new Set([...pending.map(d=>`community:${d.id}`),...reports.map(f=>f.science_items.family_id)])];
  if(families.length)checked(await ctx.db.from("science_exposures").upsert(families.map(family_id=>({visitor_id:ctx.visitor.id,user_id:userId,family_id,reason:"reviewer"})),{onConflict:"visitor_id,family_id",ignoreDuplicates:true}).select("family_id"));
  return {observedAt:new Date().toISOString(),submissions:pending,feedback:reports,jobs:checked(jobs),metrics:checked(metrics) as AdminData["metrics"],experiment:{id:config.experiment,from,to,rows:checked(experiment) as ExperimentRow[]}};
}
