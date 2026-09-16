import { domains } from "@/src/lib/data/taxonomy";
import { SCORE_RANGE } from "./model";
import type { AttemptResult, ExamProgress } from "./types";

// Interim display only. Never persist prior-filled values as a completed result.
// The supplied result is computed exclusively from this attempt's committed answers.
export function examProgress(result: AttemptResult): ExamProgress {
  const progress: ExamProgress = { answerCount: result.answerCount, correctCount: result.correctCount, score: null };
  if (!result.definition.formal || !result.eligibleCount) return progress;
  if (result.definition.kind === "domain" && result.definition.domain) {
    const field = result.domains[result.definition.domain];
    if (field.score !== null && field.low !== null && field.high !== null) {
      progress.score = { value: field.score, low: field.low, high: field.high, scale: "domain", unmeasuredDomains: 0 };
    }
    return progress;
  }
  const fields = domains.map(domain => result.domains[domain]);
  const value = fields.reduce((sum, field) => sum + (field.score ?? Math.max(SCORE_RANGE.domainMin, Math.min(SCORE_RANGE.domainMax, Math.round(field.mean)))), 0);
  const deviation = Math.sqrt(fields.reduce((sum, field) => sum + field.variance, 0));
  progress.score = { value, low: Math.max(SCORE_RANGE.totalMin, Math.floor(value - 1.96 * deviation)), high: Math.min(SCORE_RANGE.totalMax, Math.ceil(value + 1.96 * deviation)),
    scale: "total", unmeasuredDomains: fields.filter(field => field.score === null).length };
  return progress;
}
