import { NextResponse } from "next/server";
import { loadLatestSessionAnswersForUser, loadSessionAnswersFromDb } from "@/src/lib/exam/loadSessionAnswers";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  const authClient = await createServerSupabaseClient();
  const userId = (await authClient?.auth.getUser())?.data.user?.id ?? null;
  const readClient = createServiceRoleClient() || authClient;
  if (!readClient) {
    return NextResponse.json({ answers: [], source: "none" });
  }

  if (sessionId && !sessionId.startsWith("local-")) {
    const answers = await loadSessionAnswersFromDb(readClient, sessionId);
    if (answers.length) {
      return NextResponse.json({ answers, source: "database", sessionId });
    }
  }

  if (userId) {
    const latest = await loadLatestSessionAnswersForUser(readClient, userId);
    if (latest) {
      return NextResponse.json({
        answers: latest.answers,
        source: "database",
        sessionId: latest.sessionId
      });
    }
  }

  return NextResponse.json({ answers: [], source: "none" });
}
