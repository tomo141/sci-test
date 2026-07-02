import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";
import { nextQuestionForAnswers, type ExamPlan } from "@/src/lib/scoring";
import { seededShuffleChoices, toPublicQuestion } from "@/src/lib/exam/publicQuestion";
import type { ClientExamAnswer } from "@/src/lib/exam/session";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";

const examPlanSchema = z.object({
  sessionSeed: z.string(),
  domainOrder: z.array(z.string()).length(10)
});

const nextSchema = z.object({
  examPlan: examPlanSchema,
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
  const limited = await enforceRateLimit("exam-next", "exam-next", rateLimitPolicies.examNext, request);
  if (limited) return limited;

  const parsed = nextSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid next question payload" }, { status: 400 });

  const questions = await getPublishedQuestions();
  const examPlan = parsed.data.examPlan as ExamPlan;
  const previousAnswers = (parsed.data.previousAnswers || []) as ClientExamAnswer[];
  const selection = nextQuestionForAnswers(questions, previousAnswers, examPlan);

  if (!selection) {
    return NextResponse.json({ error: "no question available" }, { status: 404 });
  }

  const shuffled = seededShuffleChoices(selection.question.id, examPlan.sessionSeed, selection.question);

  return NextResponse.json({
    question: toPublicQuestion(selection.question, shuffled.choices),
    slot: selection.slot,
    selectionReason: selection.selectionReason,
    predictedProbability: selection.predictedProbability
  });
}
