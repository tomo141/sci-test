import { NextResponse } from "next/server";
import { z } from "zod";
import { loadSessionAnswersFromDb } from "@/src/lib/exam/loadSessionAnswers";
import { persistProficiencyEstimates } from "@/src/lib/exam/persistEstimates";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";
import { estimateFromAnswers } from "@/src/lib/scoring";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";

const saveSchema = z.object({
  sessionId: z.string(),
  score: z.number(),
  scoreLow: z.number(),
  scoreHigh: z.number(),
  answerCount: z.number().int().nonnegative(),
  scoreKind: z.enum(["overall", "domain", "subdomain"]).optional(),
  domain: z.string().optional(),
  subdomain: z.string().optional()
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit("exam-save", "exam-answer", rateLimitPolicies.examAnswer, request);
  if (limited) return limited;

  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid save payload" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const authUser = user?.data.user;
  const userId = authUser?.id;
  if (!supabase || !userId) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  const writeClient = createServiceRoleClient() || supabase;
  const email = authUser.email || "";
  const nickname = typeof authUser.user_metadata?.nickname === "string" ? authUser.user_metadata.nickname : null;
  const { error: profileError } = await writeClient.from("profiles").upsert({
    id: userId,
    email,
    nickname,
    updated_at: new Date().toISOString()
  });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const scoreHistoryRow = {
    user_id: userId,
    session_id: parsed.data.sessionId.startsWith("local-") ? null : parsed.data.sessionId,
    score: parsed.data.score,
    score_low: parsed.data.scoreLow,
    score_high: parsed.data.scoreHigh,
    answer_count: parsed.data.answerCount,
    score_kind: parsed.data.scoreKind || "overall",
    domain: parsed.data.scoreKind === "domain" || parsed.data.scoreKind === "subdomain" ? parsed.data.domain || null : null,
    subdomain: parsed.data.scoreKind === "subdomain" ? parsed.data.subdomain || null : null
  };
  let { error } = await writeClient.from("score_history").insert(scoreHistoryRow);

  if (error?.message?.includes("score_kind") || error?.message?.includes("domain") || error?.message?.includes("subdomain")) {
    const retry = await writeClient.from("score_history").insert({
      user_id: scoreHistoryRow.user_id,
      session_id: scoreHistoryRow.session_id,
      score: scoreHistoryRow.score,
      score_low: scoreHistoryRow.score_low,
      score_high: scoreHistoryRow.score_high,
      answer_count: scoreHistoryRow.answer_count
    });
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessionId = parsed.data.sessionId.startsWith("local-") ? null : parsed.data.sessionId;
  if (sessionId) {
    const bank = await getPublishedQuestions();
    const answers = await loadSessionAnswersFromDb(writeClient, sessionId, bank);
    if (answers.length) {
      const estimate = estimateFromAnswers(answers);
      await persistProficiencyEstimates(writeClient, sessionId, userId, estimate);
    }
  }

  return NextResponse.json({ ok: true });
}
