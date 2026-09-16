import { z } from "zod";
import { domains, isSubdomainOf } from "@/src/lib/data/taxonomy";

export const KNOWLEDGE_LEVEL_VERSION = "science-knowledge-stages-v1-20260916";
export const KNOWLEDGE_TARGET = 0.7;
export const knowledgeLevelKeys = ["primary", "lower_secondary", "upper_secondary", "undergraduate_core", "bachelor", "master", "doctor_research"] as const;
export type KnowledgeLevel = typeof knowledgeLevelKeys[number];
export type KnowledgeScope = { domain: typeof domains[number]; subdomain: string | null };

// These are reference people, not equally spaced ability values or verified credentials.
export function knowledgeLevels(scope: KnowledgeScope) {
  const field = scope.subdomain ?? scope.domain;
  return [
    { key: "primary", title: "小学校修了直後", description: `${field}につながる小学校の学習を終えた直後の人` },
    { key: "lower_secondary", title: "中学校修了直後", description: `${field}につながる中学校の学習を終えた直後の人` },
    { key: "upper_secondary", title: "高校の該当科目を履修した直後", description: `${field}に関係する高校の科目を一通り学び終えた直後の人` },
    { key: "undergraduate_core", title: "大学の専門基礎を履修した直後", description: `${field}の大学1〜2年相当の専門基礎科目を一通り学び終えた直後の人` },
    { key: "bachelor", title: "該当分野の学士号取得直後", description: `${field}を専門として学士号を取得した直後の人` },
    { key: "master", title: "該当分野の修士号取得直後", description: `${field}を専門として修士号を取得した直後の人` },
    { key: "doctor_research", title: "該当分野の博士号を持つ現役研究者", description: `${field}を専門として博士号を取得し、現在もその専門分野に直接関わる研究に携わっている人` }
  ] satisfies { key: KnowledgeLevel; title: string; description: string }[];
}
export const scopeLabel = (scope: KnowledgeScope) => scope.subdomain ? `小分野：${scope.domain} → ${scope.subdomain}` : `大分野：${scope.domain} 全体`;
export const knowledgeScopeInput = z.object({ domain: z.enum(domains), subdomain: z.string().min(1).max(100).nullable() }).strict()
  .refine(value => value.subdomain === null || isSubdomainOf(value.domain, value.subdomain), "大分野と小分野を確認してください");
export const levelReferenceInput = z.object({
  version: z.literal(KNOWLEDGE_LEVEL_VERSION), targetProbability: z.literal(KNOWLEDGE_TARGET),
  level: z.enum(knowledgeLevelKeys).nullable(), confidence: z.enum(["confident", "uncertain", "unknown"])
}).strict();
export type LevelReference = z.infer<typeof levelReferenceInput>;
export const newLevelReference = (): LevelReference => ({ version: KNOWLEDGE_LEVEL_VERSION, targetProbability: KNOWLEDGE_TARGET, level: null, confidence: "unknown" });
export const assessmentInput = z.object({
  attemptId: z.string().uuid(), operationId: z.string().uuid(), scope: knowledgeScopeInput,
  version: z.literal(KNOWLEDGE_LEVEL_VERSION), level: z.enum(knowledgeLevelKeys).nullable()
}).strict();

// Descriptions may be published as a guide; score boundaries require empirical validation.
export const knowledgeDescriptions = ["身近な科学の基本", "中学・高校の主要概念", "大学入門の体系的な知識", "専門科目の標準的な知識", "高度な専門知識"] as const;
