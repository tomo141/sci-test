export { scoringConfig } from "./config";
export type { AnswerRecord, AbilityDimensionState, AbilityState, Estimate, ProbabilityBand } from "./types";
export {
  predictCorrectProbability,
  difficultyForTargetProbability,
  targetProbabilityBand,
  relaxProbabilityBand,
  distanceToBand
} from "./probability";
export { createInitialAbilityState, updateAbilityState, uncertaintyForCount } from "./ability";
export {
  estimateFromAnswers,
  cumulativeCorrectRate,
  dedupeAnswers,
  blendedAbilityForQuestion
} from "./estimate";
export {
  createExamPlan,
  getCoverageSlot,
  uncoveredCells,
  coveredCells,
  allCoverageCells,
  shuffleWithSeed,
  pickWithSeed,
  type ExamPlan,
  type CoverageSlot
} from "./coverage";
export {
  selectAdaptiveQuestion,
  selectFirstQuestion,
  nextQuestionForAnswers,
  type AdaptiveSelection,
  type AdaptiveSelectionContext
} from "./adaptive";
export { rankTitle } from "./rank";

// Backward-compatible alias used by API routes.
export { predictCorrectProbability as predictCorrect } from "./probability";
