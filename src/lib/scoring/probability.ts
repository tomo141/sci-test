import { scoringConfig } from "./config";

export function predictCorrectProbability(ability: number, difficulty: number, discrimination = 1) {
  const scale = scoringConfig.logisticScale / Math.max(0.1, discrimination);
  return 1 / (1 + Math.exp((difficulty - ability) / scale));
}

export function difficultyForTargetProbability(
  ability: number,
  targetProbability: number,
  discrimination = 1
) {
  const clamped = Math.min(0.99, Math.max(0.01, targetProbability));
  const scale = scoringConfig.logisticScale / Math.max(0.1, discrimination);
  return ability + scale * Math.log((1 - clamped) / clamped);
}

export function targetProbabilityBand(cumulativeCorrectRate: number) {
  if (cumulativeCorrectRate < scoringConfig.lowCumulativeRateThreshold) {
    return scoringConfig.lowRateTargetBand;
  }
  return scoringConfig.highRateTargetBand;
}

export function relaxProbabilityBand(band: { min: number; max: number }, steps: number) {
  const delta = scoringConfig.bandRelaxationStep * steps;
  return {
    min: Math.max(0.05, band.min - delta),
    max: Math.min(0.95, band.max + delta)
  };
}

export function distanceToBand(probability: number, band: { min: number; max: number }) {
  if (probability >= band.min && probability <= band.max) return 0;
  if (probability < band.min) return band.min - probability;
  return probability - band.max;
}
