import { MODEL_VERSION } from "./versions";
import { posterior, probability } from "./model";
import { wilson } from "./experiment";
import type { CalibrationAnswer } from "./calibration";
import type { Item } from "./types";

export type QualityAnswer = CalibrationAnswer & { choice: number; qualityEligible?: boolean };
export type QualityReport = { owner: string; revisionId: string; category: string; evidence: string; createdAt: string };
export type QualitySignal = { revisionId: string; code: string; priority: number; evidence: Record<string, unknown> };
type Observation = QualityAnswer & { ability: number | null; predicted: number | null };
const normalize = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/gu, "").replace(/[?？。、「」『』]/gu, "");
const grams = (s: string) => new Set(Array.from({ length: Math.max(0, s.length - 2) }, (_, i) => s.slice(i, i + 3)));

/** Each person contributes once per family. Ability uses only earlier, other families. */
export function qualityObservations(rows: QualityAnswer[], version = MODEL_VERSION): Observation[] {
  const owners = new Map<string, QualityAnswer[]>();
  for (const row of [...rows].filter(r => r.eligible || r.qualityEligible).sort((a, b) => a.answeredAt.localeCompare(b.answeredAt))) {
    const list = owners.get(row.owner) ?? []; list.push(row); owners.set(row.owner, list);
  }
  const output: Observation[] = [];
  for (const answers of owners.values()) {
    const seen = new Set<string>(), previous: QualityAnswer[] = [];
    for (const row of answers) {
      if (seen.has(row.familyId)) continue;
      seen.add(row.familyId);
      const other = previous.filter(r => r.domain === row.domain && r.answeredAt < row.answeredAt).slice(-100);
      let ability: number | null = null, predicted: number | null = null;
      if (other.length >= 8) {
        const p = posterior(other, false, version), mean = p.theta.reduce((sum, t, i) => sum + t * p.mass[i], 0);
        const variance = p.theta.reduce((sum, t, i) => sum + (t - mean) ** 2 * p.mass[i], 0);
        if (variance <= 1) {
          ability = mean;
          if (row.eligible) predicted = p.theta.reduce((sum, t, i) => sum + probability(t, row) * p.mass[i], 0);
        }
      }
      output.push({ ...row, ability, predicted }); if (row.eligible) previous.push(row);
    }
  }
  return output;
}

/** Triage heuristics in an adaptively selected sample; never a verdict on correctness. */
export function qualitySignals(items: Item[], rows: QualityAnswer[], reports: QualityReport[], now: Date, version = MODEL_VERSION) {
  const observations = qualityObservations(rows, version), signals: QualitySignal[] = [];
  const byRevision = new Map<string, Observation[]>();
  for (const row of observations) { const group = byRevision.get(row.revisionId) ?? []; group.push(row); byRevision.set(row.revisionId, group); }
  for (const item of items) {
    const sample = byRevision.get(item.id) ?? [];
    const add = (code: string, priority: number, evidence: Record<string, unknown>) => signals.push({ revisionId: item.id, code, priority, evidence });
    if (sample.length >= 100) {
      const counts = [0, 1, 2, 3].map(i => sample.filter(r => r.choice === i).length);
      const rare = counts.flatMap((n, i) => i !== item.content.correctIndex && wilson(n, sample.length)!.high < .05 ? [i] : []);
      if (rare.length) add("rare_distractor", 3, { sampleCount: sample.length, counts, choices: rare, upperLimit: .05 });
    }
    const measured = sample.filter(r => r.ability !== null).sort((a, b) => a.ability! - b.ability!);
    const size = Math.floor(measured.length / 3), low = measured.slice(0, size), high = measured.slice(-size);
    if (size >= 20 && high[0].ability! - low.at(-1)!.ability! >= .5) {
      const lowRate = wilson(low.filter(r => r.correct).length, low.length)!, highRate = wilson(high.filter(r => r.correct).length, high.length)!;
      if (highRate.high < lowRate.low) add("negative_discrimination", 1, { measuredCount: measured.length, low: { count: low.length, ...lowRate }, high: { count: high.length, ...highRate } });
    }
    const expectedHigh = sample.filter(r => r.predicted !== null && r.predicted >= .8);
    if (expectedHigh.length >= 30) {
      const expected = expectedHigh.reduce((sum, r) => sum + r.predicted!, 0) / expectedHigh.length;
      const actual = wilson(expectedHigh.filter(r => r.correct).length, expectedHigh.length)!;
      if (actual.high < expected - .1) add("unexpected_errors", 2, { sampleCount: expectedHigh.length, expected, actual });
    }
    const recent = reports.filter(r => r.revisionId === item.id && r.category !== "good" && r.createdAt <= now.toISOString() && Date.parse(r.createdAt) >= now.getTime() - 7 * 86400000);
    const reportOwners = new Set(recent.map(r => r.owner));
    if (reportOwners.size >= 3) add("report_burst", 1, { reporters: reportOwners.size, days: 7, categories: [...new Set(recent.map(r => r.category))], evidenceCount: new Set(recent.filter(r => r.evidence.trim()).map(r => r.owner)).size });
    if (recent.some(r => ["rights", "answer"].includes(r.category) && r.evidence.trim().length >= 10)) add("evidence_report", 1, { categories: [...new Set(recent.filter(r => r.evidence.trim().length >= 10).map(r => r.category))] });
    if (item.expires_at && Date.parse(item.expires_at) <= now.getTime() + 30 * 86400000) add(Date.parse(item.expires_at) <= now.getTime() ? "source_expired" : "source_due", 1, { expiresAt: item.expires_at, daysAhead: 30 });
  }
  const normalized = items.map(item => ({ item, stem: normalize(item.content.question), grams: grams(normalize(item.content.question)) }));
  for (let i = 0; i < normalized.length; i++) {
    const a = normalized[i], matches: { revisionId: string; similarity: number }[] = [];
    for (let j = 0; j < i; j++) {
      const b = normalized[j];
      if (a.item.domain !== b.item.domain || a.item.family_id === b.item.family_id) continue;
      if (a.stem === b.stem) { matches.push({ revisionId: b.item.id, similarity: 1 }); continue; }
      if (a.stem.length < 20 || b.stem.length < 20 || Math.min(a.grams.size, b.grams.size) / Math.max(a.grams.size, b.grams.size) < .9) continue;
      const intersection = [...a.grams].filter(g => b.grams.has(g)).length, similarity = intersection / (a.grams.size + b.grams.size - intersection);
      if (similarity >= .9) matches.push({ revisionId: b.item.id, similarity });
    }
    if (matches.length) signals.push({ revisionId: a.item.id, code: "similar_stem", priority: 2, evidence: { matches: matches.slice(0, 10), matchCount: matches.length, method: "normalized-trigram-jaccard-v1" } });
  }
  return { signals, responseCount: rows.length, uniqueFamilyResponses: observations.length, abilityMeasured: observations.filter(r => r.ability !== null).length };
}
