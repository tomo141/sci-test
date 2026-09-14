import { describe, expect, it } from "vitest";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { expectedScoreVarianceReduction, information, posterior, probability, scoreResponses, summarizeDomain, type Response } from "./model";
import { definition, periodBounds, requiresAccount } from "./definition";
import { hasCapacity, selectCandidate, type Candidate } from "./selection";

const response = (correct: boolean, domain: ScienceDomain = domains[0]): Response => ({ domain, correct, eligible: true, a: 1, b: 0, c: 0.25 });
describe("versioned 3PL measurement", () => {
  it("maximizes item information near 68.3% for equal a and c=.25", () => {
    const candidates = Array.from({ length: 10001 }, (_, i) => ({ a: 1, b: -5 + i / 1000, c: 0.25 }));
    const best = candidates.reduce((a, b) => information(0, a) > information(0, b) ? a : b);
    expect(probability(0, best)).toBeCloseTo((1 + Math.sqrt(3)) / 4, 3);
  });
  it("shows unmeasured domains and never fabricates an overall result from a domain exam", () => {
    const result = scoreResponses([response(true)]);
    expect(result.total).toBeNull();
    expect(result.domains.物理.score).toBeNull();
    expect(result.domains.数学.low).toBeLessThan(result.domains.数学.high!);
  });
  it("sums all ten domain scores with equal weight", () => {
    const result = scoreResponses(domains.flatMap((d) => Array.from({ length: 5 }, () => response(true, d))));
    expect(result.total).toBe(domains.reduce((sum, d) => sum + result.domains[d].score!, 0));
    expect(result.total).toBeLessThan(1000);
  });
  it("tracks growth while retaining historical answers and excluding rehearsal", () => {
    const history = [...Array.from({ length: 100 }, () => response(false)), ...Array.from({ length: 40 }, () => response(true))];
    expect(summarizeDomain(history, true).score).toBeGreaterThan(summarizeDomain(history).score!);
    expect(summarizeDomain(history, true).count).toBe(100);
    expect(summarizeDomain(history, true).weight).toBeCloseTo(39.44, 1);
    expect(history).toHaveLength(140);
    expect(scoreResponses([{ ...response(true), eligible: false }]).eligibleCount).toBe(0);
  });
  it("gives positive expected variance reduction without controlling the observed correct rate", () => {
    const prior = posterior([]);
    expect(prior.mass.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(expectedScoreVarianceReduction(prior, { a: 1, b: 0, c: 0.25 }).gain).toBeGreaterThan(0);
  });
});

describe("exam definitions, routing and selection", () => {
  it("enforces the four gates at every entry and the full length separately", () => {
    expect(["A", "B", "C", "D"].map((g) => [requiresAccount(g as "A", "full"), requiresAccount(g as "A", "domain")])).toEqual([[false,true],[true,false],[true,true],[true,true]]);
    expect(definition("trial").count).toBe(20);
    expect(definition("full", null, 100).count).toBe(100);
    expect(() => definition("domain", "存在しない分野")).toThrow();
  });
  it("covers every domain exactly twice without repeating a family", () => {
    let candidates: Candidate[] = domains.flatMap((d, i) => Array.from({ length: 8 }, (_, j) => ({ revisionId: `${i}-${j}`, familyId: `${i}-${j}`, domain: d, a: 1, b: j / 2 - 2, c: 0.25, authorId: null, focus: j < 3, anchor: false, exposures: 0 })));
    const answers: Response[] = [], selected = new Set<string>();
    expect(hasCapacity(candidates, definition("trial"))).toBe(true);
    for (let i = 0; i < 20; i++) {
      const next = selectCandidate(candidates, answers, definition("trial"), () => 0.37)!;
      expect(next.selectionProbability).toBeGreaterThan(0);
      selected.add(next.candidate.familyId);
      answers.push({ ...next.candidate, correct: true, eligible: true });
      candidates = candidates.filter((c) => c.familyId !== next.candidate.familyId);
    }
    expect(selected.size).toBe(20);
    domains.forEach((d) => expect(answers.filter((r) => r.domain === d)).toHaveLength(2));
    expect(selectCandidate([], [], definition("trial"))).toBeNull();
  });
  it("resets the weekly boundary at Monday 00:00 Japan time", () => {
    expect(periodBounds("week", new Date("2026-09-13T14:59:59Z")).key).toBe("2026-09-07");
    expect(periodBounds("week", new Date("2026-09-13T15:00:00Z"))).toEqual({ key: "2026-09-14", start: "2026-09-13T15:00:00.000Z", end: "2026-09-20T15:00:00.000Z" });
  });
});
