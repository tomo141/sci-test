import { describe, expect, it } from "vitest";
import { scoringConfig } from "./config";
import { estimateFromAnswers, cumulativeCorrectRate } from "./estimate";
import { predictCorrectProbability } from "./probability";

describe("scoring estimate", () => {
  it("predicts easier questions as more likely correct", () => {
    expect(predictCorrectProbability(600, 300)).toBeGreaterThan(predictCorrectProbability(600, 800));
  });

  it("raises score after correct difficult answers", () => {
    const estimate = estimateFromAnswers(
      Array.from({ length: 20 }, (_, i) => ({
        questionId: `q-${i}`,
        domain: "化学" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 650,
        discrimination: 1,
        correct: true,
        qualityScore: 1
      }))
    );
    expect(estimate.overall).toBeGreaterThan(500);
    expect(estimate.overall % scoringConfig.displayStep).toBe(0);
  });

  it("narrows uncertainty as answers increase", () => {
    const ten = estimateFromAnswers(
      Array.from({ length: 10 }, (_, i) => ({
        questionId: `ten-${i}`,
        domain: "数学" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 500,
        discrimination: 1,
        correct: i % 2 === 0,
        qualityScore: 1
      }))
    );
    const fifty = estimateFromAnswers(
      Array.from({ length: 50 }, (_, i) => ({
        questionId: `fifty-${i}`,
        domain: "数学" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 500,
        discrimination: 1,
        correct: i % 2 === 0,
        qualityScore: 1
      }))
    );
    const tenWidth = ten.scoreRange[1] - ten.scoreRange[0];
    const fiftyWidth = fifty.scoreRange[1] - fifty.scoreRange[0];
    expect(tenWidth).toBeGreaterThan(fiftyWidth);
    expect(ten.uncertainties.overall).toBeGreaterThan(fifty.uncertainties.overall);
  });

  it("can decrease score after incorrect answers on easy questions", () => {
    const estimate = estimateFromAnswers(
      Array.from({ length: 12 }, (_, i) => ({
        questionId: `drop-${i}`,
        domain: "物理" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 250,
        discrimination: 1,
        correct: false,
        qualityScore: 1
      }))
    );
    expect(estimate.overall).toBeLessThan(500);
  });

  it("does not double count the same question id", () => {
    const estimate = estimateFromAnswers([
      {
        questionId: "same",
        domain: "数学",
        abilityAxis: "基礎力",
        difficulty: 400,
        discrimination: 1,
        correct: true
      },
      {
        questionId: "same",
        domain: "数学",
        abilityAxis: "基礎力",
        difficulty: 900,
        discrimination: 1,
        correct: true
      }
    ]);
    expect(estimate.counts.overall).toBe(1);
  });

  it("tracks domain and axis counts separately", () => {
    const estimate = estimateFromAnswers([
      {
        questionId: "a",
        domain: "数学",
        abilityAxis: "基礎力",
        difficulty: 500,
        discrimination: 1,
        correct: true
      },
      {
        questionId: "b",
        domain: "物理",
        abilityAxis: "定量・方法力",
        difficulty: 500,
        discrimination: 1,
        correct: false
      }
    ]);
    expect(estimate.counts.domains["数学"]).toBe(1);
    expect(estimate.counts.axes["定量・方法力"]).toBe(1);
    expect(estimate.counts.overall).toBe(2);
  });

  it("computes cumulative correct rate from unique answers", () => {
    const rate = cumulativeCorrectRate([
      { questionId: "a", domain: "数学", abilityAxis: "基礎力", difficulty: 500, discrimination: 1, correct: true },
      { questionId: "b", domain: "物理", abilityAxis: "基礎力", difficulty: 500, discrimination: 1, correct: false },
      { questionId: "a", domain: "数学", abilityAxis: "基礎力", difficulty: 500, discrimination: 1, correct: true }
    ]);
    expect(rate).toBe(0.5);
  });

  it("uses the same score scale thresholds for accuracy labels", () => {
    const ten = estimateFromAnswers(
      Array.from({ length: 10 }, (_, i) => ({
        questionId: `label-${i}`,
        domain: "化学" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 500,
        discrimination: 1,
        correct: true
      }))
    );
    const fifty = estimateFromAnswers(
      Array.from({ length: 50 }, (_, i) => ({
        questionId: `label-50-${i}`,
        domain: "化学" as const,
        abilityAxis: "基礎力" as const,
        difficulty: 500,
        discrimination: 1,
        correct: true
      }))
    );
    expect(ten.accuracyLabel).toBe("速報");
    expect(fifty.accuracyLabel).toBe("高い");
  });
});
