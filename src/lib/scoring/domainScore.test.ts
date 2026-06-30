import { describe, expect, it } from "vitest";
import { scoringConfig } from "./config";
import { displayDomainScore, domainScorePercent, internalToDomainScore } from "./domainScore";
import { estimateFromAnswers } from "./estimate";

describe("domain score scale", () => {
  it("maps internal ability bounds to 1-99", () => {
    expect(internalToDomainScore(scoringConfig.minScore)).toBe(scoringConfig.domainMinScore);
    expect(internalToDomainScore(scoringConfig.maxScore)).toBe(scoringConfig.domainMaxScore);
    expect(internalToDomainScore(500)).toBe(50);
  });

  it("caps domain scores at 99 in estimates", () => {
    const estimate = estimateFromAnswers(
      Array.from({ length: 30 }, (_, i) => ({
        questionId: `domain-${i}`,
        domain: "化学" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 900,
        discrimination: 1.2,
        correct: true,
        qualityScore: 1
      }))
    );
    for (const domain of Object.values(estimate.domains)) {
      expect(domain).toBeGreaterThanOrEqual(scoringConfig.domainMinScore);
      expect(domain).toBeLessThanOrEqual(scoringConfig.domainMaxScore);
    }
  });

  it("normalizes legacy stored domain ability values", () => {
    expect(displayDomainScore(500)).toBe(50);
    expect(displayDomainScore(55)).toBe(55);
  });

  it("converts domain score to progress percent against 99", () => {
    expect(domainScorePercent(99)).toBe(100);
    expect(domainScorePercent(50)).toBeCloseTo(50.5, 1);
  });
});
