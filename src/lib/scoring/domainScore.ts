import { scoringConfig } from "./config";

const internalSpan = scoringConfig.maxScore - scoringConfig.minScore;
const domainSpan = scoringConfig.domainMaxScore - scoringConfig.domainMinScore;

export function internalToDomainScore(internal: number): number {
  const clamped = Math.max(scoringConfig.minScore, Math.min(scoringConfig.maxScore, internal));
  const ratio = (clamped - scoringConfig.minScore) / internalSpan;
  return Math.round(scoringConfig.domainMinScore + ratio * domainSpan);
}

export function displayDomainScore(stored: number): number {
  if (stored > scoringConfig.domainMaxScore) {
    return internalToDomainScore(stored);
  }
  return Math.round(stored);
}

export function domainScorePercent(score: number): number {
  return Math.max(0, Math.min(100, (score / scoringConfig.domainMaxScore) * 100));
}
