import { createHash } from "node:crypto";
import { z } from "zod";

export const MYASP_SYNC_VERSION = "science-myasp-v1";
export const MYASP_FIELDS = {
  externalId: "free31", interests: "free32", science: "free33", weekly: "free34", domainOpening: "free35",
  active: "free36", completed: "free37", eligibleWeek: "free38", nextUrl: "free39", nextLabel: "free40",
  synchronizedAt: "free41", deliveryEnabled: "free42"
} as const;
export const MYASP_FIELD_LABELS: Record<keyof typeof MYASP_FIELDS, string> = {
  externalId: "検定連携：会員ID", interests: "検定連携：興味分野", science: "検定連携：科学の案内同意",
  weekly: "検定連携：週替わり同意", domainOpening: "検定連携：分野公開同意", active: "検定連携：中断中",
  completed: "検定連携：完了した受験", eligibleWeek: "検定連携：未受験の対象週", nextUrl: "検定連携：次の受験URL",
  nextLabel: "検定連携：次の受験名", synchronizedAt: "検定連携：同期日時", deliveryEnabled: "検定連携：案内配信許可"
};
export type MyaspConfiguration = { endpoint: string; server: string; apiKey: string; scenario: string; origin: string };
export function myaspConfiguration(env: Record<string, string | undefined> = process.env): MyaspConfiguration | null {
  const parsed = z.object({ SCIENCE_MYASP_MCP_URL: z.string().url(), SCIENCE_MYASP_SERVER_URL: z.string().url(),
    SCIENCE_MYASP_API_KEY: z.string().min(16), SCIENCE_MYASP_SCENARIO_ID: z.literal("wTYCnyFi"),
    SCIENCE_MAIL_ORIGIN: z.string().url() }).safeParse(env);
  if (!parsed.success) return null;
  const p = parsed.data, endpoint = new URL(p.SCIENCE_MYASP_MCP_URL), server = new URL(p.SCIENCE_MYASP_SERVER_URL), origin = new URL(p.SCIENCE_MAIL_ORIGIN);
  for (const url of [endpoint, server, origin]) if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return null;
  if (endpoint.hostname !== "ai.myasp.jp" || endpoint.port || server.origin !== "https://email.rikei-talk.com" || server.pathname !== "/" || origin.pathname !== "/") return null;
  return { endpoint: endpoint.href, server: server.origin, apiKey: p.SCIENCE_MYASP_API_KEY, scenario: p.SCIENCE_MYASP_SCENARIO_ID, origin: origin.origin };
}
export const emailHash = (email: string) => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
export type MyaspSnapshot = {
  userId: string; email: string | null; version: number; emailHash: string | null; interests: string[];
  consents: { science: boolean; weekly: boolean; domain_opening: boolean }; consentUpdatedAt: string | null;
  active: boolean; completedKinds: string[]; eligibleWeek: string | null; observedAt: string; deliveryEnabled: boolean;
  remoteId: string | null; remoteEmailHash: string | null; remoteStatus: string | null; remoteStoppedAt: string | null;
};
export type MyaspSubscriber = { subscriber_id: string; scenario_id: string; email: string; status: string;
  free_fields?: { field_key: string; field_label?: string; editable: boolean; field_type: string; value?: unknown }[] };
export type MyaspCall = (name: "get_scenarios" | "search_subscribers" | "get_subscriber_details" | "create_subscriber" | "update_subscriber" | "update_subscriber_delivery_status", args: Record<string, unknown>) => Promise<unknown>;

export type MyaspConnectionCheck = {
  state: "not_configured" | "connected" | "failed";
  observedAt: string;
  syncEnabled: boolean;
  deliveryEnabled: boolean;
  errorCode?: string;
  fields?: MyaspFieldCheck[];
};
export type MyaspFieldCheck = { key: string; label: string | null; type: string | null; editable: boolean; ready: boolean };

