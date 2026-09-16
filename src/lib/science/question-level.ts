import { difficultyAtProbability } from "./measurement-scale";
import type { Parameters } from "./model";

// Adopted 2026-09-17: display bands only, not calibrated education/degree boundaries.
export const QUESTION_LEVEL_VERSION = "question-level-p70-v1-20260917";
export const QUESTION_LEVEL_BOUNDARIES = [150, 300, 450, 600, 750, 900] as const;
export function questionLevel(parameters: Parameters): number {
  const difficulty = difficultyAtProbability(parameters);
  return 1 + QUESTION_LEVEL_BOUNDARIES.filter(boundary => difficulty >= boundary).length;
}
