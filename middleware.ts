import { type NextRequest, NextResponse } from "next/server";
import { maybeRateLimitApi } from "@/src/lib/security/middlewareRateLimit";
import { updateSession } from "@/src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Mail tokens and job Bearer tokens are independent of a browser login/session.
  if (request.nextUrl.pathname.startsWith("/unsubscribe/") || request.nextUrl.pathname.startsWith("/api/science-jobs/")) return NextResponse.next();
  const limited = await maybeRateLimitApi(request);
  if (limited) return limited;

  return updateSession(request);
}

export const config = {
  runtime:"nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
