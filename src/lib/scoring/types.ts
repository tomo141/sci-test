import type { AbilityAxis, ScienceDomain } from "@/src/lib/data/taxonomy";

export type AnswerRecord = {
  questionId: string;
  domain: ScienceDomain;
  abilityAxis: AbilityAxis;
  difficulty: number;
  discrimination: number;
  correct: boolean;
  qualityScore?: number;
  responseTimeMs?: number;
};

export type AbilityDimensionState = {
  value: number;
  count: number;
  uncertainty: number;
};

export type AbilityState = {
  overall: AbilityDimensionState;
  domains: Record<ScienceDomain, AbilityDimensionState>;
  axes: Record<AbilityAxis, AbilityDimensionState>;
};

export type EstimateCounts = {
  overall: number;
  domains: Record<ScienceDomain, number>;
  axes: Record<AbilityAxis, number>;
};

export type EstimateUncertainties = {
  overall: number;
  domains: Record<ScienceDomain, number>;
  axes: Record<AbilityAxis, number>;
};

export type Estimate = {
  overall: number;
  domains: Record<ScienceDomain, number>;
  axes: Record<AbilityAxis, number>;
  internal: AbilityState;
  counts: EstimateCounts;
  uncertainties: EstimateUncertainties;
  standardError: number;
  scoreRange: [number, number];
  cumulativeCorrectRate: number;
  accuracyLabel: "速報" | "高い" | "安定";
};

export type ProbabilityBand = {
  min: number;
  max: number;
};
