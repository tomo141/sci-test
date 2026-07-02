const requiredEnv = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS"
];

const securityEnv = [
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN"
];

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl?.startsWith("https://")) {
  console.error("NEXT_PUBLIC_APP_URL must be an https:// URL in production.");
  process.exit(1);
}

const missingSecurity = securityEnv.filter((name) => !process.env[name]);
const strict = process.env.SECURITY_STRICT === "1" || process.env.SECURITY_STRICT === "true";

if (missingSecurity.length > 0) {
  const message = `Security env vars not set: ${missingSecurity.join(", ")}`;
  if (strict) {
    console.error(message);
    console.error("Set SECURITY_STRICT=0 to allow deploy without them, or run: pnpm security:check");
    process.exit(1);
  }
  console.warn(`Warning: ${message}`);
  console.warn("Turnstile and Upstash are recommended for production. See: pnpm security:check");
}

console.log("Preflight env check passed.");
