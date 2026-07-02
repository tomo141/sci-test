import { isTurnstileConfigured } from "@/src/lib/env";

type TurnstileVerifyResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstile(token: FormDataEntryValue | null) {
  if (!isTurnstileConfigured()) return true;
  if (!token || typeof token !== "string") return false;

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY || "",
      response: token
    }),
    signal: AbortSignal.timeout(10_000)
  }).catch(() => null);

  if (!response?.ok) return false;
  const payload = (await response.json().catch(() => null)) as TurnstileVerifyResponse | null;
  return payload?.success === true;
}
