import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isUpstashConfigured } from "@/src/lib/security/config";

type LimitConfig = {
  requests: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function getRedisLimiter(scope: string, config: LimitConfig) {
  const redis = Redis.fromEnv();
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `sci-test:${scope}`,
    analytics: false
  });
}

const limiterCache = new Map<string, Ratelimit>();

function getLimiter(scope: string, config: LimitConfig) {
  const key = `${scope}:${config.requests}:${config.window}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;

  const limiter = getRedisLimiter(scope, config);
  limiterCache.set(key, limiter);
  return limiter;
}

function enforceMemoryLimit(key: string, config: LimitConfig) {
  const now = Date.now();
  const windowMs = parseWindowMs(config.window);
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= config.requests) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  bucket.count += 1;
  return null;
}

function parseWindowMs(window: LimitConfig["window"]) {
  const [amount, unit] = window.split(" ") as [string, LimitConfig["window"] extends `${number} ${infer U}` ? U : never];
  const value = Number(amount);
  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    default:
      return 60_000;
  }
}

export function getClientIp(request?: Request) {
  if (!request) return "unknown";
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function enforceRateLimit(key: string, scope: string, config: LimitConfig, request?: Request) {
  const identifier = `${key}:${getClientIp(request)}`;

  if (!isUpstashConfigured()) {
    return enforceMemoryLimit(identifier, config);
  }

  const limiter = getLimiter(scope, config);
  const result = await limiter.limit(identifier);
  if (result.success) return null;

  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return NextResponse.json(
    { error: "too many requests" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

export const rateLimitPolicies = {
  examStart: { requests: 30, window: "1 m" as const },
  examAnswer: { requests: 120, window: "1 m" as const },
  examNext: { requests: 120, window: "1 m" as const },
  trainingAnswer: { requests: 120, window: "1 m" as const },
  trainingNext: { requests: 120, window: "1 m" as const },
  auth: { requests: 10, window: "1 m" as const }
};