// A successful transport handshake alone does not prove access to the intended scenario.
// This read never requests subscriber counts, addresses, or writes.
export async function verifyMyaspScenario(call: MyaspCall, config: MyaspConfiguration) {
  const result = myaspData(await call("get_scenarios", {
    scenario_id: config.scenario, include_inactive: true, include_subscriber_count: false, limit: 2, page: 1
  }));
  const parsed = z.object({ scenarios: z.array(z.object({ scenario_id: z.string() })),
    pagination: z.object({ has_more: z.boolean() }) }).safeParse(result);
  if (!parsed.success || parsed.data.pagination.has_more || parsed.data.scenarios.length !== 1 ||
      parsed.data.scenarios[0].scenario_id !== config.scenario) throw new Error("myasp_scenario_not_verified");
}

// Inspect only the 12 reserved field definitions. Values, addresses and subscriber IDs never leave the server.
export async function inspectMyaspFields(call: MyaspCall, config: MyaspConfiguration): Promise<MyaspFieldCheck[]> {
  const result = myaspData(await call("search_subscribers", { scenario_id: config.scenario, status: "active", limit: 1, page: 1 }));
  const parsed = z.object({ subscribers: z.array(z.unknown()) }).safeParse(result);
  if (!parsed.success) throw new Error("myasp_invalid_response");
  const first = parsed.data.subscribers[0];
  if (!first) return [];
  const found = subscriber(first, config.scenario);
  const detail = subscriber(await call("get_subscriber_details", { subscriber_id: found.subscriber_id }), config.scenario, found.email);
  return (Object.keys(MYASP_FIELDS) as (keyof typeof MYASP_FIELDS)[]).map(key => {
    const field = detail.free_fields?.find(f => f.field_key === MYASP_FIELDS[key]);
    return { key: MYASP_FIELDS[key], label: field?.field_label?.slice(0, 100) ?? null, type: field?.field_type.slice(0, 40) ?? null,
      editable: field?.editable === true, ready: field?.editable === true && field.field_type === "hidden" && field.field_label === MYASP_FIELD_LABELS[key] };
  });
}

