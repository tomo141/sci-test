import { z } from "zod";
import { ownedAttempt } from "./engine";
import { checked, ScienceError, type Context } from "./server";
import { assessmentInput, KNOWLEDGE_LEVEL_VERSION, knowledgeScopeInput, type KnowledgeLevel, type KnowledgeScope } from "./knowledge-levels";

type AssessmentRow = { id: string; attempt_id: string; domain: KnowledgeScope["domain"]; subdomain: string | null; definition_version: string; level: KnowledgeLevel | null; created_at: string };
export type AssessmentData = { scopes: KnowledgeScope[]; answers: { scope: KnowledgeScope; level: KnowledgeLevel | null; updatedAt: string }[] };
export async function assessmentScopes(ctx: Context, attemptId: string) {
  const attempt = await ownedAttempt(ctx, attemptId);
  if (attempt.state !== "completed" || !attempt.result?.definition.formal) throw new ScienceError("受験を終えてから回答できます。", 409, "assessment_not_available");
  const rows = checked(await ctx.db.from("science_issued").select("snapshot").eq("attempt_id", attemptId));
  const scopes = new Map<string, KnowledgeScope>();
  for (const row of rows) {
    const parsed = knowledgeScopeInput.safeParse({ domain: row.snapshot.domain, subdomain: row.snapshot.subdomain });
    if (!parsed.success) continue;
    const scope = parsed.data;
    scopes.set(scope.domain, { domain: scope.domain, subdomain: null });
    scopes.set(`${scope.domain}/${scope.subdomain}`, scope);
  }
  if (!scopes.size) throw new ScienceError("この受験では段階の質問を用意できませんでした。", 409, "assessment_not_available");
  return [...scopes.values()];
}
export async function assessmentData(ctx: Context, attemptId: string): Promise<AssessmentData> {
  const scopes = await assessmentScopes(ctx, attemptId);
  const history = checked(await ctx.db.rpc("science_level_history", { p_visitor: ctx.visitor.id, p_user: ctx.userId })) as AssessmentRow[];
  const answers: AssessmentData["answers"] = [];
  for (const row of history) if (row.definition_version === KNOWLEDGE_LEVEL_VERSION && !answers.some(x => x.scope.domain === row.domain && x.scope.subdomain === row.subdomain)) {
    answers.push({ scope: { domain: row.domain, subdomain: row.subdomain }, level: row.level, updatedAt: row.created_at });
  }
  return { scopes, answers };
}
export async function saveAssessment(ctx: Context, input: z.infer<typeof assessmentInput>) {
  const scopes = await assessmentScopes(ctx, input.attemptId);
  if (!scopes.some(s => s.domain === input.scope.domain && s.subdomain === input.scope.subdomain)) throw new ScienceError("この受験の分野から選んでください。", 400, "invalid_assessment_scope");
  const values = { visitor_id: ctx.visitor.id, operation_id: input.operationId, attempt_id: input.attemptId,
    domain: input.scope.domain, subdomain: input.scope.subdomain, definition_version: input.version, level: input.level };
  checked(await ctx.db.from("science_level_assessments").upsert(values, { onConflict: "visitor_id,operation_id", ignoreDuplicates: true }).select("id"));
  const saved = checked(await ctx.db.from("science_level_assessments").select("id,attempt_id,domain,subdomain,definition_version,level,created_at").eq("visitor_id", ctx.visitor.id).eq("operation_id", input.operationId).single()) as AssessmentRow;
  if (saved.attempt_id !== input.attemptId || saved.domain !== input.scope.domain || saved.subdomain !== input.scope.subdomain || saved.level !== input.level || saved.definition_version !== input.version) throw new ScienceError("回答内容が変わっています。画面を開き直してください。", 409, "operation_conflict");
  return { saved: true, updatedAt: saved.created_at };
}
