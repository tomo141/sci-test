import { abilityAxes, domains, type AbilityAxis, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { scoringConfig } from "./config";
import { predictCorrectProbability } from "./probability";
import type { AbilityDimensionState, AbilityState, AnswerRecord } from "./types";

const clamp = (value: number) =>
  Math.max(scoringConfig.minScore, Math.min(scoringConfig.maxScore, value));

export function uncertaintyForCount(count: number) {
  if (count <= 0) return scoringConfig.initialStandardError;
  let uncertainty = scoringConfig.initialStandardError / Math.sqrt(count);
  if (count < 10) uncertainty *= scoringConfig.earlyUncertaintyMultiplier;
  else if (count < scoringConfig.highAccuracyThreshold) uncertainty *= scoringConfig.midUncertaintyMultiplier;
  return Math.max(scoringConfig.minStandardError, uncertainty);
}

function createDimension(initial = scoringConfig.initialAbility): AbilityDimensionState {
  return { value: initial, count: 0, uncertainty: scoringConfig.initialStandardError };
}

export function createInitialAbilityState(): AbilityState {
  return {
    overall: createDimension(),
    domains: Object.fromEntries(domains.map((domain) => [domain, createDimension()])) as Record<
      ScienceDomain,
      AbilityDimensionState
    >,
    axes: Object.fromEntries(abilityAxes.map((axis) => [axis, createDimension()])) as Record<
      AbilityAxis,
      AbilityDimensionState
    >
  };
}

function computeDelta(ability: number, answer: AnswerRecord, count: number) {
  const expected = predictCorrectProbability(ability, answer.difficulty, answer.discrimination);
  const surprise = (answer.correct ? 1 : 0) - expected;
  const quality = answer.qualityScore ?? 1;
  let step =
    (scoringConfig.baseK * quality * Math.max(0.1, answer.discrimination)) / Math.sqrt(Math.max(1, count + 1));

  if (answer.correct && answer.difficulty < ability) {
    step *= scoringConfig.easyCorrectDampening;
  }
  if (!answer.correct && answer.difficulty > ability) {
    step *= scoringConfig.hardWrongDampening;
  }

  return step * surprise;
}

function updateDimension(dimension: AbilityDimensionState, answer: AnswerRecord): AbilityDimensionState {
  const nextCount = dimension.count + 1;
  const delta = computeDelta(dimension.value, answer, dimension.count);
  return {
    value: clamp(dimension.value + delta),
    count: nextCount,
    uncertainty: uncertaintyForCount(nextCount)
  };
}

export function updateAbilityState(state: AbilityState, answer: AnswerRecord): AbilityState {
  return {
    overall: updateDimension(state.overall, answer),
    domains: {
      ...state.domains,
      [answer.domain]: updateDimension(state.domains[answer.domain], answer)
    },
    axes: {
      ...state.axes,
      [answer.abilityAxis]: updateDimension(state.axes[answer.abilityAxis], answer)
    }
  };
}
