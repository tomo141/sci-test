import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse, type NextRequest } from "next/server";
import { isUpstashConfigured } from "@/src/lib/security/config";

let apiLimiter: Ratelimit | null = null;

function getApiLimiter() {
  if (!isUpstashConfigured()) return null;
  if (!apiLimiter) {
    apiLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(240, "1 m"),
      prefix: "sci-test:middleware:api",
      analytics: false
    });
  }
  return apiLimiter;
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function maybeRateLimitApi(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return null;

  const limiter = getApiLimiter();
  if (!limiter) return null;

  const result = await limiter.limit(getClientIp(request));
  if (result.success) return null;

  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
