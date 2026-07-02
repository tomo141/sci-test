import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getSecurityStatus } from "./config";

describe("getSecurityStatus", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env = { ...original };
  });

  afterEach(() => {
    process.env = original;
  });

  it("reports missing security env vars", () => {
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const status = getSecurityStatus();
    expect(status.turnstile).toBe(false);
    expect(status.upstash).toBe(false);
    expect(status.ready).toBe(false);
    expect(status.missing).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    expect(status.missing).toContain("UPSTASH_REDIS_REST_URL");
  });

  it("reports ready when all security env vars exist", () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const status = getSecurityStatus();
    expect(status.ready).toBe(true);
    expect(status.missing).toEqual([]);
  });
});
