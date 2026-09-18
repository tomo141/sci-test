import { MODEL_VERSION } from "./versions";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import { expectedScoreVarianceReduction, posterior, type Parameters, type Response } from "./model";
import type { ExamDefinition } from "./definition";
import { TRIAL_POLICY, TRIAL_TARGET, isFluencyPolicy, trialPool, trialTarget, type ReadingLoad } from "./trial-policy";

export type Candidate = Parameters & { revisionId: string; familyId: string; domain: ScienceDomain; authorId: string | null; focus: boolean; anchor: boolean; exposures: number; trustWeight?:number; seenCount?: number; reading?: ReadingLoad };

export function selectCandidate(candidates: Candidate[], answers: Response[], exam: ExamDefinition, random = Math.random, history: Response[] = [], version = MODEL_VERSION) {
  const counts = new Map<string, number>();
  answers.forEach((r) => counts.set(r.domain, (counts.get(r.domain) ?? 0) + 1));
  const quotas = Object.entries(exam.quotas) as [ScienceDomain, number][];
  const remaining = quotas.filter(([d, n]) => (counts.get(d) ?? 0) < n);
  const minRatio = remaining.length ? Math.min(...remaining.map(([d, n]) => (counts.get(d) ?? 0) / n)) : 0;
  const allowed = new Set(remaining.filter(([d, n]) => (counts.get(d) ?? 0) / n === minRatio).map(([d]) => d));
  const available = candidates.filter(c => !quotas.length || allowed.has(c.domain));
  const leastSeen = Math.min(...available.map(c => c.seenCount ?? 0));
  const abilityAnswers = exam.kind === "trial" ? [...history, ...answers] : answers;
  const distributions = new Map<ScienceDomain, ReturnType<typeof posterior>>();
  const scored = available.filter(c => (c.seenCount ?? 0) === leastSeen).map((candidate) => {
    if (!distributions.has(candidate.domain)) distributions.set(candidate.domain, posterior(abilityAnswers.filter((a) => a.domain === candidate.domain), false, version));
    const metrics = expectedScoreVarianceReduction(distributions.get(candidate.domain)!, candidate, version);
    return { candidate, ...metrics };
  }).sort((a, b) => b.gain - a.gain || a.candidate.revisionId.localeCompare(b.candidate.revisionId));
  if (!scored.length) return null;
  const feedback = exam.kind === "trial" && exam.selectionPolicy === TRIAL_POLICY ? trialTarget(answers) : null;
  const trial = exam.kind === "trial" && isFluencyPolicy(exam.selectionPolicy) ? trialPool(scored, feedback ?? TRIAL_TARGET, !!feedback) : null;
  const pool = trial?.pool ?? scored;
  // Exploration stays inside the adopted trial pool. Its conditional probability is recorded.
  const best = pool.slice(0, 8);
  const focus = pool.filter((entry) => entry.candidate.focus && !entry.candidate.anchor);
  const weights = pool.map((entry) => 0.1 / pool.length +
    (best.includes(entry) ? (focus.length ? 0.7 : 0.9) / best.length : 0) +
    (focus.includes(entry) ? 0.2 / focus.length : 0));
  let roll = Math.min(1 - Number.EPSILON, Math.max(0, random()));
  let index = weights.length - 1;
  for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll < 0) { index = i; break; } }
  return { ...pool[index], selectionProbability: weights[index], reason: `${leastSeen > 0 ? "repeat-fallback-v1:" : ""}${trial ? `${exam.selectionPolicy}:${trial.tier}:` : ""}${feedback ? `target=${feedback.min.toFixed(4)}..${feedback.max.toFixed(4)}:feedback=${feedback.correct}/${feedback.count}:` : ""}posterior-variance+balanced-quota+focus-exploration:${exam.kind === "trial" ? "history-equal-v1" : "attempt-only-v1"}`, candidateCount: pool.length, target: feedback };
}

export function hasCapacity(candidates: Candidate[], exam: ExamDefinition) {
  if (!Object.keys(exam.quotas).length) return new Set(candidates.map((c) => c.familyId)).size >= exam.count;
  return Object.entries(exam.quotas).every(([domain, count]) => new Set(candidates.filter((c) => c.domain === domain).map((c) => c.familyId)).size >= count!);
}
