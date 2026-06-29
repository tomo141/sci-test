import { describe, expect, it } from "vitest";
import { scoringConfig } from "./config";
import { createInitialAbilityState, updateAbilityState } from "./ability";
import { predictCorrectProbability } from "./probability";

describe("ability update", () => {
  it("raises ability more after a difficult correct answer than an easy correct answer", () => {
    const hardCorrect = updateAbilityState(createInitialAbilityState(), {
      questionId: "hard",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 800,
      discrimination: 1,
      correct: true,
      qualityScore: 1
    });
    const easyCorrect = updateAbilityState(createInitialAbilityState(), {
      questionId: "easy",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 300,
      discrimination: 1,
      correct: true,
      qualityScore: 1
    });
    expect(hardCorrect.overall.value).toBeGreaterThan(easyCorrect.overall.value);
  });

  it("reduces penalty on difficult incorrect answers compared with easy incorrect answers", () => {
    const hardWrong = updateAbilityState(createInitialAbilityState(), {
      questionId: "hard",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 800,
      discrimination: 1,
      correct: false,
      qualityScore: 1
    });
    const easyWrong = updateAbilityState(createInitialAbilityState(), {
      questionId: "easy",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 300,
      discrimination: 1,
      correct: false,
      qualityScore: 1
    });
    expect(hardWrong.overall.value).toBeGreaterThan(easyWrong.overall.value);
  });

  it("dampens per-question movement as answer count grows", () => {
    const first = updateAbilityState(createInitialAbilityState(), {
      questionId: "q1",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 650,
      discrimination: 1,
      correct: true,
      qualityScore: 1
    });
    const later = updateAbilityState(first, {
      questionId: "q2",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 650,
      discrimination: 1,
      correct: true,
      qualityScore: 1
    });
    expect(later.overall.value - first.overall.value).toBeLessThan(first.overall.value - scoringConfig.initialAbility);
  });

  it("down-weights low quality questions", () => {
    const highQuality = updateAbilityState(createInitialAbilityState(), {
      questionId: "hq",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 650,
      discrimination: 1,
      correct: true,
      qualityScore: 1
    });
    const lowQuality = updateAbilityState(createInitialAbilityState(), {
      questionId: "lq",
      domain: "数学",
      abilityAxis: "基礎力",
      difficulty: 650,
      discrimination: 1,
      correct: true,
      qualityScore: 0.2
    });
    expect(highQuality.overall.value).toBeGreaterThan(lowQuality.overall.value);
  });
});

describe("probability", () => {
  it("targets about 70% at initial ability for calibrated first question difficulty", () => {
    const probability = predictCorrectProbability(500, 350, 1);
    expect(probability).toBeGreaterThan(0.65);
    expect(probability).toBeLessThan(0.75);
  });
});
