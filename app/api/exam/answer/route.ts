import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";
import { examConfig } from "@/src/lib/exam/config";
import { getQuestionById } from "@/src/lib/exam/session";
import {
  createExamPlan,
  estimateFromAnswers,
  nextQuestionForAnswers,
  predictCorrect,
  selectAdaptiveQuestion,
  type ExamPlan
} from "@/src/lib/scoring";
import { getCoverageSlot } from "@/src/lib/scoring/coverage";
import { buildAnswerFeedback } from "@/src/lib/exam/explanation";
import { persistProficiencyEstimates } from "@/src/lib/exam/persistEstimates";
import { seededShuffleChoices } from "@/src/lib/exam/publicQuestion";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";
import type { AnswerRecord } from "@/src/lib/scoring/types";

const examPlanSchema = z.object({
  sessionSeed: z.string(),
  domainOrder: z.array(z.string()).length(10)
});

const answerSchema = z.object({
  sessionId: z.string(),
  anonymousSessionId: z.string().optional(),
  questionId: z.string(),
  selectedDisplayIndex: z.number().int().min(0).max(3),
  responseTimeMs: z.number().int().nonnegative().optional(),
  examPlan: examPlanSchema.optional(),
  previousAnswers: z
    .array(
      z.object({
        questionId: z.string(),
        domain: z.string(),
        abilityAxis: z.string(),
        difficulty: z.number(),
        discrimination: z.number().optional(),
        correct: z.boolean(),
        qualityScore: z.number().optional()
      })
    )
    .optional()
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit("exam-answer", "exam-answer", rateLimitPolicies.examAnswer, request);
  if (limited) return limited;

  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid answer payload" }, { status: 400 });

  const questions = await getPublishedQuestions();
  const question = getQuestionById(parsed.data.questionId, questions);
  if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

  const previousAnswers = (parsed.data.previousAnswers || []) as AnswerRecord[];
  const examPlan = (parsed.data.examPlan || createExamPlan()) as ExamPlan;
  const before = estimateFromAnswers(previousAnswers);
  const shuffled = seededShuffleChoices(question.id, examPlan.sessionSeed, question);
  const selectedOriginalIndex = shuffled.displayToOriginal[parsed.data.selectedDisplayIndex];
  if (selectedOriginalIndex === undefined) {
    return NextResponse.json({ error: "invalid display index" }, { status: 400 });
  }
  const correct = selectedOriginalIndex === question.correctIndex;
  const currentAnswer: AnswerRecord = {
    questionId: question.id,
    domain: question.domain,
    abilityAxis: question.abilityAxis,
    difficulty: question.difficulty,
    discrimination: question.discrimination,
    correct,
    qualityScore: question.qualityScore,
    responseTimeMs: parsed.data.responseTimeMs
  };
  const after = estimateFromAnswers([...previousAnswers, currentAnswer]);
  const predicted = predictCorrect(before.overall, question.difficulty, question.discrimination);
  const currentSelection = selectAdaptiveQuestion({
    questions,
    answers: previousAnswers,
    plan: examPlan
  });
  const nextSelection = nextQuestionForAnswers(questions, [...previousAnswers, currentAnswer], examPlan);

  const supabase = createServiceRoleClient();
  if (supabase && !parsed.data.sessionId.startsWith("local-")) {
    const authClient = await createServerSupabaseClient();
    const userId = (await authClient?.auth.getUser())?.data.user?.id ?? null;
    const { data: sessionRow } = await supabase
      .from("exam_sessions")
      .select("user_id, anonymous_session_id")
      .eq("id", parsed.data.sessionId)
      .maybeSingle();
    const ownsSession =
      !!sessionRow &&
      ((userId && sessionRow.user_id === userId) ||
        (!!parsed.data.anonymousSessionId && sessionRow.anonymous_session_id === parsed.data.anonymousSessionId));

    if (!ownsSession) {
      return NextResponse.json({ error: "session not found" }, { status: 403 });
    }

    await supabase.from("exam_answers").insert({
      session_id: parsed.data.sessionId,
      user_id: sessionRow?.user_id ?? null,
      question_id: question.id,
      selected_choice_index: selectedOriginalIndex,
      is_correct: correct,
      response_time_ms: parsed.data.responseTimeMs ?? null,
      served_difficulty: question.difficulty,
      predicted_correct_probability: predicted,
      selection_reason: currentSelection?.selectionReason || "adaptive",
      score_before: before.overall,
      score_after: after.overall
    });

    await supabase
      .from("exam_sessions")
      .update({
        latest_score: after.overall,
        score_low: after.scoreRange[0],
        score_high: after.scoreRange[1],
        diagnostic_accuracy: after.accuracyLabel,
        completed_10_at: after.counts.overall >= examConfig.quickResultThreshold ? new Date().toISOString() : null,
        completed_50_at: examConfig.isCycleComplete(after.counts.overall) ? new Date().toISOString() : null
      })
      .eq("id", parsed.data.sessionId);

    await persistProficiencyEstimates(supabase, parsed.data.sessionId, sessionRow?.user_id ?? null, after);
  }

  const feedback = buildAnswerFeedback(question, selectedOriginalIndex, correct);
  const { detailedExplanation: _detailedExplanation, ...clientFeedback } = feedback;

  return NextResponse.json({
    correct,
    shortExplanation: question.shortExplanation,
    correctDisplayIndex: shuffled.correctIndex,
    selectedDisplayIndex: parsed.data.selectedDisplayIndex,
    feedback: clientFeedback,
    estimate: after,
    slot: getCoverageSlot(previousAnswers.length, examPlan, previousAnswers),
    nextQuestionId: nextSelection?.question.id ?? null,
    selectionReason: currentSelection?.selectionReason ?? null,
    predictedProbability: predicted
  });
}
