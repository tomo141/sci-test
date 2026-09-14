import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import { expectedScoreVarianceReduction, posterior, type Parameters, type Response } from "./model";
import type { ExamDefinition } from "./definition";

export type Candidate = Parameters & { revisionId: string; familyId: string; domain: ScienceDomain; authorId: string | null; focus: boolean; anchor: boolean; exposures: number };

export function selectCandidate(candidates: Candidate[], answers: Response[], exam: ExamDefinition, random = Math.random) {
  const counts = new Map<string, number>();
  answers.forEach((r) => counts.set(r.domain, (counts.get(r.domain) ?? 0) + 1));
  const quotas = Object.entries(exam.quotas) as [ScienceDomain, number][];
  const remaining = quotas.filter(([d, n]) => (counts.get(d) ?? 0) < n);
  const minRatio = remaining.length ? Math.min(...remaining.map(([d, n]) => (counts.get(d) ?? 0) / n)) : 0;
  const allowed = new Set(remaining.filter(([d, n]) => (counts.get(d) ?? 0) / n === minRatio).map(([d]) => d));
  const distributions = new Map<ScienceDomain, ReturnType<typeof posterior>>();
  const scored = candidates.filter((c) => !quotas.length || allowed.has(c.domain)).map((candidate) => {
    if (!distributions.has(candidate.domain)) distributions.set(candidate.domain, posterior(answers.filter((a) => a.domain === candidate.domain)));
    const metrics = expectedScoreVarianceReduction(distributions.get(candidate.domain)!, candidate);
    return { candidate, ...metrics };
  }).sort((a, b) => b.gain - a.gain || a.candidate.revisionId.localeCompare(b.candidate.revisionId));
  if (!scored.length) return null;
  // Exploration is recorded as a known mixture, rather than treating adaptive exposure as random sampling.
  const best = scored.slice(0, 8);
  const focus = scored.filter((entry) => entry.candidate.focus && !entry.candidate.anchor);
  const weights = scored.map((entry) => 0.1 / scored.length +
    (best.includes(entry) ? (focus.length ? 0.7 : 0.9) / best.length : 0) +
    (focus.includes(entry) ? 0.2 / focus.length : 0));
  let roll = Math.min(1 - Number.EPSILON, Math.max(0, random()));
  let index = weights.length - 1;
  for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll < 0) { index = i; break; } }
  return { ...scored[index], selectionProbability: weights[index], reason: "posterior-variance+balanced-quota+focus-exploration-v1", candidateCount: scored.length };
}

export function hasCapacity(candidates: Candidate[], exam: ExamDefinition) {
  if (!Object.keys(exam.quotas).length) return new Set(candidates.map((c) => c.familyId)).size >= exam.count;
  return Object.entries(exam.quotas).every(([domain, count]) => new Set(candidates.filter((c) => c.domain === domain).map((c) => c.familyId)).size >= count!);
}
