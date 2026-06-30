import { describe, expect, it } from "vitest";
import { domains } from "./taxonomy";
import { questions } from "./questions";

describe("question bank", () => {
  it("includes 200 added knowledge questions across all domains", () => {
    expect(questions).toHaveLength(600);
    for (const domain of domains) {
      expect(questions.filter((question) => question.domain === domain)).toHaveLength(60);
      expect(questions.filter((question) => question.domain === domain && question.tags.includes("知識確認"))).toHaveLength(20);
    }
  });
});
