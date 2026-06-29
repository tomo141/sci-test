import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getAppUrl } from "@/src/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/mypage";
  const supabase = await createServerSupabaseClient();

  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, getAppUrl()));
}
