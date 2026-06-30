import { abilityAxes, domains, type AbilityAxis, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { createInitialAbilityState, updateAbilityState } from "./ability";
import { scoringConfig } from "./config";
import { internalToDomainScore } from "./domainScore";
import type { AbilityState, AnswerRecord, Estimate, EstimateCounts, EstimateUncertainties } from "./types";

const clamp = (value: number) =>
  Math.max(scoringConfig.minScore, Math.min(scoringConfig.maxScore, value));

const roundStep = (value: number) => Math.round(value / scoringConfig.displayStep) * scoringConfig.displayStep;

function scaleUncertaintyToDomain(internalUncertainty: number) {
  const ratio = (scoringConfig.domainMaxScore - scoringConfig.domainMinScore) / (scoringConfig.maxScore - scoringConfig.minScore);
  return Math.max(1, Math.round(internalUncertainty * ratio));
}

export function cumulativeCorrectRate(answers: AnswerRecord[]) {
  const unique = dedupeAnswers(answers);
  if (!unique.length) return 0;
  return unique.filter((answer) => answer.correct).length / unique.length;
}

export function dedupeAnswers(answers: AnswerRecord[]) {
  const seen = new Set<string>();
  const unique: AnswerRecord[] = [];
  for (const answer of answers) {
    if (seen.has(answer.questionId)) continue;
    seen.add(answer.questionId);
    unique.push(answer);
  }
  return unique;
}

function toDisplayState(state: AbilityState): Estimate {
  const display = roundStep(clamp(state.overall.value));
  const standardError = state.overall.uncertainty;
  return {
    overall: display,
    domains: Object.fromEntries(
      domains.map((domain) => [domain, internalToDomainScore(state.domains[domain].value)])
    ) as Record<ScienceDomain, number>,
    axes: Object.fromEntries(
      abilityAxes.map((axis) => [axis, roundStep(clamp(state.axes[axis].value))])
    ) as Record<AbilityAxis, number>,
    internal: state,
    counts: {
      overall: state.overall.count,
      domains: Object.fromEntries(domains.map((domain) => [domain, state.domains[domain].count])) as EstimateCounts["domains"],
      axes: Object.fromEntries(abilityAxes.map((axis) => [axis, state.axes[axis].count])) as EstimateCounts["axes"]
    },
    uncertainties: {
      overall: state.overall.uncertainty,
      domains: Object.fromEntries(
        domains.map((domain) => [domain, scaleUncertaintyToDomain(state.domains[domain].uncertainty)])
      ) as EstimateUncertainties["domains"],
      axes: Object.fromEntries(abilityAxes.map((axis) => [axis, state.axes[axis].uncertainty])) as EstimateUncertainties["axes"]
    },
    standardError,
    scoreRange: [roundStep(clamp(display - standardError)), roundStep(clamp(display + standardError))],
    cumulativeCorrectRate: 0,
    accuracyLabel: "速報"
  };
}

export function estimateFromAnswers(answers: AnswerRecord[]): Estimate {
  const unique = dedupeAnswers(answers);
  let state = createInitialAbilityState();

  for (let index = 0; index < unique.length; index += 1) {
    const answer = unique[index];
    const cumulativeCorrectRate =
      unique.slice(0, index + 1).filter((entry) => entry.correct).length / (index + 1);
    state = updateAbilityState(state, answer, cumulativeCorrectRate);
  }

  const estimate = toDisplayState(state);
  estimate.cumulativeCorrectRate = cumulativeCorrectRate(unique);
  estimate.accuracyLabel =
    unique.length >= scoringConfig.stableAnswerThreshold
      ? "安定"
      : unique.length >= scoringConfig.highAccuracyThreshold
        ? "高い"
        : "速報";
  return estimate;
}

export function blendedAbilityForQuestion(
  state: AbilityState,
  domain: ScienceDomain,
  abilityAxis: AbilityAxis
) {
  return (
    scoringConfig.overallAbilityBlend * state.overall.value +
    scoringConfig.domainAbilityBlend * state.domains[domain].value +
    scoringConfig.axisAbilityBlend * state.axes[abilityAxis].value
  );
}

export function selectionAbilityInflation(cumulativeCorrectRate: number) {
  if (cumulativeCorrectRate < scoringConfig.lowCumulativeRateThreshold) return 0;
  const progress =
    (cumulativeCorrectRate - scoringConfig.lowCumulativeRateThreshold) /
    (1 - scoringConfig.lowCumulativeRateThreshold);
  return scoringConfig.maxSelectionAbilityInflation * progress;
}
