import { randomInt } from "node:crypto";
import { correctionState, correctedResult, refreshCorrectedAttempt } from "./corrections";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import { definition, periodBounds, requiresAccount, type ExamKind } from "./definition";
import { MODEL_VERSION, type Response } from "./model";
import { hasCapacity, selectCandidate, type Candidate } from "./selection";
import { checked, rateLimit, releaseConfig, ScienceError, type Context } from "./server";
import type { Answer, Attempt, AttemptResult, ExamState, Issued, Item, PublicAttempt, PublicQuestion } from "./types";
import { readAll } from "./queries";
import { authorWeights } from "./community";
import { laboratoryChoice } from "./trust";
import { answerExplanation } from "./answer-feedback";
export { readAll } from "./queries";

export async function ownedAttempt(ctx: Context, id: string) {
  const result = await ctx.db.from("science_attempts").select("*").eq("id", id).maybeSingle();
  if (result.error) checked(result);
  const a = result.data as Attempt | null;
  if (!a || (a.user_id ? a.user_id !== ctx.userId : a.visitor_id !== ctx.visitor.id)) throw new ScienceError("受験が見つかりません。開始した端末・アカウントを確認してください。", 404, "not_found");
  return refreshCorrectedAttempt(ctx.db, a);
}

export async function attemptRecords(ctx: Context, id: string) {
  const [issuedResponse, answerResponse] = await Promise.all([
    ctx.db.from("science_issued").select("*").eq("attempt_id", id).order("ordinal"),
    ctx.db.from("science_answers").select("*").eq("attempt_id", id).order("ordinal")
  ]);
  const issued = checked(issuedResponse) as Issued[];
  const answers = checked(answerResponse) as Answer[];
  const corrections = await correctionState(ctx.db, issued.map(q => q.revision_id), id);
  const responses: Response[] = answers.map((answer) => {
    const question = issued.find((q) => q.ordinal === answer.ordinal);
    if (!question) throw new ScienceError("保存記録を確認する必要があります。", 503, "inconsistent_record");
    return { ...question.snapshot, correct: answer.is_correct===true, eligible: answer.selected_index!==null && question.eligible && !corrections.updates.get(question.revision_id)?.excluded && !corrections.ineligibleOrdinals.has(question.ordinal), answeredAt: answer.answered_at };
  });
  return { issued, answers, responses, corrections };
}

async function exposureHistory(ctx: Context) {
  const seen = await readAll<{ family_id: string; presentation_count: number }>((from, to) => ctx.db.rpc("science_exposure_history", { p_visitor: ctx.visitor.id, p_user: ctx.userId }).order("family_id").range(from, to));
  return new Map(seen.map(s => [s.family_id, s.presentation_count]));
}

async function previousTrialEvidence(ctx: Context, attemptId: string) {
  const rows = await readAll<{ domain: ScienceDomain; a: number; b: number; c: number; is_correct: boolean; answered_at: string }>((from, to) => {
    let query = ctx.db.from("science_responses").select("domain,a,b,c,is_correct,answered_at").eq("eligible", true).eq("model_version", MODEL_VERSION).neq("attempt_id", attemptId);
    query = ctx.userId ? query.or(`visitor_id.eq.${ctx.visitor.id},user_id.eq.${ctx.userId}`) : query.eq("visitor_id", ctx.visitor.id);
    return query.order("answered_at").order("attempt_id").order("ordinal").range(from, to);
  });
  return rows.map((row): Response => ({ ...row, correct: row.is_correct, eligible: true, answeredAt: row.answered_at }));
}

