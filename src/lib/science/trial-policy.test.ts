import { describe, expect, it } from "vitest";
import { definition } from "./definition";
import { expectedScoreVarianceReduction, posterior, type Response } from "./model";
import { selectCandidate, type Candidate } from "./selection";
import { isShort, readingLoad, TRIAL_POLICY, trialPool } from "./trial-policy";

const short = { stem: 30, longestChoice: 10 };
const long = { stem: 90, longestChoice: 30 };
const entry = (predicted: number, reading = short) => ({ predicted, candidate: { reading } });
const base: Candidate = { revisionId: "base", familyId: "base", domain: "数学", a: 1, b: 0, c: .25, focus: false, anchor: false, authorId: null, exposures: 0 };
function withPrediction(id: string, target: number, reading = short): Candidate {
  let low = -10, high = 10;
  for (let n = 0; n < 50; n++) {
    const b = (low + high) / 2;
    if (expectedScoreVarianceReduction(posterior([]), { ...base, b }).predicted > target) low = b;
    else high = b;
  }
  return { ...base, revisionId: id, familyId: id, b: (low + high) / 2, reading };
}

describe("adopted trial fluency policy", () => {
  it("uses inclusive probability boundaries and treats unknown reading load as unknown", () => {
    expect(trialPool([entry(.7499), entry(.75), entry(.85), entry(.8501)]).pool.map(e => e.predicted)).toEqual([.75, .85]);
    expect(isShort(undefined)).toBe(false);
    expect(isShort(readingLoad({ question: "あ".repeat(45), choices: ["語".repeat(15), "😀"] }))).toBe(true);
    expect(isShort({ stem: 46, longestChoice: 1 })).toBe(false);
  });
  it("keeps both exploration and focus campaigns within short in-range candidates", () => {
    const candidates = [withPrediction("short", .79), { ...withPrediction("hard-focus", .61), focus: true }, withPrediction("long", .8, long)];
    for (const random of [0, .1, .7, .99, 1]) {
      const selected = selectCandidate(candidates, [], definition("trial"), () => random)!;
      expect(selected.candidate.revisionId).toBe("short");
      expect(selected.selectionProbability).toBeCloseTo(1);
      expect(selected.reason).toContain(`${TRIAL_POLICY}:short-in-range`);
    }
  });
  it("falls back to in-range longer items, then the nearest available probability", () => {
    const inRange = entry(.8, long), hardShort = entry(.6);
    expect(trialPool([hardShort, inRange])).toEqual({ pool: [inRange], tier: "in-range-reading-fallback" });
    const nearest = entry(.74, long);
    expect(trialPool([hardShort, nearest, entry(.95)]).pool).toEqual([nearest]);
    expect(trialPool([]).pool).toEqual([]);
  });
  it("respects domain quotas and unseen-first before fluency, and records repeat fallback", () => {
    const target = withPrediction("target", .8), unseenHard = withPrediction("unseen", .6);
    const repeated = { ...target, seenCount: 1 };
    const chosen = selectCandidate([repeated, unseenHard], [], definition("trial"), () => .5)!;
    expect(chosen.candidate.revisionId).toBe("unseen");
    expect(chosen.reason).toContain("nearest-probability-fallback");
    const otherDomain = { ...target, revisionId: "physics", familyId: "physics", domain: "物理" as const };
    const current: Response[] = [{ ...target, correct: true, eligible: true }];
    expect(selectCandidate([target, otherDomain], current, definition("trial"))!.candidate.domain).toBe("物理");
    const fallback = selectCandidate([repeated, { ...unseenHard, seenCount: 2 }], [], definition("trial"))!;
    expect(fallback.candidate.revisionId).toBe("target");
    expect(fallback.reason).toMatch(/^repeat-fallback-v1:trial-fluency-v1:/);
  });
  it("retains measurement selection in full exams and persisted older trials", () => {
    const candidates = [withPrediction("measurement", .67), withPrediction("fluent", .8)];
    const oldTrial = { ...definition("trial"), version: "exam-v3-immediate-feedback", selectionPolicy: undefined };
    const full = selectCandidate(candidates, [], definition("full"), () => 0)!;
    const old = selectCandidate(candidates, [], oldTrial, () => 0)!;
    expect(old.candidate.revisionId).toBe(full.candidate.revisionId);
    expect(old.reason).not.toContain(TRIAL_POLICY);
    expect(full.reason).not.toContain(TRIAL_POLICY);
    expect(definition("full", null, 100).version).toBe("exam-v3-immediate-feedback");
  });
  it("records the actual normalized mixture over the selected pool", () => {
    const candidates = Array.from({ length: 12 }, (_, i) => ({ ...withPrediction(String(i), .76 + i * .007), focus: i === 11 }));
    const probabilities = new Map<string, number>();
    for (let i = 0; i < 1000; i++) {
      const result = selectCandidate(candidates, [], definition("trial"), () => i / 1000)!;
      probabilities.set(result.candidate.revisionId, result.selectionProbability);
      expect(result.candidateCount).toBe(12);
    }
    expect(probabilities.size).toBe(12);
    expect([...probabilities.values()].reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
});
