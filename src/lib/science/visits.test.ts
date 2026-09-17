import { describe, expect, it, vi } from "vitest";
import type { Context } from "./server";
vi.mock("./server", () => ({ checked: (r: { error?: string }) => { if (r.error) throw new Error(r.error); return r; }, rateLimit: vi.fn() }));
import { recordScienceVisit } from "./visits";

describe("minimal return-visit measurement", () => {
  it("deduplicates the same existing visitor per hour without storing page details or email", async () => {
    const upsert = vi.fn(() => ({ select: () => Promise.resolve({ data: [] }) }));
    const ctx = { visitor: { id: "existing-visitor" }, userId: null, db: { from: () => ({ upsert }) } } as unknown as Context;
    await recordScienceVisit(ctx, new Date("2026-09-17T04:00:00Z"));
    await recordScienceVisit(ctx, new Date("2026-09-17T04:59:00Z"));
    await recordScienceVisit(ctx, new Date("2026-09-17T05:00:00Z"));
    expect(upsert.mock.calls[0]).toEqual(upsert.mock.calls[1]);
    expect(upsert.mock.calls[2]).not.toEqual(upsert.mock.calls[0]);
    expect(upsert).toHaveBeenCalledWith({ dedupe_key: "visit:existing-visitor:2026-09-17T04", event_name: "site_visit", visitor_id: "existing-visitor", user_id: null, payload: { version: "hourly-site-visit-v1" } }, { onConflict: "dedupe_key", ignoreDuplicates: true });
  });
});