type BankRow = { release_id: string; revision_id: string; a: number; b: number; c: number; focus: boolean; anchor: boolean; science_items: Item };
async function candidateBank(ctx: Context, release: string | null, kind: ExamKind, currentFamilies = new Set<string>()): Promise<Candidate[]> {
  const seen = await exposureHistory(ctx);
  if (kind === "lab") {
    const items = await readAll<Item>((from, to) => ctx.db.from("science_items").select("*").in("status", ["lab", "published"]).eq("rights_checked", true).not("author_id", "is", null).order("id").range(from, to));
    const candidates=items.filter((q) => !currentFamilies.has(q.family_id) && q.author_id !== ctx.userId && (!q.expires_at || new Date(q.expires_at) > new Date())).map((q) => ({ revisionId: q.id, familyId: q.family_id, domain: q.domain, a: 1, b: 0, c: .25, authorId: q.author_id, focus: true, anchor: false, exposures: 0, seenCount: seen.get(q.family_id) ?? 0 }));
    const weights=await authorWeights(ctx,candidates);
    return candidates.map((q,i)=>({...q,trustWeight:weights[i]}));
  }
  if (!release) throw new ScienceError("問題バンクを準備しています。", 503, "bank_unavailable");
  const rows = await readAll<BankRow>((from, to) => ctx.db.from("science_release_items").select("*,science_items!inner(*)").eq("release_id", release).order("revision_id").range(from, to));
  return rows.filter(({ science_items: q }) => q.status === "published" && q.quality_passed && q.rights_checked && !currentFamilies.has(q.family_id) && (!q.author_id || q.author_id !== ctx.userId) && (!q.expires_at || new Date(q.expires_at) > new Date())).map((r) => ({ revisionId: r.revision_id, familyId: r.science_items.family_id, domain: r.science_items.domain, a: r.a, b: r.b, c: r.c, authorId: r.science_items.author_id, focus: r.focus, anchor: r.anchor, exposures: 0, seenCount: seen.get(r.science_items.family_id) ?? 0 }));
}

export function publicAttempt(a: Attempt): PublicAttempt {
  return { id: a.id, definition: a.definition, ordinal: a.ordinal, state: a.state, competitive: a.competitive, completed_at: a.completed_at, result: a.result };
}
function publicQuestion(q: Issued): PublicQuestion {
  return { ordinal: q.ordinal, token: q.token, domain: q.snapshot.domain, subdomain: q.snapshot.subdomain, question: q.snapshot.content.question, choices: q.choice_order.map((i) => q.snapshot.content.choices[i]),creditName:q.snapshot.creditName,aiAssisted:q.snapshot.aiAssisted };
}
async function displayQuestion(ctx: Context, q: Issued): Promise<PublicQuestion> {
  const corrections = await correctionState(ctx.db, [q.revision_id]);
  if (corrections.updates.get(q.revision_id)?.excluded) return { ordinal:q.ordinal, token:q.token, domain:q.snapshot.domain, subdomain:q.snapshot.subdomain, question:"この問題は運営が取り下げました。採点には含めません。", choices:[], withdrawn:true };
  const item=checked<{status:string}>(await ctx.db.from("science_items").select("status").eq("id",q.revision_id).single());
  if(item.status==="held"&&!corrections.updates.has(q.revision_id))throw new ScienceError("この問題は確認中です。保存済みの回答を残して中断できます。運営の確認後、ここから再開してください。",409,"item_unavailable",{attemptId:q.attempt_id});
  return publicQuestion(q);
}
function choiceOrder() {
  const values = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = randomInt(i + 1); [values[i], values[j]] = [values[j], values[i]]; }
  return values;
}

