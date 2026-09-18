import { domains, isScienceDomain, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { TRIAL_POLICY, type TrialPolicy } from "./trial-policy";

export const EXPERIMENT_VERSION = "entry-route-v1";
export type RouteGroup = "A" | "B" | "C" | "D";
export type ExamKind = "trial" | "full" | "domain" | "weekly" | "lab";
export type ExamDefinition = { version: string; kind: ExamKind; label: string; count: number; domain: ScienceDomain | null; quotas: Partial<Record<ScienceDomain, number>>; formal: boolean; immediateExplanation: boolean; week?:string; selectionHistory?: "all-eligible-equal" | "attempt-only"; repeatPolicy?: "unseen-first-then-least-seen"; selectionPolicy?: TrialPolicy };

export function definition(kind: ExamKind, domain?: string | null, fullLength: 50 | 100 = 50): ExamDefinition {
  if (kind === "domain" && !isScienceDomain(domain)) throw new Error("分野を選択してください。");
  const count = kind === "trial" || kind === "domain" ? 20 : kind === "full" ? fullLength : 10;
  return { version: kind === "trial" ? "exam-v5-trial-feedback" : "exam-v3-immediate-feedback", kind, count,
    ...(kind === "trial" ? { selectionPolicy: TRIAL_POLICY } : {}),
    label: { trial: "20問の腕試し", full: `総合本試験 ${fullLength}問`, domain: `${domain}をもう20問`, weekly: "今週の10問", lab: "みんなの出題ラボ" }[kind],
    domain: kind === "domain" ? domain as ScienceDomain : null,
    quotas: kind === "domain" ? { [domain!]: count } : kind === "lab" ? {} : Object.fromEntries(domains.map((d) => [d, count / domains.length])),
    formal: ["trial", "full", "domain"].includes(kind), immediateExplanation: true,
    selectionHistory: kind === "weekly" ? undefined : kind === "trial" ? "all-eligible-equal" : "attempt-only",
    repeatPolicy: kind === "weekly" ? undefined : "unseen-first-then-least-seen" };
}

export function requiresAccount(group: RouteGroup, kind: ExamKind) {
  if (kind !== "full" && kind !== "domain") return false;
  if (group === "A") return kind === "domain";
  if (group === "B") return kind === "full";
  return true;
}

export function nextKind(group: RouteGroup, completed: ExamKind): "full" | "domain" {
  if (completed === "trial") return group === "B" || group === "D" ? "domain" : "full";
  return completed === "full" ? "domain" : "full";
}

export function periodBounds(period: "day" | "week" | "month", date = new Date()) {
  const japan = new Date(date.getTime() + 9 * 3600_000);
  const start = new Date(Date.UTC(japan.getUTCFullYear(), japan.getUTCMonth(), japan.getUTCDate()));
  if (period === "week") start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  if (period === "month") start.setUTCDate(1);
  const end = new Date(start);
  if (period === "month") end.setUTCMonth(end.getUTCMonth() + 1);
  else end.setUTCDate(end.getUTCDate() + (period === "week" ? 7 : 1));
  return { key: start.toISOString().slice(0, 10), start: new Date(start.getTime() - 9 * 3600_000).toISOString(), end: new Date(end.getTime() - 9 * 3600_000).toISOString() };
}
