import { describe, expect, it } from "vitest";
import { domains } from "@/src/lib/data/taxonomy";
import { scoreResponses, type Response } from "./model";
import { definition, type ExamKind } from "./definition";
import { examProgress } from "./exam-progress";

const answer: Response = { domain: "数学", a: 1, b: 0, c: .25, correct: true, eligible: true };
function result(responses: Response[], kind: ExamKind = "trial") {
  return { ...scoreResponses(responses), definition: definition(kind, "数学"), answerCount: responses.length, correctCount: responses.filter(row => row.correct).length };
}
describe("interim score display", () => {
  it("waits for an eligible answer then includes nine unmeasured priors, without altering the stored result", () => {
    expect(examProgress(result([])).score).toBeNull();
    const scored = result([answer]);
    const snapshot = structuredClone(scored);
    const progress = examProgress(scored);
    expect(progress).toMatchObject({ answerCount: 1, correctCount: 1, score: { scale: "total", unmeasuredDomains: 9, value: scored.domains.数学.score! + 450 } });
    expect(progress.score!.low).toBeLessThan(progress.score!.value);
    expect(progress.score!.high).toBeGreaterThan(progress.score!.value);
    expect(scored).toEqual(snapshot);
    expect(scored.total).toBeNull();
  });
  it("matches the completed total and interval after all ten domains are measured", () => {
    const scored = result(domains.flatMap(domain => Array.from({length: 5}, (_, i) => ({ ...answer, domain, correct: i % 2 === 0 }))));
    expect(examProgress(scored).score).toEqual({ value: scored.total, low: scored.low, high: scored.high, unmeasuredDomains: 0, scale: "total" });
  });
  it("shows domain-only scores on the same 1–99 scale as results", () => {
    const scored = result([answer], "domain");
    expect(examProgress(scored).score).toEqual({ value: scored.domains.数学.score, low: scored.domains.数学.low, high: scored.domains.数学.high, scale: "domain", unmeasuredDomains: 0 });
  });
  it.each(["weekly", "lab"] as const)("keeps %s as correct-count participation without a formal score", kind => {
    expect(examProgress(result([answer], kind))).toEqual({ answerCount: 1, correctCount: 1, score: null });
  });
  it("does not invent ability from an excluded response", () => {
    expect(examProgress(result([{ ...answer, eligible: false }])).score).toBeNull();
  });
});