export async function examState(ctx: Context, id: string, feedbackOrdinal?: number): Promise<ExamState> {
  let a = await ownedAttempt(ctx, id);
  if (feedbackOrdinal !== undefined) {
    const records = await attemptRecords(ctx, id);
    const answer = records.answers.find(r => r.ordinal === feedbackOrdinal);
    const issued = records.issued.find(q => q.ordinal === feedbackOrdinal);
    if (!answer || !issued || answer.selected_index === null) throw new ScienceError("保存済みの回答が見つかりません。", 404, "answer_not_found");
    return { attempt: publicAttempt(a), question: null, group: ctx.visitor.route_group, signedIn: !!ctx.userId,
      explanation: answerExplanation(issued, answer.selected_index, records.corrections.updates.get(issued.revision_id)) };
  }
  if (a.state !== "active") return { attempt: publicAttempt(a), question: null, group: ctx.visitor.route_group, signedIn: !!ctx.userId };
  const existing = await ctx.db.from("science_issued").select("*").eq("attempt_id", id).eq("ordinal", a.ordinal).maybeSingle();
  if (existing.error) checked(existing);
  let issued = existing.data as Issued | null;
  if (!issued) {
    const records = await attemptRecords(ctx, id);
    let revisionId: string, predicted = .5, probability = 1, reason = "fixed-weekly-set-v1", candidateCount = 1;
    if (a.kind === "weekly") {
      const weekly = checked<{ revision_ids: string[]; ends_at: string }>(await ctx.db.from("science_weekly_sets").select("revision_ids,ends_at").eq("id", a.week_id).single());
      revisionId = weekly.revision_ids[a.ordinal];
    } else {
      const [candidates, history] = await Promise.all([
        candidateBank(ctx, a.release_id, a.kind, new Set(records.issued.map(q => q.family_id))),
        a.kind === "trial" ? previousTrialEvidence(ctx, a.id) : Promise.resolve([] as Response[])
      ]);
      const random=()=>randomInt(2 ** 24)/2 ** 24;
      const leastSeen = Math.min(...candidates.map(c => c.seenCount ?? 0));
      const labCandidates = candidates.filter(c => (c.seenCount ?? 0) === leastSeen);
      const lab=a.kind==="lab"?laboratoryChoice(labCandidates.map(c=>({...c,trustWeight:c.trustWeight??1})),random):null;
      const next = a.kind==="lab"?(lab?{candidate:lab.candidate,predicted:.625,selectionProbability:lab.probability,reason:`${leastSeen > 0 ? "repeat-fallback-v1:" : ""}lab-trust+25pct-uniform-v1`,candidateCount:labCandidates.length}:null):selectCandidate(candidates, records.responses, a.definition, random, history);
      if (!next) throw new ScienceError("この条件で出せる問題が不足しています。回答済みの内容は保存されています。", 409, "bank_exhausted");
      revisionId = next.candidate.revisionId; predicted = next.predicted; probability = next.selectionProbability; reason = next.reason; candidateCount = next.candidateCount;
    }
    try {
      issued = checked(await ctx.db.rpc("science_issue", { p_attempt: a.id, p_visitor: ctx.visitor.id, p_user: ctx.userId, p_ordinal: a.ordinal, p_revision: revisionId, p_order: choiceOrder(), p_predicted: predicted, p_probability: probability, p_reason: reason, p_candidates: candidateCount })) as Issued;
    } catch(error) {
      if(error instanceof ScienceError)error.extra={...error.extra,attemptId:a.id};
      throw error;
    }
    a = await ownedAttempt(ctx, id);
  }
  return { attempt: publicAttempt(a), question: await displayQuestion(ctx, issued), group: ctx.visitor.route_group, signedIn: !!ctx.userId };
}

export async function startExam(ctx: Context, kind: ExamKind, domain?: ScienceDomain) {
  await rateLimit(ctx, "start", 10);
  const config = await releaseConfig(ctx.db);
  if (!config.newAttempts) throw new ScienceError("公開準備中です。これまでの受験記録はマイページから確認できます。", 503, "release_pending");
  if (!ctx.userId && requiresAccount(ctx.visitor.route_group, kind)) throw new ScienceError("無料登録すると、この受験を始められます。", 401, "registration_required");
  const activeQuery = ctx.db.from("science_attempts").select("id").eq("state", "active");
  const activeResponse = await (ctx.userId ? activeQuery.or(`visitor_id.eq.${ctx.visitor.id},user_id.eq.${ctx.userId}`) : activeQuery.eq("visitor_id", ctx.visitor.id)).limit(1).maybeSingle();
  if (activeResponse.error) checked(activeResponse);
  if (activeResponse.data) throw new ScienceError("中断中の受験があります。再開するか、終了してから新しい受験を始めてください。", 409, "active_attempt", { attemptId: activeResponse.data.id });
  const exam = definition(kind, domain, ctx.visitor.full_length);
  let releaseId: string | null = null, week: string | null = null;
  if (kind === "weekly") {
    week = periodBounds("week").key;
    exam.week=week;exam.label=`${week}週の10問`;
    const set = await ctx.db.from("science_weekly_sets").select("id").eq("id", week).maybeSingle();
    if (set.error) checked(set);
    if (!set.data) throw new ScienceError("今週の問題は準備中です。", 409, "weekly_pending");
  } else {
    if (kind !== "lab") {
      const release = await ctx.db.from("science_releases").select("id").eq("state", "active").maybeSingle();
      if (release.error) checked(release);
      releaseId = release.data?.id ?? null;
    }
    if (!hasCapacity(await candidateBank(ctx, releaseId, kind), exam)) throw new ScienceError(kind === "lab" ? "投稿問題を準備しています。みんなの作問をお待ちください。" : "この受験に必要な問題がまだ揃っていません。別の分野や今週の10問をお楽しみください。", 409, "bank_exhausted");
  }
  const a = checked(await ctx.db.rpc("science_create_attempt", { p_visitor: ctx.visitor.id, p_user: ctx.userId, p_definition: exam, p_release: releaseId, p_model: MODEL_VERSION, p_week: week })) as Attempt;
  return examState(ctx, a.id);
}

