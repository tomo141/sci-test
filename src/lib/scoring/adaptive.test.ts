import { describe, expect, it } from "vitest";
import { questions } from "@/src/lib/data/questions";
import { domains } from "@/src/lib/data/taxonomy";
import { createExamPlan, getCoverageSlot, getDomainOrderForBlock, shuffleWithSeed, uncoveredCells } from "./coverage";
import { selectAdaptiveQuestion, selectFirstQuestion } from "./adaptive";
import { predictCorrectProbability } from "./probability";
import { scoringConfig } from "./config";
import type { AnswerRecord } from "./types";

describe("coverage", () => {
  it("shuffles domain order deterministically", () => {
    const first = createExamPlan("seed-a");
    const second = createExamPlan("seed-a");
    const third = createExamPlan("seed-b");
    expect(first.domainOrder).toEqual(second.domainOrder);
    expect(first.domainOrder).not.toEqual(third.domainOrder);
    expect(new Set(first.domainOrder).size).toBe(10);
  });

  it("uses 基礎力 and one domain each for the first 10 questions", () => {
    const plan = createExamPlan("coverage-test");
    const domainsInFirstTen = Array.from({ length: 10 }, (_, index) => getCoverageSlot(index, plan, []).domain);
    expect(new Set(domainsInFirstTen).size).toBe(10);
    expect(domainsInFirstTen.sort()).toEqual([...domains].sort());
    for (let index = 0; index < 10; index += 1) {
      expect(getCoverageSlot(index, plan, []).abilityAxis).toBe("基礎力");
    }
  });

  it("covers every domain once in each 10-question block and keeps 基礎力 for all 50", () => {
    const plan = createExamPlan("coverage-test");
    const answered: AnswerRecord[] = [];

    for (let step = 0; step < 50; step += 1) {
      const slot = getCoverageSlot(step, plan, answered);
      expect(slot.abilityAxis).toBe("基礎力");
      expect(slot.required).toBe(true);
      answered.push({
        questionId: `answered-${step}`,
        domain: slot.domain,
        abilityAxis: slot.abilityAxis,
        difficulty: 500,
        discrimination: 1,
        correct: true
      });
    }

    for (let block = 0; block < 5; block += 1) {
      const blockDomains = Array.from({ length: 10 }, (_, index) => getCoverageSlot(block * 10 + index, plan, []).domain);
      expect(new Set(blockDomains).size).toBe(10);
      expect(blockDomains.sort()).toEqual([...domains].sort());
    }
  });

  it("reshuffles domain order every 10 questions", () => {
    const plan = createExamPlan("block-shuffle");
    const firstBlock = getDomainOrderForBlock(plan, 0);
    const secondBlock = getDomainOrderForBlock(plan, 1);
    const thirdBlock = getDomainOrderForBlock(plan, 2);

    expect(new Set(firstBlock).size).toBe(10);
    expect(new Set(secondBlock).size).toBe(10);
    expect(firstBlock).not.toEqual(secondBlock);
    expect(secondBlock).not.toEqual(thirdBlock);
    expect(getCoverageSlot(10, plan, []).domain).toBe(secondBlock[0]);
    expect(getCoverageSlot(20, plan, []).domain).toBe(thirdBlock[0]);
  });
});

describe("adaptive selection", () => {
  it("selects a first question near 70% success for ability 500", () => {
    const plan = createExamPlan("first-question");
    const selection = selectFirstQuestion({ questions, answers: [], plan });
    expect(selection).not.toBeNull();
    expect(selection!.selectionReason).toBe("first_question_target_70pct");
    expect(selection!.predictedProbability).toBeGreaterThan(0.65);
    expect(selection!.predictedProbability).toBeLessThan(0.75);
    expect(selection!.question.domain).toBe(plan.domainOrder[0]);
    expect(selection!.question.abilityAxis).toBe("基礎力");
  });

  it("varies first question across sessions when multiple candidates are close", () => {
    const selections = new Set<string>();
    for (let trial = 0; trial < 16; trial += 1) {
      const plan = createExamPlan(`pool-variety-${trial}`);
      const selection = selectFirstQuestion({ questions, answers: [], plan });
      expect(selection).not.toBeNull();
      selections.add(selection!.question.id);
    }
    expect(selections.size).toBeGreaterThan(1);
  });

  it("does not repeat answered questions across 50 selections", () => {
    const plan = createExamPlan("adaptive-50");
    const answers: AnswerRecord[] = [];
    const seen = new Set<string>();

    for (let step = 0; step < 50; step += 1) {
      const selection = selectAdaptiveQuestion({ questions, answers, plan });
      expect(selection).not.toBeNull();
      expect(seen.has(selection!.question.id)).toBe(false);
      seen.add(selection!.question.id);
      answers.push({
        questionId: selection!.question.id,
        domain: selection!.question.domain,
        abilityAxis: selection!.question.abilityAxis,
        difficulty: selection!.question.difficulty,
        discrimination: selection!.question.discrimination,
        correct: true,
        qualityScore: selection!.question.qualityScore
      });
    }
  });

  it("uses easier target band when cumulative correct rate is below 70%", () => {
    const plan = createExamPlan("low-rate");
    const answers: AnswerRecord[] = Array.from({ length: 8 }, (_, index) => ({
      questionId: `wrong-${index}`,
      domain: domains[index],
      abilityAxis: "基礎力",
      difficulty: 700,
      discrimination: 1,
      correct: false,
      qualityScore: 1
    }));
    const selection = selectAdaptiveQuestion({ questions, answers, plan });
    expect(selection).not.toBeNull();
    expect(selection!.targetBand.min).toBe(scoringConfig.lowRateTargetBand.min);
  });
});

describe("shuffleWithSeed", () => {
  it("returns a permutation", () => {
    const shuffled = shuffleWithSeed(domains, "perm");
    expect(shuffled.sort()).toEqual([...domains].sort());
  });
});

describe("uncoveredCells", () => {
  it("returns remaining domain-axis cells", () => {
    const remaining = uncoveredCells([{ domain: "数学", abilityAxis: "基礎力" }]);
    expect(remaining).toHaveLength(9);
    expect(remaining.some((cell) => cell.domain === "数学" && cell.abilityAxis === "基礎力")).toBe(false);
  });
});

describe("predictCorrectProbability", () => {
  it("decreases as difficulty rises", () => {
    expect(predictCorrectProbability(500, 300)).toBeGreaterThan(predictCorrectProbability(500, 700));
  });
});
