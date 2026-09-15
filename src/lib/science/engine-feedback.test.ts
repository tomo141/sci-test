import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "./server";

vi.mock("./server", () => ({
  ScienceError: class extends Error {}, rateLimit: vi.fn(), releaseConfig: vi.fn(),
  checked: (result: { data: unknown; error?: unknown }) => { if (result.error) throw new Error("commit_failed"); return result.data; }
}));
vi.mock("./community", () => ({ authorWeights: vi.fn() }));
vi.mock("./corrections", () => ({
  refreshCorrectedAttempt: async (_db: unknown, attempt: unknown) => attempt,
  correctionState: async () => ({ epoch: 0, updates: new Map(), ineligibleOrdinals: new Set() }),
  correctedResult: () => ({ total: 500 })
}));
import { answerExam, examState } from "./engine";

describe("committed answer disclosure boundary", () => {
  let context: Context;
  let attempt: Record<string, unknown>;
  let answers: Record<string, unknown>[];
  let commit: ReturnType<typeof vi.fn>;
  const issued = { ordinal: 0, token: "issued-token", revision_id: "fixture-revision", choice_order: [2,0,3,1], eligible: true,
    snapshot: { a: 1, b: 0, c: .25, domain: "数学", content: { question: "Fixture question", choices: ["1","2","3","4"], correctIndex: 1, explanation: "1 + 1 = 2", sources: [] } } };
  const input = { attemptId: "owned-attempt", ordinal: 0, token: "issued-token", operationId: "operation", selectedIndex: 3 };
  beforeEach(() => {
    attempt = { id: "owned-attempt", visitor_id: "owner", user_id: null, ordinal: 0, state: "active", kind: "trial", total: 20, definition: {} };
    answers = [];
    commit = vi.fn(async () => ({ data: { ...attempt, ordinal: 1 } }));
    context = { visitor: { id: "owner", route_group: "A" }, userId: null,
      db: { rpc: commit, from: (table: string) => {
        const result = { data: table === "science_attempts" ? attempt : table === "science_issued" ? [issued] : answers };
        const query = { select: () => query, eq: () => query, order: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result) };
        return query;
      } }
    } as unknown as Context;
  });
  it.each(["trial", "full", "domain", "weekly", "lab"])("reveals feedback after successful commitment in %s", async kind => {
    attempt.kind = kind;
    expect((await answerExam(context, input)).explanation).toMatchObject({ correct: true, correctAnswer: "2" });
    expect(commit).toHaveBeenCalledWith("science_commit_answer", expect.objectContaining({ p_token: "issued-token", p_selected: 3 }));
  });
  it("does not reveal an answer when commitment fails or the issue token is forged", async () => {
    commit.mockResolvedValueOnce({ data: null, error: true });
    await expect(answerExam(context, input)).rejects.toThrow("commit_failed");
    await expect(answerExam(context, { ...input, token: "forged" })).rejects.toThrow("提示された問題と一致しません");
    expect(commit).toHaveBeenCalledTimes(1);
  });
  it("requires a committed answer and matching owner before reopening feedback", async () => {
    await expect(examState(context, "owned-attempt", 0)).rejects.toThrow("保存済みの回答が見つかりません");
    answers.push({ ordinal: 0, selected_index: 3, is_correct: true });
    expect((await examState(context, "owned-attempt", 0)).explanation).toMatchObject({ correctAnswer: "2" });
    attempt.visitor_id = "someone-else";
    await expect(examState(context, "owned-attempt", 0)).rejects.toThrow("受験が見つかりません");
  });
});
