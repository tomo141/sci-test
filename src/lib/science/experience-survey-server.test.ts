import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "./server";
import type { Attempt } from "./types";
import { definition } from "./definition";
import { EXPERIENCE_SURVEY_VERSION, experienceResponseSchema } from "./experience-survey";
vi.mock("./server", async importOriginal => ({ ...await importOriginal<typeof import("./server")>(), rateLimit: vi.fn() }));
vi.mock("./corrections", () => ({ refreshCorrectedAttempt: (_db: unknown, attempt: Attempt) => attempt }));
import { listExperiences, readExperience, saveExperience } from "./experience-survey-server";

type Row = Record<string, unknown>;
const response = { version: EXPERIENCE_SURVEY_VERSION, difficulty: "hard", tempo: "smooth", comment: "" };
function fixture() {
  const attempt = { id: "attempt", visitor_id: "visitor", user_id: null, state: "completed", kind: "trial", total: 20,
    definition: definition("trial"), release_id: "release", model_version: "science-3pl-p70-linear-v2", result_revision: 2,
    result: { total: 500, low: 300, high: 700, answerCount: 20, correctCount: 14 } } as Attempt;
  const events: Row[] = [], admins: Row[] = [], writes: string[] = [];
  let error: { message: string } | null = null;
  const db = { from(table: string) {
    const filters: [string, unknown][] = [];
    const rows = () => (table === "science_events" ? events : table === "science_attempts" ? [attempt] : table === "science_admins" ? admins : []).filter(r => filters.every(([k, v]) => (r as Row)[k] === v));
    const builder = {
      select: () => builder, eq: (k: string, v: unknown) => { filters.push([k, v]); return builder; }, order: () => builder,
      maybeSingle: async () => ({ data: rows()[0] ?? null, error }),
      range: async (start: number, end: number) => ({ data: rows().slice(start, end + 1), error }),
      upsert: (record: Row, options: { onConflict: string; ignoreDuplicates: boolean }) => {
        if (!error) { writes.push(table); if (!events.some(r => r[options.onConflict] === record[options.onConflict])) events.push({ ...record, id: `event-${events.length}`, created_at: "2026-09-18T15:00:00Z" }); }
        return { select: async () => ({ data: [], error }) };
      }
    }; return builder;
  } };
  const ctx = { db, visitor: { id: "visitor" }, userId: null } as unknown as Context;
  return { ctx, attempt, events, admins, writes, fail: () => { error = { message: "fixture_failure" }; } };
}
beforeEach(() => vi.clearAllMocks());
describe("private, owner-scoped experience survey", () => {
  it("accepts an empty comment, binds actual results on the server and returns the first saved answer on retry", async () => {
    const f = fixture();
    expect(await readExperience(f.ctx, "attempt")).toEqual({ response: null });
    const saved = await saveExperience(f.ctx, "attempt", response);
    expect(saved.response.response.comment).toBe("");
    expect(saved.response.context).toMatchObject({ questionCount: 20, correctCount: 14, score: 500, resultRevision: 2, releaseId: "release" });
    expect(await saveExperience(f.ctx, "attempt", { ...response, difficulty: "very_easy", comment: "retry" })).toEqual(saved);
    expect(f.events).toHaveLength(1); expect(f.writes.every(t => t === "science_events")).toBe(true);
    expect(f.attempt.result?.total).toBe(500);
    expect(() => experienceResponseSchema.parse({ ...response, score: 990 })).toThrow();
    expect(() => experienceResponseSchema.parse({ ...response, comment: "x".repeat(2001) })).toThrow();
    expect(() => experienceResponseSchema.parse({ ...response, tempo: "invented" })).toThrow();
  });
  it("uses the actual attempt ownership check for reads and writes, including account ownership", async () => {
    const f = fixture();
    const stranger = { ...f.ctx, visitor: { ...f.ctx.visitor, id: "other" } };
    await expect(saveExperience(stranger, "attempt", response)).rejects.toMatchObject({ status: 404 });
    await expect(readExperience(stranger, "attempt")).rejects.toMatchObject({ status: 404 });
    f.attempt.user_id = "owner";
    await expect(saveExperience(f.ctx, "attempt", response)).rejects.toMatchObject({ status: 404 });
    await expect(saveExperience({ ...stranger, userId: "owner" }, "attempt", response)).resolves.toHaveProperty("response");
    expect(f.events).toHaveLength(1);
  });
  it("rejects unfinished and unsupported exams, and never reports a failed database write as saved", async () => {
    const f = fixture();
    f.attempt.state = "active";
    await expect(saveExperience(f.ctx, "attempt", response)).rejects.toMatchObject({ code: "survey_unavailable" });
    f.attempt.state = "completed"; f.attempt.kind = "weekly";
    await expect(saveExperience(f.ctx, "attempt", response)).rejects.toMatchObject({ code: "survey_unavailable" });
    f.attempt.kind = "full"; f.attempt.total = 100;
    expect((await saveExperience(f.ctx, "attempt", response)).response.context).toMatchObject({ kind: "full", questionCount: 100 });
    f.fail(); await expect(readExperience(f.ctx, "attempt")).rejects.toMatchObject({ code: "database_error" });
  });
  it("requires the existing administrator permission for paginated private responses", async () => {
    const f = fixture();
    await expect(listExperiences(f.ctx, 0)).rejects.toMatchObject({ status: 401 });
    const admin = { ...f.ctx, userId: "admin" };
    await expect(listExperiences(admin, 0)).rejects.toMatchObject({ status: 403 });
    f.admins.push({ user_id: "admin" });
    const stored = (await saveExperience(f.ctx, "attempt", response)).response;
    for (let i = 1; i < 25; i++) f.events.push({ ...f.events[0], id: `event-${i}` });
    const first = await listExperiences(admin, 0), last = await listExperiences(admin, 1);
    expect(first.rows).toHaveLength(20); expect(first.hasMore).toBe(true);
    expect(last.rows).toHaveLength(5); expect(last.hasMore).toBe(false);
    expect(first.rows[0]).toEqual({ id: "event-0", ...stored });
    expect(first.rows[0]).not.toHaveProperty("visitor_id");
  });
});
