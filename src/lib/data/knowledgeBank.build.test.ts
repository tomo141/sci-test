import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { knowledgeQuestions } from "./knowledgeQuestions";
import { knowledgeQuestionsV2 } from "./knowledgeQuestionsV2";

describe("knowledge bank build", () => {
  it("writes questions-knowledge.json for DB import", () => {
    const combined = [...knowledgeQuestions, ...knowledgeQuestionsV2];
    const outDir = join(process.cwd(), "supabase/seed/generated");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "questions-knowledge.json"), `${JSON.stringify(combined, null, 2)}\n`);
    expect(combined).toHaveLength(200);
  });
});
