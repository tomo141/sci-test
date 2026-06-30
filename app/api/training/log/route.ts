import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";
import { trainingConfig } from "@/src/lib/training/config";

const schema = z.object({
  questionId: z.string(),
  correct: z.boolean(),
  mode: z.enum(["domain", "random"])
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const supabase = createServiceRoleClient();
  if (!supabase) return NextResponse.json({ ok: true, stored: "local-only" });

  const authClient = await createServerSupabaseClient();
  const userId = (await authClient?.auth.getUser())?.data.user?.id ?? null;

  if (userId) {
    const [consentResult, countResult] = await Promise.all([
      supabase.from("marketing_consents").select("consented").eq("user_id", userId).maybeSingle(),
      supabase
        .from("event_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("event_name", "training_answer")
    ]);

    const marketingConsented = consentResult.data?.consented === true;
    const answerCount = countResult.count ?? 0;
    if (!marketingConsented && answerCount >= trainingConfig.freeAnswerLimit) {
      return NextResponse.json({ error: "training limit reached; marketing consent required" }, { status: 403 });
    }
  }

  await supabase.from("event_logs").insert({
    user_id: userId,
    event_name: "training_answer",
    metadata: parsed.data
  });

  return NextResponse.json({ ok: true });
}
