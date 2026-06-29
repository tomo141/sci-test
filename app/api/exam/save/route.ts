import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

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
  const userId = user?.data.user?.id;
  if (!supabase || !userId) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  const { error } = await supabase.from("score_history").insert({
    user_id: userId,
    session_id: parsed.data.sessionId.startsWith("local-") ? null : parsed.data.sessionId,
    score: parsed.data.score,
    score_low: parsed.data.scoreLow,
    score_high: parsed.data.scoreHigh,
    answer_count: parsed.data.answerCount
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
