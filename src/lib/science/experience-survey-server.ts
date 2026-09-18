import { checked, rateLimit, requireAdmin, ScienceError, type Context } from "./server";
import { ownedAttempt } from "./engine";
import { EXPERIENCE_SURVEY_VERSION, experienceResponseSchema, type ExperienceRecord, type ExperiencePage } from "./experience-survey";
import type { Attempt } from "./types";

const eventName = "exam_experience_submitted";
const key = (attemptId: string) => `${EXPERIENCE_SURVEY_VERSION}:${attemptId}`;
type EventRow = { id: string; created_at: string; payload: Omit<ExperienceRecord, "submittedAt"> };
function eligible(attempt: Attempt) {
  if (attempt.state !== "completed" || !attempt.result || !["trial", "full"].includes(attempt.kind)) {
    throw new ScienceError("腕試し・総合本試験を終えると回答できます。", 409, "survey_unavailable");
  }
}
async function saved(ctx: Context, attemptId: string): Promise<ExperienceRecord | null> {
  const result = await ctx.db.from("science_events").select("payload,created_at")
    .eq("dedupe_key", key(attemptId)).eq("event_name", eventName).eq("attempt_id", attemptId).maybeSingle();
  if (result.error) checked(result);
  const row = result.data as EventRow | null;
  return row ? { ...row.payload, submittedAt: row.created_at } : null;
}
export async function readExperience(ctx: Context, attemptId: string) {
  await rateLimit(ctx, "experience_read", 60);
  const attempt = await ownedAttempt(ctx, attemptId);
  eligible(attempt);
  return { response: await saved(ctx, attemptId) };
}
export async function saveExperience(ctx: Context, attemptId: string, raw: unknown) {
  const response = experienceResponseSchema.parse(raw);
  await rateLimit(ctx, "experience_write", 10);
  const attempt = await ownedAttempt(ctx, attemptId);
  eligible(attempt);
  const result = attempt.result!;
  // Take score/condition snapshots on the server. Ratings never alter scores, calibration,
  // consent, trust or ranking. One immutable response per attempt, including retries.
  const payload: Omit<ExperienceRecord, "submittedAt"> = { response, context: {
    kind: attempt.kind as "trial" | "full", questionCount: attempt.total,
    definitionVersion: attempt.definition.version,
    selectionPolicy: attempt.definition.selectionPolicy ?? "measurement-v1",
    releaseId: attempt.release_id, modelVersion: attempt.model_version, resultRevision: attempt.result_revision,
    answerCount: result.answerCount, correctCount: result.correctCount,
    score: result.total, low: result.low, high: result.high
  } };
  checked(await ctx.db.from("science_events").upsert({ dedupe_key: key(attempt.id), event_name: eventName,
    visitor_id: ctx.visitor.id, user_id: ctx.userId, attempt_id: attempt.id, payload
  }, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("id"));
  const stored = await saved(ctx, attempt.id);
  if (!stored) throw new ScienceError("回答を確認できませんでした。もう一度送信してください。", 503, "survey_save_unconfirmed");
  return { response: stored };
}
export async function listExperiences(ctx: Context, page: number): Promise<ExperiencePage> {
  await requireAdmin(ctx);
  const rows = checked(await ctx.db.from("science_events").select("id,payload,created_at")
    .eq("event_name", eventName).order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(page * 20, page * 20 + 20)) as EventRow[];
  return { rows: rows.slice(0, 20).map(row => ({ id: row.id, ...row.payload, submittedAt: row.created_at })), hasMore: rows.length > 20, page };
}
