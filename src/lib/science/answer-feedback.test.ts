import { describe, expect, it } from "vitest";
import { answerExplanation, briefExplanation } from "./answer-feedback";
import type { Issued } from "./types";
import type { RevisionUpdate } from "./corrections";

const issued = {
  ordinal: 19, revision_id: "reviewed-fixture", choice_order: [2, 0, 3, 1],
  snapshot: { a: 1, b: 0, c: .25, domain: "数学", subdomain: "数と代数", content: { question: "1 + 1 は？", choices: ["1", "2", "3", "4"], correctIndex: 1,
    explanation: "1個と1個を合わせると2個です。", distractorRationales: [], sources: [] } }
} as unknown as Issued;

describe("answer feedback", () => {
  it("uses the displayed choice order for grading and the canonical order for answer text", () => {
    expect(answerExplanation(issued, 3)).toMatchObject({ ordinal: 19, correct: true, selectedAnswer: "2", correctAnswer: "2", display: { choices: ["3", "1", "4", "2"], correctIndex: 3, selectedIndex: 3 } });
    expect(answerExplanation(issued, 1)).toMatchObject({ correct: false, selectedAnswer: "1", correctAnswer: "2" });
  });
  it("shows an approved correction without falsely grading a withdrawn item", () => {
    const update = { excluded: true, reason: "誤った正解指定を訂正", content: { ...issued.snapshot.content, correctIndex: 2 } } as RevisionUpdate;
    expect(answerExplanation(issued, 3, update)).toMatchObject({ correct: null, correctAnswer: "3", selectedAnswer: "2", correctionNote: update.reason, display: { correctIndex: null } });
  });
  it("keeps a short explanation and extracts complete sentences or paragraphs from longer text", () => {
    expect(briefExplanation("短い説明です。")).toBe("短い説明です。");
    expect(briefExplanation("先に読む説明です。\n\n詳しい理由です。")).toBe("先に読む説明です。");
    const sentence = "理由を確かめるための説明です。".repeat(15);
    const brief = briefExplanation(sentence);
    expect(brief.length).toBeLessThanOrEqual(180);
    expect(brief.endsWith("。")).toBe(true);
    expect(sentence.startsWith(brief)).toBe(true);
  });
});
