import { NextRequest } from "next/server";
import { z } from "zod";
import { domains } from "@/src/lib/data/taxonomy";
import { answerExam, examState, ownedAttempt, publicAttempt, requireAnsweredRevision, reviewAttempt, startExam } from "@/src/lib/science/engine";
import { checked, context, endpoint, rateLimit, releaseConfig, requireUser, ScienceError } from "@/src/lib/science/server";
import { accountData } from "@/src/lib/science/account";
import { definition,requiresAccount } from "@/src/lib/science/definition";
import { correctionState } from "@/src/lib/science/corrections";
import { recordScienceVisit } from "@/src/lib/science/visits";
import { readExperience, saveExperience } from "@/src/lib/science/experience-survey-server";
import { experienceResponseSchema } from "@/src/lib/science/experience-survey";

const id = z.string().uuid();
const attemptInput = z.object({ attemptId: id }).strict();
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  return endpoint(request, async () => {
    const action = z.enum(["plan","start","state","result","answer","review","result_history","abandon","share","feedback","bookmark","event","account","profile","preferences","review_collection","mark_review","visit","experience_read","experience_save"]).parse((await params).action);
    const raw = await request.text();
    if (raw.length > 32_768) throw new ScienceError("入力が長すぎます。", 413);
    const body = z.record(z.unknown()).parse(JSON.parse(raw));
    const ctx = await context(action !== "visit", (action === "start" || action === "plan") && typeof body.refShare === "string" ? body.refShare : undefined);
    if (action === "experience_read") return readExperience(ctx, attemptInput.parse(body).attemptId);
    if (action === "experience_save") {
      const input = z.object({ attemptId: id, response: experienceResponseSchema }).strict().parse(body);
      return saveExperience(ctx, input.attemptId, input.response);
    }
    if (action === "visit") {
      z.object({}).strict().parse(body);
      return recordScienceVisit(ctx);
    }
    if(action==="review_collection"){
      const userId=requireUser(ctx),p=z.object({mode:z.enum(["mistakes","bookmarks"]),page:z.number().int().min(0).max(10000)}).strict().parse(body);
      await rateLimit(ctx,"review_collection",60);
      const rows=checked(await ctx.db.rpc("science_review_collection",{p_user:userId,p_mode:p.mode,p_page:p.page})) as {revision_id:string;content:unknown}[];
      const changes=await correctionState(ctx.db,rows.map(r=>r.revision_id));
      return {rows:rows.map(r=>({...r,content:changes.updates.get(r.revision_id)?.content??r.content,correction:changes.updates.get(r.revision_id)?.reason??null}))};
    }
    if(action==="mark_review"){
      const userId=requireUser(ctx),p=z.object({revisionId:id,remembered:z.boolean(),operationId:id}).strict().parse(body);
      await rateLimit(ctx,"mark_review",60);
      checked(await ctx.db.rpc("science_mark_review",{p_user:userId,p_revision:p.revisionId,p_remembered:p.remembered,p_operation:p.operationId}));return {saved:true};
    }
    if(action === "plan"){
      const input=z.object({kind:z.enum(["trial","full","domain","weekly","lab"]),domain:z.enum(domains).optional(),refShare:id.optional()}).strict().parse(body);
      const config=await releaseConfig(ctx.db);
      return {definition:definition(input.kind,input.domain,ctx.visitor.full_length),registrationRequired:!ctx.userId&&requiresAccount(ctx.visitor.route_group,input.kind),newAttempts:config.newAttempts};
    }
    if(action === "account") {
      await rateLimit(ctx,"account",30);
      return accountData(ctx,z.object({page:z.number().int().min(0).max(10000).default(0)}).strict().parse(body).page);
    }
    if(action === "profile") {
      const userId=requireUser(ctx);
      const input=z.object({nickname:z.string().trim().min(1).max(30),bio:z.string().trim().max(160),interests:z.array(z.enum(domains)).max(10),isPublic:z.boolean(),rankingOptIn:z.boolean()}).strict().parse(body);
      await rateLimit(ctx,"profile",10);
      checked(await ctx.db.from("science_profiles").update({nickname:input.nickname,bio:input.bio,interests:[...new Set(input.interests)],is_public:input.isPublic,ranking_opt_in:input.rankingOptIn,updated_at:new Date().toISOString()}).eq("user_id",userId).select("user_id").single());
      return {saved:true};
    }
    if(action === "preferences") {
      const userId=requireUser(ctx);
      const input=z.object({preferences:z.object({science:z.boolean(),weekly:z.boolean(),domain_opening:z.boolean()}).strict(),operationId:id}).strict().parse(body);
      checked(await ctx.db.rpc("science_update_consents",{p_user:userId,p_preferences:input.preferences,p_operation:input.operationId}));
      return {saved:true};
    }
    if (action === "start") {
      const input = z.object({ kind: z.enum(["trial", "full", "domain", "weekly", "lab"]), domain: z.enum(domains).optional(), refShare: id.optional() }).strict().parse(body);
      return startExam(ctx, input.kind, input.domain);
    }
    if (action === "state") {
      await rateLimit(ctx, "state", 120);
      const input = z.object({ attemptId: id, feedbackOrdinal: z.number().int().min(0).max(99).optional() }).strict().parse(body);
      return examState(ctx, input.attemptId, input.feedbackOrdinal);
    }
    if (action === "result") {
      const attempt=await ownedAttempt(ctx,attemptInput.parse(body).attemptId);
      const share=await ctx.db.from("science_shares").select("id,enabled,nickname").eq("attempt_id",attempt.id).maybeSingle();
      if(share.error)checked(share);
      return {attempt:publicAttempt(attempt),question:null,group:ctx.visitor.route_group,signedIn:!!ctx.userId,share:share.data};
    }
    if (action === "answer") {
      return answerExam(ctx, z.object({ attemptId: id, ordinal: z.number().int().min(0).max(99), token: id, operationId: id, selectedIndex: z.number().int().min(0).max(3).nullable() }).strict().parse(body));
    }
    if (action === "review") return reviewAttempt(ctx, attemptInput.parse(body).attemptId);
    if (action === "result_history") {
      const a=await ownedAttempt(ctx,attemptInput.parse(body).attemptId);
      return {rows:checked(await ctx.db.from("science_result_revisions").select("revision,result,created_at").eq("attempt_id",a.id).order("revision",{ascending:false}))};
    }
    if (action === "abandon") {
      const a = await ownedAttempt(ctx, attemptInput.parse(body).attemptId);
      if (a.state !== "active") throw new ScienceError("この受験はすでに終了しています。", 409);
      checked(await ctx.db.from("science_attempts").update({ state: "abandoned" }).eq("id", a.id).eq("state", "active").select("id").single());
      return { saved: true };
    }
    if (action === "share") {
      const input = z.object({ attemptId: id, nickname: z.string().trim().min(1).max(30), enabled: z.boolean() }).strict().parse(body);
      const a = await ownedAttempt(ctx, input.attemptId);
      if (a.state !== "completed") throw new ScienceError("受験を完了してから結果を共有できます。", 409);
      await rateLimit(ctx, "share", 15);
      const link = checked<{ id: string }>(await ctx.db.from("science_shares").upsert({ attempt_id: a.id, nickname: input.nickname, enabled: input.enabled, updated_at: new Date().toISOString() }, { onConflict: "attempt_id" }).select("id").single());
      checked(await ctx.db.from("science_events").upsert({ dedupe_key: `share:${link.id}:${input.enabled}`, event_name: input.enabled ? "share_created" : "share_revoked", visitor_id: ctx.visitor.id, user_id: ctx.userId, attempt_id: a.id }, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("id"));
      return { saved: true, id: link.id, path: `/s/${link.id}`, enabled: input.enabled };
    }
    if (action === "feedback") {
      const input = z.object({ attemptId: id, ordinal: z.number().int().min(0).max(99), category: z.enum(["answer","ambiguous","explanation","source","rights","typo","good"]), body: z.string().trim().max(2000), evidence: z.string().trim().max(2000) }).strict().parse(body);
      const a = await ownedAttempt(ctx, input.attemptId);
      const q = checked<{ revision_id: string }>(await ctx.db.from("science_issued").select("revision_id").eq("attempt_id", a.id).eq("ordinal", input.ordinal).single());
      await rateLimit(ctx, "feedback", 15);
      const report = checked(await ctx.db.from("science_feedback").upsert({ revision_id: q.revision_id, visitor_id: ctx.visitor.id, user_id: ctx.userId, category: input.category, body: input.body, evidence: input.evidence }, { onConflict: "visitor_id,revision_id,category", ignoreDuplicates: true }).select("id"));
      return { saved: true, reportIds: report.map((r) => r.id) };
    }
    if (action === "bookmark") {
      const userId = requireUser(ctx);
      const input = z.object({ attemptId: id, revisionId: id, enabled: z.boolean() }).strict().parse(body);
      await requireAnsweredRevision(ctx, input.attemptId, input.revisionId);
      const query = input.enabled ? ctx.db.from("science_bookmarks").upsert({ user_id: userId, revision_id: input.revisionId }, { onConflict: "user_id,revision_id" }).select("revision_id") : ctx.db.from("science_bookmarks").delete().eq("user_id", userId).eq("revision_id", input.revisionId).select("revision_id");
      checked(await query);
      return { saved: true };
    }
    if (action === "event") {
      const input = z.object({ attemptId: id, name: z.enum(["result_viewed", "share_button_clicked"]), operationId: id }).strict().parse(body);
      const a = await ownedAttempt(ctx, input.attemptId);
      await rateLimit(ctx, "event", 60);
      checked(await ctx.db.from("science_events").upsert({ dedupe_key: `${input.name}:${input.name === "result_viewed" ? a.id : input.operationId}`, event_name: input.name, visitor_id: ctx.visitor.id, user_id: ctx.userId, attempt_id: a.id }, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("id"));
      return { saved: true };
    }
    throw new ScienceError("この操作は利用できません。", 404, "not_found");
  });
}
