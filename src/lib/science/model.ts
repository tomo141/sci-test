import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { MODEL_VERSION, CURRENT_VERSION, LEGACY_MODEL_VERSION, LEGACY_CURRENT_VERSION, supportedModel } from "./versions";
import { abilityScale } from "./measurement-scale";

export { MODEL_VERSION, CURRENT_VERSION } from "./versions";
export type Parameters = { a: number; b: number; c: number };
export type Response = Parameters & { domain: ScienceDomain; correct: boolean; eligible: boolean; answeredAt?: string };
export type Posterior = { theta: number[]; mass: number[] };
export type DomainResult = { score: number | null; low: number | null; high: number | null; count: number; weight: number; mean: number; variance: number; lastAnsweredAt: string | null };
export type ScienceResult = { version: string; status: "reference"; domains: Record<ScienceDomain, DomainResult>; total: number | null; low: number | null; high: number | null; eligibleCount: number };

const legacyGrid = Array.from({ length: 81 }, (_, i) => -5 + i / 8);
const currentGrid = Array.from({ length: 161 }, (_, i) => -10 + i / 8);
function model(version: string) {
  if (!supportedModel(version)) throw new Error("unsupported_science_model");
  return version === LEGACY_MODEL_VERSION ? { grid: legacyGrid, priorSd: 1.5 } : { grid: currentGrid, priorSd: 2 };
}
// Frozen reference blueprint, equally weighted in every domain. Scores are reference estimates
// until item calibration and the measurement range have been independently validated.
const referenceDifficulty = [-2, -1, 0, 1, 2];
const logistic = (x: number) => 1 / (1 + Math.exp(-x));
export const SCORE_RANGE = { domainMin: 1, domainMax: 99, totalMin: 10, totalMax: 990 } as const;
const domainScore = (value: number) => Math.max(SCORE_RANGE.domainMin, Math.min(SCORE_RANGE.domainMax, value));

export function probability(theta: number, item: Parameters) {
  return item.c + (1 - item.c) * logistic(item.a * (theta - item.b));
}

export function information(theta: number, item: Parameters) {
  const p = probability(theta, item);
  const derivative = item.a * (p - item.c) * (1 - p) / (1 - item.c);
  return derivative ** 2 / Math.max(1e-12, p * (1 - p));
}

export function referenceScore(theta: number, version = MODEL_VERSION) {
  model(version);
  if (version !== LEGACY_MODEL_VERSION) return abilityScale(theta) / 10;
  return referenceDifficulty.reduce((sum, b) => sum + logistic(theta - b), 0) * 100 / referenceDifficulty.length;
}

export function posterior(responses: Response[], current = false, version = MODEL_VERSION): Posterior {
  const { grid, priorSd } = model(version);
  const records = responses.filter((answer) => answer.eligible).slice(current ? -100 : 0);
  const logs = grid.map((theta) => {
    let result = -(theta ** 2) / (2 * priorSd ** 2);
    records.forEach((answer, i) => {
      const p = Math.max(1e-9, Math.min(1 - 1e-9, probability(theta, answer)));
      const weight = current ? 2 ** (-(records.length - 1 - i) / 30) : 1;
      result += weight * Math.log(answer.correct ? p : 1 - p);
    });
    return result;
  });
  const max = Math.max(...logs);
  const weights = logs.map((v) => Math.exp(v - max));
  const total = weights.reduce((sum, v) => sum + v, 0);
  return { theta: grid, mass: weights.map((v) => v / total) };
}

function quantile(distribution: Posterior, q: number, version: string) {
  let sum = 0;
  for (let i = 0; i < distribution.mass.length; i++) {
    sum += distribution.mass[i];
    if (sum >= q) return referenceScore(distribution.theta[i], version);
  }
  return referenceScore(distribution.theta.at(-1)!, version);
}

export function summarizeDomain(responses: Response[], current = false, version = MODEL_VERSION): DomainResult {
  const records = responses.filter((answer) => answer.eligible).slice(current ? -100 : 0);
  const distribution = posterior(records, current, version);
  const mean = distribution.theta.reduce((sum, theta, i) => sum + referenceScore(theta, version) * distribution.mass[i], 0);
  const variance = distribution.theta.reduce((sum, theta, i) => sum + (referenceScore(theta, version) - mean) ** 2 * distribution.mass[i], 0);
  return { score: records.length ? domainScore(Math.round(mean)) : null, mean, variance,
    low: records.length ? domainScore(Math.floor(quantile(distribution, 0.025, version))) : null,
    high: records.length ? domainScore(Math.ceil(quantile(distribution, 0.975, version))) : null,
    count: records.length,
    weight: records.reduce((sum, _, i) => sum + (current ? 2 ** (-(records.length - 1 - i) / 30) : 1), 0),
    lastAnsweredAt: records.at(-1)?.answeredAt ?? null };
}

export function scoreResponses(responses: Response[], current = false, version = MODEL_VERSION): ScienceResult {
  model(version);
  const fields = Object.fromEntries(domains.map((domain) => [domain, summarizeDomain(responses.filter((r) => r.domain === domain), current, version)])) as Record<ScienceDomain, DomainResult>;
  const complete = domains.every((domain) => fields[domain].score !== null);
  const total = complete ? domains.reduce((sum, domain) => sum + fields[domain].score!, 0) : null;
  const deviation = Math.sqrt(domains.reduce((sum, domain) => sum + fields[domain].variance, 0));
  return { version: current ? (version === LEGACY_MODEL_VERSION ? LEGACY_CURRENT_VERSION : CURRENT_VERSION) : version, status: "reference", domains: fields,
    total, low: total === null ? null : Math.max(SCORE_RANGE.totalMin, Math.floor(total - 1.96 * deviation)),
    high: total === null ? null : Math.min(SCORE_RANGE.totalMax, Math.ceil(total + 1.96 * deviation)),
    eligibleCount: domains.reduce((sum, domain) => sum + fields[domain].count, 0) };
}

// Exact one-step reduction of posterior variance of the reference score under the
// discrete posterior: Var(E[score | next answer]) = Cov(score, p)^2 / (E[p](1-E[p])).
export function expectedScoreVarianceReduction(distribution: Posterior, item: Parameters, version = MODEL_VERSION) {
  let meanScore = 0, meanP = 0, meanProduct = 0, fisher = 0;
  distribution.theta.forEach((theta, i) => {
    const p = probability(theta, item), g = referenceScore(theta, version), w = distribution.mass[i];
    meanScore += w * g; meanP += w * p; meanProduct += w * g * p;
    fisher += w * information(theta, item);
  });
  return { gain: (meanProduct - meanScore * meanP) ** 2 / Math.max(1e-12, meanP * (1 - meanP)), predicted: meanP, information: fisher };
}
