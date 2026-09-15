import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "./server";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), releaseConfig: vi.fn() }));
vi.mock("./server", () => ({ ...mocks, checked: (r: { data: unknown; error: unknown }) => {
  if (r.error) throw new Error("database_error");
  return r.data;
} }));
import { adminData } from "./admin";

function context(email: string | null) {
  const repeats = [{ attempt_id: "synthetic-attempt", kind: "trial", repeat_count: 2, presented_count: 20,
    last_repeat_at: "2026-09-16T00:00:00Z", domains: "数学", max_presentation_count: 2 }];
  const from = vi.fn((table: string) => {
    const chain: Record<string, unknown> = {};
    for (const name of ["select", "eq", "in", "order", "limit"]) chain[name] = vi.fn(() => chain);
    chain.then = (resolve: (result: unknown) => void) => resolve({ data: table === "science_repeat_alerts" ? repeats : [], error: null });
    return chain;
  });
  return { db: { from, rpc: vi.fn().mockResolvedValue({ data: [], error: null }) },
    userId: "synthetic-admin", verifiedEmail: email } as unknown as Context;
}

describe("repeat alerts visible only to the verified operator", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAdmin.mockResolvedValue("synthetic-admin");
    mocks.releaseConfig.mockResolvedValue({ experiment: "entry-route-v1" });
  });
  it("checks administrator authority before any report query", async () => {
    const ctx = context("tomoyoshi@rikei-talk.com");
    mocks.requireAdmin.mockRejectedValue(new Error("forbidden"));
    await expect(adminData(ctx)).rejects.toThrow("forbidden");
    expect(ctx.db.from).not.toHaveBeenCalled();
  });
  it("omits repeat data and does not query it for another administrator", async () => {
    for (const email of [null, "other-admin@example.invalid"]) {
      const ctx = context(email);
      expect((await adminData(ctx)).repeats).toBeNull();
      expect(ctx.db.from).not.toHaveBeenCalledWith("science_repeat_alerts");
    }
  });
  it("returns aggregate repeat counts to the verified operator", async () => {
    const ctx = context("tomoyoshi@rikei-talk.com");
    expect((await adminData(ctx)).repeats).toEqual([expect.objectContaining({ repeat_count: 2, presented_count: 20 })]);
    expect(ctx.db.from).toHaveBeenCalledWith("science_repeat_alerts");
  });
});
