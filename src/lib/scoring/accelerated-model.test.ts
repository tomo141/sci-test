import { describe, it, expect } from "vitest";
import { questions } from "@/src/lib/data/questions";
import { createExamPlan } from "@/src/lib/scoring/coverage";
import { selectAdaptiveQuestion } from "@/src/lib/scoring/adaptive";
import { estimateFromAnswers } from "@/src/lib/scoring/estimate";
import type { AnswerRecord } from "@/src/lib/scoring/types";

function simulateExam(seed: string, correctFn: (step: number) => boolean) {
  const plan = createExamPlan(seed);
  const answers: AnswerRecord[] = [];
  const difficulties: number[] = [];

  for (let step = 0; step < 50; step += 1) {
    const selection = selectAdaptiveQuestion({ questions, answers, plan });
    if (!selection) break;
    difficulties.push(selection.question.difficulty);
    answers.push({
      questionId: selection.question.id,
      domain: selection.question.domain,
      abilityAxis: selection.question.abilityAxis,
      difficulty: selection.question.difficulty,
      discrimination: selection.question.discrimination,
      correct: correctFn(step),
      qualityScore: selection.question.qualityScore
    });
  }

  const est20 = estimateFromAnswers(answers.slice(0, 20));
  const est50 = estimateFromAnswers(answers);
  return {
    scoreAt20: est20.overall,
    rangeAt20: est20.scoreRange,
    scoreAt50: est50.overall,
    avgDiffAt20: difficulties.slice(0, 20).reduce((a, b) => a + b, 0) / 20,
    q20Diff: difficulties[19],
    difficulties: difficulties.slice(0, 25)
  };
}

describe("accelerated perfect-streak model", () => {
  it("reaches roughly 900-990 after 20 consecutive correct answers", () => {
    const seeds = ["adaptive-50", "scan-0", "scan-1", "scan-2", "scan-3"];
    const results = seeds.map((seed) => simulateExam(seed, () => true));
    const avg = results.reduce((sum, r) => sum + r.scoreAt20, 0) / results.length;

    for (const result of results) {
      expect(result.scoreAt20).toBeGreaterThanOrEqual(900);
      expect(result.scoreAt20).toBeLessThanOrEqual(990);
    }
    expect(avg).toBeGreaterThanOrEqual(900);
    expect(avg).toBeLessThanOrEqual(990);
  });

  it("keeps moderate scores when accuracy is around 60%", () => {
    const result = simulateExam("adaptive-50", (step) => step % 5 < 3);
    expect(result.scoreAt20).toBeGreaterThanOrEqual(480);
    expect(result.scoreAt20).toBeLessThanOrEqual(650);
  });

  it("ramps difficulty linearly and avoids 900 before question 20 on a perfect streak", () => {
    const result = simulateExam("adaptive-50", () => true);

    expect(result.difficulties[1]).toBeLessThan(650);
    expect(result.difficulties[2]).toBeLessThan(650);
    for (let index = 0; index < 14; index += 1) {
      expect(result.difficulties[index]).toBeLessThan(800);
    }
    expect(result.q20Diff).toBeGreaterThanOrEqual(850);
  });
});
