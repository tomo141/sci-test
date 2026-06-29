import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { verifyTurnstile } from "@/src/lib/security/turnstile";

const feedbackSchema = z.object({
  questionId: z.string().uuid(),
  feedback: z.enum(["good", "bad"]),
  reasons: z.array(z.string()).optional(),
  comment: z.string().max(1000).optional(),
  turnstileToken: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid feedback payload" }, { status: 400 });

  const turnstileForm = new FormData();
  if (parsed.data.turnstileToken) turnstileForm.set("cf-turnstile-response", parsed.data.turnstileToken);
  if (!(await verifyTurnstile(turnstileForm.get("cf-turnstile-response")))) {
    return NextResponse.json({ error: "turnstile verification failed" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const user = await supabase?.auth.getUser();
  const userId = user?.data.user?.id;
  if (!supabase || !userId) return NextResponse.json({ error: "login required" }, { status: 401 });

  const { count } = await supabase
    .from("exam_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_50_at", "is", null);

  if (!count) return NextResponse.json({ error: "50 completed answers required" }, { status: 403 });

  const { data: latestScore } = await supabase
    .from("score_history")
    .select("score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const feedbackWeight = Math.max(0.1, Math.min(1, Number(latestScore?.score || 500) / 990));

  const { error } = await supabase.from("question_feedback").insert({
    question_id: parsed.data.questionId,
    user_id: userId,
    feedback: parsed.data.feedback,
    reasons: parsed.data.reasons || [],
    comment: parsed.data.comment || null,
    feedback_weight: feedbackWeight
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
