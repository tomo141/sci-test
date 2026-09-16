// Frozen display convention for science-3pl-p70-linear-v2. These constants define units,
// not a measured population norm. Raw values remain unrounded/unclipped for the 70% identity.
export const MEASUREMENT_SCALE = { center: 500, pointsPerTheta: 200, target: 0.7 } as const;
export const abilityScale = (theta: number) => MEASUREMENT_SCALE.center + MEASUREMENT_SCALE.pointsPerTheta * theta;
export const thetaFromScale = (score: number) => (score - MEASUREMENT_SCALE.center) / MEASUREMENT_SCALE.pointsPerTheta;
type ItemParameters = { a: number; b: number; c: number };
function offset(a: number, c: number, target: number) {
  if (!(a > 0 && Number.isFinite(a) && c >= 0 && c < target && target < 1)) throw new Error("invalid_measurement_parameters");
  return Math.log((target - c) / (1 - target)) / a;
}
export function difficultyAtProbability(item: ItemParameters, target = MEASUREMENT_SCALE.target as number) {
  return abilityScale(item.b + offset(item.a, item.c, target));
}
export function bFromDifficulty(difficulty: number, a = 1, c = 0.25, target = MEASUREMENT_SCALE.target as number) {
  if (!Number.isFinite(difficulty)) throw new Error("invalid_difficulty");
  return thetaFromScale(difficulty) - offset(a, c, target);
}
