import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAppUrl } from "@/src/lib/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") || "/mypage";
  const next = nextParam.startsWith("/") ? nextParam : "/mypage";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !url || !key) {
    return NextResponse.redirect(new URL("/login?error=auth", getAppUrl()));
  }

  const redirectResponse = NextResponse.redirect(new URL(next, getAppUrl()));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => redirectResponse.cookies.set(name, value, options));
      }
    }
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, getAppUrl()));
  }

  return redirectResponse;
}
