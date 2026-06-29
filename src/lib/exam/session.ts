import { questions, type Question } from "@/src/lib/data/questions";
import {
  createExamPlan,
  nextQuestionForAnswers as pickNextQuestion,
  type AnswerRecord,
  type ExamPlan
} from "@/src/lib/scoring";
import type { CoverageSlot } from "@/src/lib/scoring/coverage";
import { estimateFromAnswers } from "@/src/lib/scoring/estimate";

export type ClientExamAnswer = AnswerRecord & {
  selectedChoiceIndex: number;
  answeredAt: string;
  responseTimeMs?: number;
};

export type AdaptiveSelection = {
  question: Question;
  slot: CoverageSlot;
  selectionReason: string;
  predictedProbability: number;
  targetBand: { min: number; max: number };
};

export const EXAM_PLAN_STORAGE_KEY = "sci-test-exam-plan";

export function getQuestionById(id: string) {
  return questions.find((question) => question.id === id) || null;
}

export function buildClientEstimate(answers: ClientExamAnswer[]) {
  return estimateFromAnswers(answers);
}

export function loadOrCreateExamPlan(storedPlan: string | null): ExamPlan {
  if (storedPlan) {
    try {
      const parsed = JSON.parse(storedPlan) as ExamPlan & { domainRounds?: unknown };
      if (parsed.domainOrder?.length === 10) return parsed;
      return createExamPlan(parsed.sessionSeed);
    } catch {
      return createExamPlan();
    }
  }
  return createExamPlan();
}

export function nextQuestionForAnswers(answers: ClientExamAnswer[], plan: ExamPlan): AdaptiveSelection | null {
  return pickNextQuestion(questions, answers, plan);
}

export { createExamPlan, type ExamPlan };