// The official gateway can wrap JSON in `result`. Do not accept prose, warnings, or partial saves as success.
export function myaspData(input: unknown): Record<string, unknown> {
  let value = input;
  for (let n = 0; n < 3; n++) {
    if (typeof value === "string") { try { value = JSON.parse(value); } catch { throw new Error("myasp_invalid_response"); } continue; }
    if (value && typeof value === "object" && "result" in value && typeof value.result === "string") { value = value.result; continue; }
    break;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("myasp_invalid_response");
  const result = value as Record<string, unknown>;
  if (result.error || result.success === false || (Array.isArray(result.warnings) && result.warnings.length > 0)) throw new Error("myasp_incomplete_operation");
  return result;
}
export function subscriber(input: unknown, scenario: string, expectedEmail?: string): MyaspSubscriber {
  const result = myaspData(input);
  const parsed = z.object({ subscriber_id: z.string().min(1), scenario_id: z.literal(scenario), email: z.string().email(),
    status: z.enum(["active", "unsubscribed", "pending", "error"]),
    free_fields: z.array(z.object({ field_key: z.string(), field_label: z.string().optional(), editable: z.boolean(), field_type: z.string(), value: z.unknown() })).optional()
  }).safeParse(result);
  if (!parsed.success || (expectedEmail && emailHash(parsed.data.email) !== emailHash(expectedEmail))) throw new Error("myasp_identity_mismatch");
  return parsed.data;
}
export function myaspFreeFields(s: MyaspSnapshot, config: MyaspConfiguration) {
  let path = "/exam?kind=trial", label = "20問の腕試し";
  if (s.active) { path = "/mypage"; label = "保存した受験を再開"; }
  else if (s.completedKinds.some(kind => ["trial", "full", "domain"].includes(kind))) {
    if (s.interests[0] || s.completedKinds.includes("full")) { path = "/exam?kind=domain" + (s.interests[0] ? `&domain=${encodeURIComponent(s.interests[0])}` : ""); label = s.interests[0] ? `${s.interests[0]}をもう20問` : "分野を選んでもう20問"; }
    else { path = "/exam?kind=full"; label = "総合本試験"; }
  }
  const values: Record<keyof typeof MYASP_FIELDS, string> = {
    externalId: s.userId, interests: s.interests.join(" / "), science: s.consents.science ? "1" : "0", weekly: s.consents.weekly ? "1" : "0",
    domainOpening: s.consents.domain_opening ? "1" : "0", active: s.active ? "1" : "0", completed: s.completedKinds.join(","),
    eligibleWeek: s.consents.weekly ? s.eligibleWeek ?? "" : "", nextUrl: new URL(path, config.origin).href,
    nextLabel: label, synchronizedAt: s.observedAt, deliveryEnabled: s.deliveryEnabled && Object.values(s.consents).some(Boolean) ? "1" : "0"
  };
  return (Object.keys(MYASP_FIELDS) as (keyof typeof MYASP_FIELDS)[]).map(key => ({ field_key: MYASP_FIELDS[key], value: values[key] }));
}
export function mayResumeMyasp(s: MyaspSnapshot) {
  return s.remoteStatus === "unsubscribed" && !!s.remoteStoppedAt && !!s.consentUpdatedAt &&
    Date.parse(s.consentUpdatedAt) > Date.parse(s.remoteStoppedAt) && Object.values(s.consents).some(Boolean);
}
export async function findMyaspSubscriber(call: MyaspCall, config: MyaspConfiguration, email: string) {
  const matches: MyaspSubscriber[] = [];
  // Pending records are excluded from the default MyASP search. Check them before creating anything.
  for (const status of [undefined, "pending"] as const) {
    const result = myaspData(await call("search_subscribers", { scenario_id: config.scenario, keyword: email, limit: 100, ...(status ? { status } : {}) }));
    const parsed = z.object({ subscribers: z.array(z.unknown()), pagination: z.object({ has_more: z.boolean() }) }).safeParse(result);
    if (!parsed.success || parsed.data.pagination.has_more) throw new Error("myasp_ambiguous_search");
    for (const row of parsed.data.subscribers) {
      const entry = subscriber(row, config.scenario);
      if (emailHash(entry.email) === emailHash(email)) matches.push(entry);
    }
  }
  const unique = [...new Map(matches.map(s => [s.subscriber_id, s])).values()];
  if (unique.length > 1) throw new Error("myasp_ambiguous_identity");
  return unique[0] ?? null;
}
export async function updateMyaspFields(call: MyaspCall, config: MyaspConfiguration, s: MyaspSnapshot, remote: MyaspSubscriber, beforeSave: () => Promise<void> = async () => {}) {
  const detail = subscriber(await call("get_subscriber_details", { subscriber_id: remote.subscriber_id }), config.scenario, s.email!);
  const fields = myaspFreeFields(s, config);
  for (const [key, fieldKey] of Object.entries(MYASP_FIELDS)) {
    const field = detail.free_fields?.find(f => f.field_key === fieldKey);
    if (!field?.editable || field.field_type !== "hidden" || field.field_label !== MYASP_FIELD_LABELS[key as keyof typeof MYASP_FIELDS]) throw new Error("myasp_fields_not_prepared");
  }
  const changed = fields.filter(f => String(detail.free_fields!.find(v => v.field_key === f.field_key)?.value ?? "") !== f.value);
  if (!changed.length) return detail;
  await beforeSave();
  const saved = subscriber(await call("update_subscriber", { subscriber_id: detail.subscriber_id, free_fields: changed }), config.scenario, s.email!);
  for (const field of fields) if (String(saved.free_fields?.find(f => f.field_key === field.field_key)?.value ?? "") !== field.value) throw new Error("myasp_fields_not_saved");
  return saved;
}
