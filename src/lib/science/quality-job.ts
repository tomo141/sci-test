import { evidenceModels } from "./versions";
import { checked, type service } from "./server";
import { readAll } from "./queries";
import { activeModel } from "./active-model";
import { qualitySignals, type QualityAnswer, type QualityReport } from "./quality";
import type { Item } from "./types";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";

type ResponseRow = { user_id: string | null; visitor_id: string; family_id: string; revision_id: string; domain: ScienceDomain; a: number; b: number; c: number; is_correct: boolean; answered_at: string; canonical_choice: number; eligible: boolean };
export async function runQualityWatch(db: ReturnType<typeof service>, jobId: string) {
  const version = await activeModel(db);
  const now = new Date(), from = new Date(now.getTime() - 90 * 86400000).toISOString(), to = now.toISOString();
  const counts = await Promise.all([
    db.from("science_quality_responses").select("revision_id", { count: "exact", head: true }).eq("quality_eligible", true).in("model_version", evidenceModels(version)).gte("answered_at", from).lt("answered_at", to),
    db.from("science_feedback").select("id", { count: "exact", head: true }).in("state", ["pending", "accepted"]).gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString()).lt("created_at", to),
    db.from("science_items").select("id", { count: "exact", head: true }).in("status", ["published", "lab", "held"])
  ]);
  for (const count of counts) { if (count.error) checked(count); if (count.count === null) throw new Error("quality_count_unavailable"); }
  // Do not silently certify a truncated data set. A larger batch runner is needed beyond these bounds.
  if (counts[0].count! > 20000 || counts[1].count! > 5000 || counts[2].count! > 5000) return { state: "batch_processing_required", counts: counts.map(c => c.count), from, to };
  const [items, raw, reports] = await Promise.all([
    readAll<Item>((a, b) => db.from("science_items").select("*").in("status", ["published", "lab", "held"]).order("id").range(a, b)),
    readAll<ResponseRow>((a, b) => db.from("science_quality_responses").select("user_id,visitor_id,family_id,revision_id,domain,a,b,c,is_correct,answered_at,canonical_choice,eligible").eq("quality_eligible", true).in("model_version", evidenceModels(version)).gte("answered_at", from).lt("answered_at", to).order("answered_at").order("attempt_id").order("ordinal").range(a, b)),
    readAll<{ user_id: string | null; visitor_id: string; revision_id: string; category: string; evidence: string; created_at: string }>((a, b) => db.from("science_feedback").select("id,user_id,visitor_id,revision_id,category,evidence,created_at").in("state", ["pending", "accepted"]).gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString()).lt("created_at", to).order("id").range(a, b))
  ]);
  const owner = (r: { user_id: string | null; visitor_id: string }) => r.user_id ? `user:${r.user_id}` : `visitor:${r.visitor_id}`;
  const answers: QualityAnswer[] = raw.map(r => ({ owner: owner(r), familyId: r.family_id, revisionId: r.revision_id, domain: r.domain, a: r.a, b: r.b, c: r.c, correct: r.is_correct, eligible: r.eligible, qualityEligible: true, answeredAt: r.answered_at, choice: r.canonical_choice }));
  const feedback: QualityReport[] = reports.map(r => ({ owner: owner(r), revisionId: r.revision_id, category: r.category, evidence: r.evidence, createdAt: r.created_at }));
  const result = qualitySignals(items, answers, feedback, now, version);
  checked(await db.rpc("science_store_quality_signals", { p_job: jobId, p_signals: result.signals, p_revisions: items.map(q => q.id), p_observed: to, p_from: from }));
  return { state: "completed", signals: result.signals.length, responseCount: result.responseCount, uniqueFamilyResponses: result.uniqueFamilyResponses, abilityMeasured: result.abilityMeasured, from, to };
}
