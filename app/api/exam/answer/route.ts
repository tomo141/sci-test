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
import { persistProficiencyEstimates } from "@/src/lib/exam/persistEstimates";
import { createServiceRoleClient } from "@/src/lib/supabase/server";
import type { AnswerRecord } from "@/src/lib/scoring/types";

const examPlanSchema = z.object({
  sessionSeed: z.string(),
  domainOrder: z.array(z.string()).length(10)
});

const answerSchema = z.object({
  sessionId: z.string(),
  anonymousSessionId: z.string().optional(),
  questionId: z.string(),
  selectedChoiceIndex: z.number().int().min(0).max(3),
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
  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid answer payload" }, { status: 400 });

  const questions = await getPublishedQuestions();
  const question = getQuestionById(parsed.data.questionId, questions);
  if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

  const previousAnswers = (parsed.data.previousAnswers || []) as AnswerRecord[];
  const examPlan = (parsed.data.examPlan || createExamPlan()) as ExamPlan;
  const before = estimateFromAnswers(previousAnswers);
  const correct = parsed.data.selectedChoiceIndex === question.correctIndex;
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
    const { data: sessionRow } = await supabase
      .from("exam_sessions")
      .select("user_id")
      .eq("id", parsed.data.sessionId)
      .maybeSingle();

    await supabase.from("exam_answers").insert({
      session_id: parsed.data.sessionId,
      user_id: sessionRow?.user_id ?? null,
      question_id: question.id,
      selected_choice_index: parsed.data.selectedChoiceIndex,
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

  return NextResponse.json({
    correct,
    correctChoiceIndex: question.correctIndex,
    shortExplanation: question.shortExplanation,
    detailedExplanation: question.detailedExplanation,
    estimate: after,
    slot: getCoverageSlot(previousAnswers.length, examPlan, previousAnswers),
    nextQuestionId: nextSelection?.question.id ?? null,
    selectionReason: currentSelection?.selectionReason ?? null,
    predictedProbability: predicted
  });
}
