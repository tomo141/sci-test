import { describe, expect, it } from "vitest";
import { examConfig } from "./config";

describe("examConfig", () => {
  it("uses 50 questions per cycle", () => {
    expect(examConfig.questionsPerCycle).toBe(50);
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
