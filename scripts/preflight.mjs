const requiredEnv = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAILS"
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

console.log("Preflight env check passed.");
