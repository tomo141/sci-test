import { describe, expect, it } from "vitest";
import { examConfig } from "./config";

describe("examConfig", () => {
  it("defaults to 50 questions per cycle in tests", () => {
    expect(examConfig.questionsPerCycle).toBe(50);
    expect(examConfig.isShortMode).toBe(false);
  });

  it("gates quick result and karte by configured cycle length", () => {
    expect(examConfig.canViewQuickResult(9)).toBe(false);
    expect(examConfig.canViewQuickResult(10)).toBe(true);
    expect(examConfig.canViewQuickResult(49)).toBe(true);
    expect(examConfig.canViewQuickResult(50)).toBe(false);
    expect(examConfig.canViewKarte(49)).toBe(false);
    expect(examConfig.canViewKarte(50)).toBe(true);
  });
});
