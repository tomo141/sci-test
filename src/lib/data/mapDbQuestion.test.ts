import { describe, expect, it } from "vitest";
import { mapDbQuestionRow, type DbQuestionRow } from "./mapDbQuestion";

function row(): DbQuestionRow {
  return {
    id: "fixture", title: "fixture", question_text: "fixture", domain: "数学", ability_axis: "基礎力",
    difficulty_initial: 100, difficulty_internal: 800, discrimination: 1, status: "published", quality_score: 1,
    currentness_type: "evergreen", expires_at: null,
    question_choices: [0, 1, 2, 3].map((index) => ({ choice_index: index, choice_text: String(index), is_correct: index === 2 })),
    question_sources: [{ source_url: "", source_note: "", evidence_memo: JSON.stringify({ difficulty_continuous: 100, subdomain: "代数学" }) }],
    question_statistics: null
  };
}

describe("database question integrity", () => {
  it("uses the updated database difficulty while retaining legacy subdomain metadata", () => {
    const result = mapDbQuestionRow(row());
    expect(result.difficulty).toBe(800);
    expect(result.subdomain).toBe("代数学");
    expect(result.correctIndex).toBe(2);
  });
  it.each([0, 2])("rejects a question with %i correct choices", (count) => {
    const invalid = row();
    invalid.question_choices.forEach((choice, index) => { choice.is_correct = index < count; });
    expect(() => mapDbQuestionRow(invalid)).toThrow("exactly one correct");
  });
  it("rejects duplicate choice positions", () => {
    const invalid = row(); invalid.question_choices[1].choice_index = 0;
    expect(() => mapDbQuestionRow(invalid)).toThrow("four indexed choices");
  });
  it("handles a JSON null evidence memo without silently inventing an explanation", () => {
    const input = row(); input.question_sources = { source_url: "", source_note: "", evidence_memo: "null" };
    expect(mapDbQuestionRow(input).shortExplanation).toBe("");
  });
});
