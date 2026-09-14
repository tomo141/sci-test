import { NextRequest } from "next/server";
import { z } from "zod";
import { domains } from "@/src/lib/data/taxonomy";
import { answerExam, examState, ownedAttempt, reviewAttempt, startExam } from "@/src/lib/science/engine";
import { checked, context, endpoint, rateLimit, requireUser, ScienceError } from "@/src/lib/science/server";

const id = z.string().uuid();
const attemptInput = z.object({ attemptId: id }).strict();
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  return endpoint(request, async () => {
    const action = (await params).action;
    const raw = await request.text();
    if (raw.length > 32_768) throw new ScienceError("入力が長すぎます。", 413);
    const body = JSON.parse(raw);
    const ctx = await context(true, action === "start" ? body.refShare : undefined);
    if (action === "start") {
      const input = z.object({ kind: z.enum(["trial", "full", "domain", "weekly", "lab"]), domain: z.enum(domains).optional(), refShare: id.optional() }).strict().parse(body);
      return startExam(ctx, input.kind, input.domain);
    }
    if (action === "state") {
      await rateLimit(ctx, "state", 120);
      return examState(ctx, attemptInput.parse(body).attemptId);
    }
    if (action === "answer") {
      return answerExam(ctx, z.object({ attemptId: id, ordinal: z.number().int().min(0).max(99), token: id, operationId: id, selectedIndex: z.number().int().min(0).max(3) }).strict().parse(body));
    }
    if (action === "review") return reviewAttempt(ctx, attemptInput.parse(body).attemptId);
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
      const review = await reviewAttempt(ctx, input.attemptId);
      if (!review.rows.some((r) => r.revisionId === input.revisionId)) throw new ScienceError("復習できる問題が見つかりません。", 404);
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
