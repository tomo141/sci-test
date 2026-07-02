import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";
import { buildAnswerFeedback } from "@/src/lib/exam/explanation";
import { getQuestionById } from "@/src/lib/exam/session";
import { seededShuffleChoices } from "@/src/lib/exam/publicQuestion";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";

const answerSchema = z.object({
  questionId: z.string(),
  selectedDisplayIndex: z.number().int().min(0).max(3),
  sessionSeed: z.string().default("training"),
  mode: z.enum(["domain", "random"]).default("domain")
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit("training-answer", "training-answer", rateLimitPolicies.trainingAnswer, request);
  if (limited) return limited;

  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid training answer payload" }, { status: 400 });

  const questions = await getPublishedQuestions();
  const question = getQuestionById(parsed.data.questionId, questions);
  if (!question) return NextResponse.json({ error: "question not found" }, { status: 404 });

  const shuffled = seededShuffleChoices(
    question.id,
    `${parsed.data.sessionSeed}:${parsed.data.mode}`,
    question
  );
  const selectedOriginalIndex = shuffled.displayToOriginal[parsed.data.selectedDisplayIndex];
  if (selectedOriginalIndex === undefined) {
    return NextResponse.json({ error: "invalid display index" }, { status: 400 });
  }

  const correct = selectedOriginalIndex === question.correctIndex;
  const feedback = buildAnswerFeedback(question, selectedOriginalIndex, correct);
  const { detailedExplanation: _detailedExplanation, ...clientFeedback } = feedback;

  return NextResponse.json({
    correct,
    shortExplanation: question.shortExplanation,
    correctDisplayIndex: shuffled.correctIndex,
    selectedDisplayIndex: parsed.data.selectedDisplayIndex,
    feedback: clientFeedback,
    domain: question.domain
  });
}
