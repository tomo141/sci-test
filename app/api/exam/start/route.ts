import { NextResponse } from "next/server";
import { z } from "zod";
import { createDomainExamPlan, createExamPlan } from "@/src/lib/scoring";
import { isScienceDomain } from "@/src/lib/exam/session";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";
import { createServiceRoleClient } from "@/src/lib/supabase/server";

const startSchema = z.object({
  anonymousSessionId: z.string().optional(),
  sessionSeed: z.string().optional(),
  examPlan: z.any().optional(),
  examMode: z.enum(["overall", "domain"]).optional(),
  targetDomain: z.string().optional()
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit("exam-start", "exam-start", rateLimitPolicies.examStart, request);
  if (limited) return limited;
  const parsed = startSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : {};
  const anonymousSessionId = body.anonymousSessionId || crypto.randomUUID();
  const examPlan =
    body.examPlan ||
    (body.examMode === "domain" && isScienceDomain(body.targetDomain)
      ? createDomainExamPlan(body.targetDomain, body.sessionSeed)
      : createExamPlan(body.sessionSeed));
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({
      sessionId: `local-${anonymousSessionId}`,
      anonymousSessionId,
      examPlan,
      demo: true
    });
  }

  const insertPayload = {
    anonymous_session_id: anonymousSessionId,
    status: "active",
    exam_mode: examPlan.mode || "overall",
    target_domain: examPlan.mode === "domain" ? examPlan.targetDomain : null
  };
  let { data, error } = await supabase
    .from("exam_sessions")
    .insert(insertPayload)
    .select("id, anonymous_session_id")
    .single();

  if (error?.message?.includes("exam_mode") || error?.message?.includes("target_domain")) {
    const retry = await supabase
      .from("exam_sessions")
      .insert({ anonymous_session_id: anonymousSessionId, status: "active" })
      .select("id, anonymous_session_id")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) return NextResponse.json({ error: error?.message || "failed to start exam" }, { status: 500 });
  return NextResponse.json({ sessionId: data.id, anonymousSessionId: data.anonymous_session_id, examPlan });
}
