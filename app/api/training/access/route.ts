import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";
import { trainingConfig } from "@/src/lib/training/config";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const userId = (await supabase?.auth.getUser())?.data.user?.id;

  if (!userId || !supabase) {
    return NextResponse.json({
      freeLimit: trainingConfig.freeAnswerLimit,
      answerCount: 0,
      marketingConsented: false,
      canAnswer: true,
      isLoggedIn: false
    });
  }

  const serviceClient = createServiceRoleClient();
  const [consentResult, countResult] = await Promise.all([
    supabase.from("marketing_consents").select("consented").eq("user_id", userId).maybeSingle(),
    serviceClient
      ? serviceClient
          .from("event_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("event_name", "training_answer")
      : Promise.resolve({ count: 0 })
  ]);

  const marketingConsented = consentResult.data?.consented === true;
  const answerCount = countResult.count ?? 0;
  const canAnswer = marketingConsented || answerCount < trainingConfig.freeAnswerLimit;

  return NextResponse.json({
    freeLimit: trainingConfig.freeAnswerLimit,
    answerCount,
    marketingConsented,
    canAnswer,
    isLoggedIn: true
  });
}
