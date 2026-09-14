import { NextRequest } from "next/server";
import { z } from "zod";
import { communityData, draftInput, questionContent, saveDraft } from "@/src/lib/science/community";
import { checked, context, endpoint, rateLimit, requireUser, ScienceError } from "@/src/lib/science/server";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{action:string}>}){
  return endpoint(request,async()=>{
    const action=z.enum(["list","save","submit"]).parse((await params).action);
    const raw=await request.text();if(raw.length>32768)throw new ScienceError("入力が長すぎます。",413);
    const body=JSON.parse(raw),ctx=await context(true);
    await rateLimit(ctx,"community",30);
    if(action==="list"){z.object({}).strict().parse(body);return communityData(ctx);}
    if(action==="save")return saveDraft(ctx,draftInput.parse(body));
    const userId=requireUser(ctx);
    const input=z.object({id:z.string().uuid(),revision:z.number().int().min(1),licenseVersion:z.string().min(1).max(100),licenseHash:z.string().regex(/^[a-f0-9]{64}$/),rights:z.literal(true),adultOrGuardianConsent:z.literal(true)}).strict().parse(body);
    const draft=checked<{content:unknown}>(await ctx.db.from("science_submission_drafts").select("content").eq("id",input.id).eq("author_id",userId).single());
    questionContent.parse(draft.content);
    await rateLimit(ctx,"submit",5,3600);
    const revisionId=checked(await ctx.db.rpc("science_submit_draft",{p_draft:input.id,p_user:userId,p_revision:input.revision,p_family:`community:${input.id}`,p_license:input.licenseVersion,p_representations:{rights:input.rights,adultOrGuardianConsent:input.adultOrGuardianConsent,licenseHash:input.licenseHash}}));
    return {saved:true,revisionId};
  });
}
