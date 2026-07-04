import type { Question } from "@/src/lib/data/questions";
import {
  createExamPlan,
  createDomainExamPlan,
  nextQuestionForAnswers as pickNextQuestion,
  type AnswerRecord,
  type ExamPlan
} from "@/src/lib/scoring";
import type { CoverageSlot } from "@/src/lib/scoring/coverage";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
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

export function isScienceDomain(value: unknown): value is ScienceDomain {
  return typeof value === "string" && (domains as readonly string[]).includes(value);
}

export function getQuestionById(id: string, bank: Question[]) {
  return bank.find((question) => question.id === id) || null;
}

export function buildClientEstimate(answers: ClientExamAnswer[]) {
  return estimateFromAnswers(answers);
}

export function loadOrCreateExamPlan(storedPlan: string | null): ExamPlan {
  if (storedPlan) {
    try {
      const parsed = JSON.parse(storedPlan) as ExamPlan & { domainRounds?: unknown };
      if (parsed.mode === "domain" && isScienceDomain(parsed.targetDomain)) {
        return createDomainExamPlan(parsed.targetDomain, parsed.sessionSeed);
      }
      if (parsed.domainOrder?.length === 10) return { ...parsed, mode: "overall" };
      return createExamPlan(parsed.sessionSeed);
    } catch {
      return createExamPlan();
    }
  }
  return createExamPlan();
}

export function nextQuestionForAnswers(
  answers: ClientExamAnswer[],
  plan: ExamPlan,
  bank: Question[]
): AdaptiveSelection | null {
  return pickNextQuestion(bank, answers, plan);
}

export { createExamPlan, createDomainExamPlan, type ExamPlan };
