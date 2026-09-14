import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { knowledgeQuestions } from "./knowledgeQuestions";
import { knowledgeQuestionsV2 } from "./knowledgeQuestionsV2";
import { knowledgeQuestionsV3 } from "./knowledgeQuestionsV3";
import { knowledgeQuestionsGapFill } from "./knowledgeQuestionsGapFill";
import { knowledgeQuestionsV5 } from "./knowledgeQuestionsV5";
import { knowledgeQuestionsBatch50 } from "./knowledgeQuestionsBatch50";
import { knowledgeQuestionsPipeline } from "./knowledgeQuestionsPipeline";
import type { BankQuestion } from "./questions";

function loadCalibratedLevels(): Record<string, number> {
  const path = join(process.cwd(), "src/lib/data/questionLevels.json");
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, number>;
}

function applyCalibratedLevels(questions: BankQuestion[], levels: Record<string, number>): BankQuestion[] {
  return questions.map((question) => {
    const level = levels[question.id];
    if (!level) return question;
    return {
      ...question,
      difficulty_initial: level,
      difficulty_continuous: level
    };
  });
}

describe("knowledge bank build", () => {
  it("validates the generated knowledge bank", () => {
    const levels = loadCalibratedLevels();
    const combined = applyCalibratedLevels(
      [
        ...knowledgeQuestions,
        ...knowledgeQuestionsV2,
        ...knowledgeQuestionsV3,
        ...knowledgeQuestionsGapFill,
        ...knowledgeQuestionsV5,
        ...knowledgeQuestionsBatch50,
        ...knowledgeQuestionsPipeline
      ],
      levels
    );
    const outDir = join(process.cwd(), "supabase/seed/generated");
    if (process.env.SCIENCE_BUILD_QUESTION_BANK === "1") {
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "questions-knowledge.json"), `${JSON.stringify(combined, null, 2)}\n`);
    }
    expect(combined).toHaveLength(1361);
    for (const question of combined) {
      expect(question.difficulty_initial % 50).toBe(0);
      expect(levels[question.id]).toBe(question.difficulty_initial);
    }
  });
});
