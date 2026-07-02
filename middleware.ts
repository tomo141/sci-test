import { type NextRequest, NextResponse } from "next/server";
import { maybeRateLimitApi } from "@/src/lib/security/middlewareRateLimit";
import { updateSession } from "@/src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const limited = await maybeRateLimitApi(request);
  if (limited) return limited;

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
