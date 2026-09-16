import { describe, expect, it } from "vitest";
import { assessmentInput, KNOWLEDGE_LEVEL_VERSION, knowledgeLevels, levelReferenceInput, newLevelReference } from "./knowledge-levels";

describe("shared reference people", () => {
  it("anchors graduate references to the requested subject and preserves recency", () => {
    const levels = knowledgeLevels({ domain: "化学", subdomain: "有機化学" });
    expect(levels).toHaveLength(7);
    expect(levels.find(x => x.key === "master")?.description).toBe("有機化学を専門として修士号を取得した直後の人");
    expect(levels.find(x => x.key === "doctor_research")?.description).toContain("有機化学を専門として博士号を取得し、現在もその専門分野に直接関わる研究");
    expect(levels.every(x => !("score" in x))).toBe(true);
  });
  it("rejects mismatched scopes, old definitions and credential or scoring payloads", () => {
    const valid = { attemptId: "30000000-0000-4000-8000-000000000088", operationId: "40000000-0000-4000-8000-000000000088", scope: { domain: "化学", subdomain: "有機化学" }, version: KNOWLEDGE_LEVEL_VERSION, level: "master" };
    expect(assessmentInput.safeParse(valid).success).toBe(true);
    expect(assessmentInput.safeParse({ ...valid, scope: { domain: "物理", subdomain: "有機化学" } }).success).toBe(false);
    expect(assessmentInput.safeParse({ ...valid, scope: { domain: "化学", subdomain: null }, level: null }).success).toBe(true);
    for (const extra of [{ score: 800 }, { degreeObtained: true }, { version: "nineteen-stages" }]) expect(assessmentInput.safeParse({ ...valid, ...extra }).success).toBe(false);
  });
  it("allows an explicitly unknown estimate without inventing a level", () => {
    expect(newLevelReference()).toMatchObject({ level: null, confidence: "unknown", targetProbability: 0.7 });
    expect(levelReferenceInput.safeParse({ ...newLevelReference(), level: "postdoc" }).success).toBe(false);
  });
});
