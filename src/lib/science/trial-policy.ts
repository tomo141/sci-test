import type { Content } from "./types";

// Frozen with the attempt definition, so resuming an older exam keeps its selection policy.
export const TRIAL_POLICY = "trial-fluency-v1";
export const TRIAL_TARGET = { min: .75, max: .85 } as const;
export const SHORT_CONTENT = { stem: 45, choice: 15 } as const;
export type ReadingLoad = { stem: number; longestChoice: number };

export function readingLoad(content: Pick<Content, "question" | "choices">): ReadingLoad {
  return { stem: [...content.question].length, longestChoice: Math.max(0, ...content.choices.map(c => [...c].length)) };
}

export function isShort(load?: ReadingLoad) {
  return !!load && load.stem <= SHORT_CONTENT.stem && load.longestChoice <= SHORT_CONTENT.choice;
}

type PredictedCandidate = { predicted: number; candidate: { reading?: ReadingLoad } };
const distance = (p: number) => Math.max(TRIAL_TARGET.min - p, p - TRIAL_TARGET.max, 0);

export function trialPool<T extends PredictedCandidate>(scored: T[]) {
  const inRange = scored.filter(entry => distance(entry.predicted) === 0);
  const short = inRange.filter(entry => isShort(entry.candidate.reading));
  if (short.length) return { pool: short, tier: "short-in-range" };
  if (inRange.length) return { pool: inRange, tier: "in-range-reading-fallback" };
  // Preserve unseen-first and domain quotas even when the bank cannot cover the target.
  // Take the nearest probability to the interval; shortness breaks ties, not ability fit.
  const nearestDistance = Math.min(...scored.map(entry => distance(entry.predicted)));
  const nearest = scored.filter(entry => Math.abs(distance(entry.predicted) - nearestDistance) < 1e-9);
  const shortNearest = nearest.filter(entry => isShort(entry.candidate.reading));
  return { pool: shortNearest.length ? shortNearest : nearest, tier: "nearest-probability-fallback" };
}