export async function answerExam(ctx: Context, input: { attemptId: string; ordinal: number; token: string; operationId: string; selectedIndex: number | null }) {
  await rateLimit(ctx, "answer", 120);
  const a = await ownedAttempt(ctx, input.attemptId);
  const records = await attemptRecords(ctx, a.id);
  const issued = records.issued.find((q) => q.ordinal === input.ordinal && q.token === input.token);
  if (!issued) throw new ScienceError("提示された問題と一致しません。再読み込みしてください。", 409, "not_issued");
  let result: AttemptResult | null = null;
  const previous = records.answers.find((r) => r.operation_id === input.operationId);
  if (!previous && a.ordinal + 1 === a.total && a.ordinal === input.ordinal) {
    const correct = input.selectedIndex===null ? null : issued.choice_order[input.selectedIndex] === issued.snapshot.content.correctIndex;
    result = correctedResult(a, records.issued, [...records.answers, { attempt_id:a.id, ordinal:input.ordinal, operation_id:input.operationId, selected_index:input.selectedIndex, is_correct:correct, skip_reason:input.selectedIndex===null?"question_withdrawn":null, answered_at:new Date().toISOString() }], records.corrections);
  }
  const committed = checked(await ctx.db.rpc("science_commit_answer", { p_attempt: a.id, p_visitor: ctx.visitor.id, p_user: ctx.userId, p_ordinal: input.ordinal, p_token: input.token, p_operation: input.operationId, p_selected: input.selectedIndex, p_result: result })) as Attempt;
  // Answer commitment is reported independently of issuing the next question, so a later outage
  // cannot make the browser treat an already committed response as unsaved.
  return { attempt: publicAttempt(committed), savedOrdinal: input.ordinal, group: ctx.visitor.route_group, signedIn: !!ctx.userId,
    ...(input.selectedIndex !== null ? { explanation: answerExplanation(issued, input.selectedIndex, records.corrections.updates.get(issued.revision_id)) } : {}) };
}

export async function reviewAttempt(ctx: Context, id: string) {
  const a = await ownedAttempt(ctx, id);
  if (a.state !== "completed" && a.kind !== "lab") throw new ScienceError("解説は受験完了後に確認できます。", 403, "review_locked");
  const { issued, answers, corrections } = await attemptRecords(ctx, id);
  return { attempt: publicAttempt(a), rows: answers.map((answer) => {
    const q = issued.find((r) => r.ordinal === answer.ordinal)!;
    return { ordinal: answer.ordinal, revisionId: q.revision_id, domain: q.snapshot.domain, content: answer.selected_index===null?null:q.snapshot.content, selectedIndex: answer.selected_index===null?null:q.choice_order[answer.selected_index], correct: answer.is_correct, skipReason:answer.skip_reason, creditName:q.snapshot.creditName, update:corrections.updates.get(q.revision_id)??null };
  }) };
}
