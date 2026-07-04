import { describe, expect, it } from "vitest";
import { examConfig } from "./config";

describe("examConfig", () => {
  it("uses 20 questions per cycle", () => {
    expect(examConfig.questionsPerCycle).toBe(20);
  });

  it("gates quick result and karte by configured cycle length", () => {
    expect(examConfig.canViewQuickResult(9)).toBe(false);
    expect(examConfig.canViewQuickResult(10)).toBe(true);
    expect(examConfig.canViewQuickResult(19)).toBe(true);
    expect(examConfig.canViewQuickResult(20)).toBe(false);
    expect(examConfig.canViewKarte(19)).toBe(false);
    expect(examConfig.canViewKarte(20)).toBe(true);
  });
});
