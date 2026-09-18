import { describe, expect, it } from "vitest";
import { definition } from "./definition";
import { expectedScoreVarianceReduction, posterior, type Response } from "./model";
import { selectCandidate, type Candidate } from "./selection";
import { isShort, readingLoad, TRIAL_POLICY, LEGACY_TRIAL_POLICY, trialPool, trialTarget } from "./trial-policy";

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
  it("starts at 75–85%, shifts opposite to the current accuracy gap and tempers small samples", () => {
    const answers = (correct: number, count: number) => Array.from({ length: count }, (_, i) => ({ eligible: true, correct: i < correct }));
    expect(trialTarget([])).toMatchObject({ min: .75, max: .85, count: 0 });
    expect(trialTarget(answers(8, 10))).toMatchObject({ min: .75, max: .85 });
    expect(trialTarget(answers(12, 20))).toMatchObject({ min: .8214, max: .9214, count: 20, correct: 12 });
    expect(trialTarget(answers(19, 20))).toMatchObject({ min: .6964, max: .7964 });
    expect(trialTarget(answers(0, 1)).shift).toBeLessThan(.05);
    expect(trialTarget(answers(0, 1)).shift).toBeLessThan(trialTarget(answers(0, 5)).shift);
    expect(trialTarget(answers(0, 100))).toMatchObject({ min: .85, max: .95 });
    expect(trialTarget(answers(100, 100))).toMatchObject({ min: .6574, max: .7574 });
    expect(trialTarget([...answers(8, 10), { eligible: false, correct: false }])).toEqual(trialTarget(answers(8, 10)));
  });
  it("prefers the easier side only after quotas/unseen selection, even when the hard side is closer", () => {
    const hard = withPrediction("hard", .74), easy = withPrediction("easy", .91), easiest = withPrediction("easiest", .96);
    const current = selectCandidate([hard, easy, easiest], [], definition("trial"), () => 0)!;
    expect(current.candidate.revisionId).toBe("easy");
    expect(current.reason).toContain("easier-probability-fallback:target=0.7500..0.8500:feedback=0/0");
    const legacy = selectCandidate([hard, easy], [], { ...definition("trial"), selectionPolicy: LEGACY_TRIAL_POLICY }, () => 0)!;
    expect(legacy.candidate.revisionId).toBe("hard");
    expect(legacy.target).toBeNull(); expect(legacy.reason).toContain(LEGACY_TRIAL_POLICY);
    const unseen = selectCandidate([hard, { ...easy, seenCount: 1 }], [], definition("trial"), () => 0)!;
    expect(unseen.candidate.revisionId).toBe("hard");
    const onlyHard = trialPool([entry(.6), entry(.74)], { min: .75, max: .85 }, true);
    expect(onlyHard.pool[0].predicted).toBe(.74);
  });
  it("uses previous history for ability, but only this attempt for target feedback", () => {
    const history: Response[] = Array.from({ length: 20 }, () => ({ ...base, eligible: true, correct: false }));
    const original = structuredClone(history);
    const selected = selectCandidate([withPrediction("candidate", .8)], [], definition("trial"), () => 0, history)!;
    expect(selected.target).toMatchObject({ min: .75, max: .85, count: 0 });
    expect(selected.predicted).toBeLessThan(.8);
    expect(history).toEqual(original);
    const full = selectCandidate([withPrediction("candidate", .8)], [], definition("full"), () => 0, history)!;
    expect(full.predicted).toBeCloseTo(.8); expect(full.target).toBeNull();
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
    expect(fallback.reason).toContain(`repeat-fallback-v1:${TRIAL_POLICY}:`);
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
