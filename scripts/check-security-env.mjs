#!/usr/bin/env node

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const checks = [
  {
    name: "Cloudflare Turnstile（サイトキー）",
    ok: Boolean(turnstileSiteKey),
    env: "NEXT_PUBLIC_TURNSTILE_SITE_KEY"
  },
  {
    name: "Cloudflare Turnstile（シークレット）",
    ok: Boolean(turnstileSecret),
    env: "TURNSTILE_SECRET_KEY"
  },
  {
    name: "Upstash Redis（URL）",
    ok: Boolean(upstashUrl),
    env: "UPSTASH_REDIS_REST_URL"
  },
  {
    name: "Upstash Redis（トークン）",
    ok: Boolean(upstashToken),
    env: "UPSTASH_REDIS_REST_TOKEN"
  }
];

console.log("全分野科学検定 — セキュリティ環境変数チェック\n");
console.log(`APP URL: ${appUrl}\n`);

for (const check of checks) {
  console.log(`${check.ok ? "✅" : "❌"} ${check.name} (${check.env})`);
}

const turnstileReady = Boolean(turnstileSiteKey && turnstileSecret);
const upstashReady = Boolean(upstashUrl && upstashToken);

console.log("\n--- 状態 ---");
console.log(`Turnstile: ${turnstileReady ? "有効" : "未設定（ボット対策オフ）"}`);
console.log(`Upstash:   ${upstashReady ? "有効" : "未設定（メモリ制限のみ）"}`);

if (!turnstileReady || !upstashReady) {
  console.log("\n--- あなたが行う操作 ---");
  if (!turnstileReady) {
    console.log("1. Cloudflare Dashboard → Turnstile → サイトを追加");
    console.log("   - ホスト名: sci-test.rikei-talk.com, localhost");
    console.log("   - ウィジェットモード: Managed（推奨）");
    console.log("2. Site Key → NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    console.log("3. Secret Key → TURNSTILE_SECRET_KEY");
    console.log("4. Vercel と .env.local の両方に設定");
  }
  if (!upstashReady) {
    console.log("5. Upstash Console → Create Redis Database（Region: us-east-1 推奨）");
    console.log("6. REST API の URL / Token をコピー");
    console.log("7. UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN を Vercel と .env.local に設定");
  }
  console.log("8. 設定後: pnpm security:check で再確認 → vercel deploy --prod");
  process.exitCode = 1;
} else {
  console.log("\nすべて設定済みです。");
}
