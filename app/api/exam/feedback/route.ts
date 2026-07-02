import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";

const feedbackSchema = z.object({
  questionId: z.string(),
  feedback: z.enum(["good", "bad"]),
  reasons: z.array(z.string()).optional(),
  comment: z.string().max(1000).optional(),
  anonymousSessionId: z.string().optional()
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit("exam-feedback", "exam-answer", rateLimitPolicies.examAnswer, request);
  if (limited) return limited;

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid feedback payload" }, { status: 400 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ ok: true, stored: "local-only" });

  const authClient = await createServerSupabaseClient();
  const userId = (await authClient?.auth.getUser())?.data.user?.id ?? null;

  await supabase.from("event_logs").insert({
    user_id: userId,
    anonymous_session_id: parsed.data.anonymousSessionId ?? null,
    event_name: "question_feedback",
    metadata: {
      questionId: parsed.data.questionId,
      feedback: parsed.data.feedback,
      reasons: parsed.data.reasons ?? [],
      comment: parsed.data.comment ?? null
    }
  });

  if (userId) {
    const { data: latestScore } = await supabase
      .from("score_history")
      .select("score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const feedbackWeight = Math.max(0.1, Math.min(1, Number(latestScore?.score || 500) / 990));

    await supabase.from("question_feedback").insert({
      question_id: parsed.data.questionId,
      user_id: userId,
      feedback: parsed.data.feedback,
      reasons: parsed.data.reasons ?? [],
      comment: parsed.data.comment ?? null,
      feedback_weight: feedbackWeight
    });
  }

  return NextResponse.json({ ok: true });
}

const cancelSchema = z.object({
  questionId: z.string(),
  feedback: z.enum(["good", "bad"]),
  anonymousSessionId: z.string().optional()
});

export async function DELETE(request: Request) {
  const parsed = cancelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid feedback payload" }, { status: 400 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ ok: true, stored: "local-only" });

  const authClient = await createServerSupabaseClient();
  const userId = (await authClient?.auth.getUser())?.data.user?.id ?? null;

  await supabase.from("event_logs").insert({
    user_id: userId,
    anonymous_session_id: parsed.data.anonymousSessionId ?? null,
    event_name: "question_feedback_cancel",
    metadata: {
      questionId: parsed.data.questionId,
      feedback: parsed.data.feedback
    }
  });

  if (userId) {
    const { data: latest } = await supabase
      .from("question_feedback")
      .select("id")
      .eq("question_id", parsed.data.questionId)
      .eq("user_id", userId)
      .eq("feedback", parsed.data.feedback)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      await supabase.from("question_feedback").delete().eq("id", latest.id);
    }
  }

  return NextResponse.json({ ok: true });
}
