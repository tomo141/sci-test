import { describe, expect, it } from "vitest";
import { bFromDifficulty } from "./measurement-scale";
import { questionLevel, QUESTION_LEVEL_BOUNDARIES } from "./question-level";

describe("adopted provisional question levels", () => {
  it("covers the full difficulty range including tails", () => {
    expect(questionLevel({a:1,b:-5,c:.25})).toBe(1);
    expect(questionLevel({a:1,b:5,c:.25})).toBe(7);
  });
  it.each(QUESTION_LEVEL_BOUNDARIES)("uses the 70%% difficulty at boundary %s", difficulty => {
    const index = QUESTION_LEVEL_BOUNDARIES.indexOf(difficulty);
    expect(questionLevel({a:1,b:bFromDifficulty(difficulty-.001),c:.25})).toBe(index+1);
    expect(questionLevel({a:1,b:bFromDifficulty(difficulty+.001),c:.25})).toBe(index+2);
    expect(questionLevel({a:1.4,b:bFromDifficulty(difficulty+.001,1.4,.2),c:.2})).toBe(index+2);
  });
});
