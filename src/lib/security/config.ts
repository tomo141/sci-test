import { getAppUrl, isTurnstileConfigured } from "@/src/lib/env";

export function isUpstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function isProductionDeployment() {
  const appUrl = getAppUrl();
  return process.env.NODE_ENV === "production" || appUrl.startsWith("https://");
}

export function isSecurityStrictMode() {
  return process.env.SECURITY_STRICT === "1" || process.env.SECURITY_STRICT === "true";
}

export type SecurityStatus = {
  turnstile: boolean;
  upstash: boolean;
  production: boolean;
  strict: boolean;
  ready: boolean;
  missing: string[];
};

export function getSecurityStatus(): SecurityStatus {
  const turnstile = isTurnstileConfigured();
  const upstash = isUpstashConfigured();
  const production = isProductionDeployment();
  const strict = isSecurityStrictMode();
  const missing: string[] = [];

  if (!turnstile) {
    missing.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY");
  }
  if (!upstash) {
    missing.push("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN");
  }

  return {
    turnstile,
    upstash,
    production,
    strict,
    ready: turnstile && upstash,
    missing: [...new Set(missing)]
  };
}
