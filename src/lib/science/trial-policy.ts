import type { Content } from "./types";

// Frozen with the attempt definition, so resuming an older exam keeps its selection policy.
export const LEGACY_TRIAL_POLICY = "trial-fluency-v1";
export const TRIAL_POLICY = "trial-fluency-v2-feedback";
export type TrialPolicy = typeof TRIAL_POLICY | typeof LEGACY_TRIAL_POLICY;
export const isFluencyPolicy = (policy?: string): policy is TrialPolicy => policy === TRIAL_POLICY || policy === LEGACY_TRIAL_POLICY;
export const TRIAL_TARGET = { min: .75, max: .85 } as const;
export type TrialTarget = { min: number; max: number; count: number; correct: number; shift: number };
// The operational goal stays at 80%. Feedback moves the next item's predicted
// probability, not the score, b, or the goal itself. Eight virtual answers and
// half gain temper early noise; at most ±10 percentage points of adjustment.
export function trialTarget(answers: { eligible: boolean; correct: boolean }[]): TrialTarget {
  const eligible = answers.filter(a => a.eligible);
  const count = eligible.length, correct = eligible.filter(a => a.correct).length;
  const shift = Math.max(-.1, Math.min(.1, .5 * (.8 * count - correct) / (count + 8)));
  const round = (p: number) => Math.round(p * 10000) / 10000;
  return { min: round(TRIAL_TARGET.min + shift), max: round(TRIAL_TARGET.max + shift), count, correct, shift };
}
export const SHORT_CONTENT = { stem: 45, choice: 15 } as const;
export type ReadingLoad = { stem: number; longestChoice: number };

export function readingLoad(content: Pick<Content, "question" | "choices">): ReadingLoad {
  return { stem: [...content.question].length, longestChoice: Math.max(0, ...content.choices.map(c => [...c].length)) };
}

export function isShort(load?: ReadingLoad) {
  return !!load && load.stem <= SHORT_CONTENT.stem && load.longestChoice <= SHORT_CONTENT.choice;
}

type PredictedCandidate = { predicted: number; candidate: { reading?: ReadingLoad } };
export function trialPool<T extends PredictedCandidate>(scored: T[], target: Pick<TrialTarget, "min" | "max"> = TRIAL_TARGET, easierFallback = false) {
  const distance = (p: number) => Math.max(target.min - p, p - target.max, 0);
  const inRange = scored.filter(entry => distance(entry.predicted) === 0);
  const short = inRange.filter(entry => isShort(entry.candidate.reading));
  if (short.length) return { pool: short, tier: "short-in-range" };
  if (inRange.length) return { pool: inRange, tier: "in-range-reading-fallback" };
  // Quotas and unseen/least-seen priority have already been applied by selection.
  // v2 prefers the easier side even when a harder candidate is closer to the band.
  const easier = easierFallback ? scored.filter(entry => entry.predicted > target.max) : [];
  const fallback = easier.length ? easier : scored;
  const nearestDistance = Math.min(...fallback.map(entry => distance(entry.predicted)));
  const nearest = fallback.filter(entry => Math.abs(distance(entry.predicted) - nearestDistance) < 1e-9);
  const shortNearest = nearest.filter(entry => isShort(entry.candidate.reading));
  return { pool: shortNearest.length ? shortNearest : nearest, tier: easier.length ? "easier-probability-fallback" : "nearest-probability-fallback" };
}
