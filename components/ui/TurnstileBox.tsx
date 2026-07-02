"use client";

import Script from "next/script";

export function TurnstileBox() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div
        className="cf-turnstile min-h-[65px]"
        data-sitekey={siteKey}
        data-language="ja"
        data-theme="light"
        data-size="normal"
      />
      <p className="text-xs font-bold text-[var(--color-muted)]">
        ボット対策のため、セキュリティ確認を行っています。
      </p>
    </>
  );
}
