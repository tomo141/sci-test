import { NextRequest } from "next/server";
import { z } from "zod";
import { adminData } from "@/src/lib/science/admin";
import { listExperiences } from "@/src/lib/science/experience-survey-server";
import { questionContent } from "@/src/lib/science/community";
import { runDailyJobs } from "@/src/lib/science/jobs";
import { checkMyaspConnection } from "@/src/lib/science/myasp-connection";
import { checked, context, endpoint, rateLimit, requireAdmin, ScienceError } from "@/src/lib/science/server";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function POST(request:NextRequest,{params}:{params:Promise<{action:string}>}){
  return endpoint(request,async()=>{
    const action=z.enum(["list","submission","feedback","run_jobs","check_mail","propose_correction","approve_correction","reject_correction","revise_correction","reopen_item","quality","experiences"]).parse((await params).action);
    const raw=await request.text();if(raw.length>32768)throw new ScienceError("入力が長すぎます。",413);
    const body=JSON.parse(raw),ctx=await context(true),admin=await requireAdmin(ctx);
    await rateLimit(ctx,"admin",60);
    if(action==="experiences") return listExperiences(ctx,z.object({page:z.number().int().min(0).max(10000)}).strict().parse(body).page);
    if(action==="check_mail"){z.object({}).strict().parse(body);await rateLimit(ctx,"check_mail",2,300);return checkMyaspConnection(ctx);}
    if(action==="run_jobs"){z.object({}).strict().parse(body);await rateLimit(ctx,"run_jobs",2,300);return runDailyJobs();}
    if(action==="list"){z.object({}).strict().parse(body);return adminData(ctx);}
    if(action==="quality"){
      const p=z.object({id:z.string().uuid(),reason:z.string().trim().min(5).max(2000),hold:z.boolean()}).strict().parse(body);
      checked(await ctx.db.rpc("science_review_quality_signal",{p_id:p.id,p_admin:admin,p_reason:p.reason,p_hold:p.hold}));return {saved:true};
    }
    if(action==="propose_correction"){
      const p=z.object({revisionId:z.string().uuid(),content:questionContent,mode:z.enum(["exclude","explanation"]),reason:z.string().trim().min(5).max(2000)}).strict().parse(body);
      return {id:checked(await ctx.db.rpc("science_propose_correction",{p_source:p.revisionId,p_admin:admin,p_content:p.content,p_mode:p.mode,p_reason:p.reason}))};
    }
    if(action==="approve_correction"){
      const p=z.object({id:z.string().uuid(),checks:z.object({rights:z.boolean(),source:z.boolean(),uniqueAnswer:z.boolean(),explanation:z.boolean()}).strict()}).strict().parse(body);
      return {epoch:checked(await ctx.db.rpc("science_approve_correction",{p_id:p.id,p_admin:admin,p_checks:p.checks}))};
    }
    if(action==="reject_correction"){
      const p=z.object({id:z.string().uuid(),reason:z.string().trim().min(5).max(2000)}).strict().parse(body);
      checked(await ctx.db.rpc("science_reject_correction",{p_id:p.id,p_admin:admin,p_reason:p.reason}));return {saved:true};
    }
    if(action==="revise_correction"){
      const p=z.object({id:z.string().uuid(),content:questionContent,mode:z.enum(["exclude","explanation"]),reason:z.string().trim().min(5).max(2000)}).strict().parse(body);
      return {id:checked(await ctx.db.rpc("science_revise_correction",{p_id:p.id,p_admin:admin,p_content:p.content,p_mode:p.mode,p_reason:p.reason}))};
    }
    if(action==="reopen_item"){
      const p=z.object({revisionId:z.string().uuid(),reason:z.string().trim().min(5).max(2000),checks:z.object({rights:z.boolean(),source:z.boolean(),uniqueAnswer:z.boolean(),explanation:z.boolean()}).strict()}).strict().parse(body);
      return {status:checked(await ctx.db.rpc("science_reopen_held_item",{p_revision:p.revisionId,p_admin:admin,p_reason:p.reason,p_checks:p.checks}))};
    }
    if(action==="submission"){
      const p=z.object({draftId:z.string().uuid(),decision:z.enum(["lab","adopted","changes_requested","rejected"]),reason:z.string().trim().min(5).max(2000),checks:z.object({rights:z.boolean(),source:z.boolean(),uniqueAnswer:z.boolean(),explanation:z.boolean()}).strict()}).strict().parse(body);
      checked(await ctx.db.rpc("science_review_submission",{p_draft:p.draftId,p_admin:admin,p_decision:p.decision,p_reason:p.reason,p_checks:p.checks}));return {saved:true};
    }
    const p=z.object({id:z.string().uuid(),state:z.enum(["accepted","rejected"]),reason:z.string().trim().min(5).max(2000),quality:z.enum(["positive","negative","none"]),hold:z.boolean()}).strict().parse(body);
    checked(await ctx.db.rpc("science_resolve_feedback",{p_feedback:p.id,p_admin:admin,p_state:p.state,p_reason:p.reason,p_quality:p.quality,p_hold:p.hold}));return {saved:true};
  });
}
