import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import type { Parameters } from "./model";

export type CalibrationItem = Parameters & {
  revision_id: string; focus: boolean; anchor: boolean;
  parameter_evidence: { sourceOwnerCount?: number };
  science_items: { domain: ScienceDomain; status: string; quality_passed: boolean; rights_checked: boolean; expires_at: string | null };
};
export type CalibrationHistory = {
  revision_id: string; release_id: string; observed_to: string;
  state: string; fit: { sourceOwnerCount?: number; correctionEpoch?: number };
};

/** Bound expensive fits, revisit on new evidence, and recheck queued fits before applying them. */
export function calibrationQueue(bank: CalibrationItem[], owners: Map<string, Set<string>>, history: CalibrationHistory[], releaseId: string, automatic: boolean, now: string, correctionEpoch = 0, limit = 20) {
  const latest = new Map<string, CalibrationHistory>();
  for (const row of history) {
    if (!latest.has(row.revision_id) || latest.get(row.revision_id)!.observed_to < row.observed_to) latest.set(row.revision_id, row);
  }
  const awaiting = new Set<string>();
  const ready = bank.filter(item => {
    const q = item.science_items, count = owners.get(item.revision_id)?.size ?? 0;
    if (!item.focus || item.anchor || q.status !== "published" || !q.quality_passed || !q.rights_checked || (q.expires_at && Date.parse(q.expires_at) <= Date.parse(now))) return false;
    if (count < Math.max(200, (item.parameter_evidence.sourceOwnerCount ?? 0) + 50)) return false;
    const previous = latest.get(item.revision_id);
    if (previous?.state === "qualified" && previous.release_id === releaseId) awaiting.add(item.revision_id);
    // A qualified fit is recalculated from current eligible responses when activation is enabled.
    if (automatic && previous?.state === "qualified") return true;
    return !previous || previous.fit.correctionEpoch !== correctionEpoch || count >= (previous.fit.sourceOwnerCount ?? 0) + 50;
  });
  const selected: CalibrationItem[] = [], domainCounts = new Map<ScienceDomain, number>();
  while (ready.length && selected.length < limit) {
    ready.sort((a, b) => (domainCounts.get(a.science_items.domain) ?? 0) - (domainCounts.get(b.science_items.domain) ?? 0)
      || (latest.get(a.revision_id)?.observed_to ?? "").localeCompare(latest.get(b.revision_id)?.observed_to ?? "")
      || a.revision_id.localeCompare(b.revision_id));
    const item = ready.shift()!;
    selected.push(item);
    awaiting.delete(item.revision_id);
    domainCounts.set(item.science_items.domain, (domainCounts.get(item.science_items.domain) ?? 0) + 1);
  }
  return { selected, awaitingActivation: awaiting.size, remaining: ready.length };
}
