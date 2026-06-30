import { NextResponse } from "next/server";
import { z } from "zod";
import { loadSessionAnswersFromDb } from "@/src/lib/exam/loadSessionAnswers";
import { persistProficiencyEstimates } from "@/src/lib/exam/persistEstimates";
import { estimateFromAnswers } from "@/src/lib/scoring";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";

const saveSchema = z.object({
  sessionId: z.string(),
  score: z.number(),
  scoreLow: z.number(),
  scoreHigh: z.number(),
  answerCount: z.number().int().nonnegative()
});

export async function POST(request: Request) {
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

  const { error } = await writeClient.from("score_history").insert({
    user_id: userId,
    session_id: parsed.data.sessionId.startsWith("local-") ? null : parsed.data.sessionId,
    score: parsed.data.score,
    score_low: parsed.data.scoreLow,
    score_high: parsed.data.scoreHigh,
    answer_count: parsed.data.answerCount
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sessionId = parsed.data.sessionId.startsWith("local-") ? null : parsed.data.sessionId;
  if (sessionId) {
    const answers = await loadSessionAnswersFromDb(writeClient, sessionId);
    if (answers.length) {
      const estimate = estimateFromAnswers(answers);
      await persistProficiencyEstimates(writeClient, sessionId, userId, estimate);
    }
  }

  return NextResponse.json({ ok: true });
}
