import { NextResponse } from "next/server";
import { createExamPlan } from "@/src/lib/scoring";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";
import { createServiceRoleClient } from "@/src/lib/supabase/server";

export async function POST(request: Request) {
  const limited = await enforceRateLimit("exam-start", "exam-start", rateLimitPolicies.examStart, request);
  if (limited) return limited;
  const body = await request.json().catch(() => ({}));
  const anonymousSessionId = body.anonymousSessionId || crypto.randomUUID();
  const examPlan = body.examPlan || createExamPlan(body.sessionSeed);
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({
      sessionId: `local-${anonymousSessionId}`,
      anonymousSessionId,
      examPlan,
      demo: true
    });
  }

  const { data, error } = await supabase
    .from("exam_sessions")
    .insert({ anonymous_session_id: anonymousSessionId, status: "active" })
    .select("id, anonymous_session_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessionId: data.id, anonymousSessionId: data.anonymous_session_id, examPlan });
}
