import type { Question } from "@/src/lib/data/questions";
import type { AbilityAxis } from "@/src/lib/data/taxonomy";
import { scoringConfig } from "./config";
import { type CoverageSlot, type ExamPlan, createRng, getCoverageSlot } from "./coverage";
import { blendedAbilityForQuestion, dedupeAnswers, estimateFromAnswers } from "./estimate";
import {
  distanceToBand,
  difficultyForTargetProbability,
  predictCorrectProbability,
  relaxProbabilityBand,
  targetProbabilityBand
} from "./probability";
import type { AnswerRecord } from "./types";

export type AdaptiveSelection = {
  question: Question;
  slot: CoverageSlot;
  selectionReason: string;
  predictedProbability: number;
  targetBand: { min: number; max: number };
};

export type AdaptiveSelectionContext = {
  questions: Question[];
  answers: AnswerRecord[];
  plan: ExamPlan;
  now?: Date;
};

const BASIC_AXIS: AbilityAxis = "基礎力";

function isPublishedAndValid(question: Question, now: Date) {
  if (!question.published) return false;
  if (question.currentnessType === "current" && question.expiresAt) {
    return new Date(question.expiresAt) >= now;
  }
  return true;
}

function isSimilarToLast(question: Question, lastQuestion: Question | null) {
  if (!lastQuestion) return false;
  return question.domain === lastQuestion.domain && question.abilityAxis === lastQuestion.abilityAxis;
}

function exposureCount(question: Question) {
  return question.statistics.answerCount;
}

function estimateProbability(question: Question, answers: AnswerRecord[]) {
  const estimate = estimateFromAnswers(answers);
  const ability = blendedAbilityForQuestion(estimate.internal, question.domain, question.abilityAxis);
  return predictCorrectProbability(ability, question.difficulty, question.discrimination);
}

function weightedPick<T>(items: T[], weights: number[], rng: () => number) {
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 0) return items[0];
  let cursor = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= Math.max(0, weights[index]);
    if (cursor <= 0) return items[index];
  }
  return items[items.length - 1];
}

type CandidateContext = {
  question: Question;
  probability: number;
  bandDistance: number;
  inBand: boolean;
  matchesSlot: boolean;
  weight: number;
};

function buildCandidate(
  question: Question,
  answers: AnswerRecord[],
  slot: CoverageSlot,
  band: { min: number; max: number },
  lastQuestion: Question | null
): CandidateContext {
  const probability = estimateProbability(question, answers);
  const bandDistance = distanceToBand(probability, band);
  const inBand = bandDistance === 0;
  const matchesSlot = question.domain === slot.domain && question.abilityAxis === slot.abilityAxis;
  const weights = scoringConfig.selectionWeights;

  let weight = 0.2 + question.qualityScore * weights.quality;
  weight += inBand ? weights.inBand : Math.max(0.2, weights.nearBand - bandDistance * 4);
  if (slot.required && matchesSlot) weight += weights.coverage;
  weight += weights.exposureBalance / (1 + exposureCount(question));
  if (isSimilarToLast(question, lastQuestion)) weight *= weights.avoidSimilar;

  return { question, probability, bandDistance, inBand, matchesSlot, weight };
}

function filterCandidates(
  questions: Question[],
  answers: AnswerRecord[],
  slot: CoverageSlot,
  now: Date,
  requireSlot: boolean,
  requirePublished: boolean
) {
  const answeredIds = new Set(answers.map((answer) => answer.questionId));
  return questions.filter((question) => {
    if (question.abilityAxis !== BASIC_AXIS) return false;
    if (answeredIds.has(question.id)) return false;
    if (requirePublished && !isPublishedAndValid(question, now)) return false;
    if (requireSlot && slot.required) {
      return question.domain === slot.domain && question.abilityAxis === slot.abilityAxis;
    }
    return true;
  });
}

function selectFromCandidates(
  candidates: Question[],
  answers: AnswerRecord[],
  slot: CoverageSlot,
  band: { min: number; max: number },
  lastQuestion: Question | null,
  rng: () => number,
  reasonPrefix: string,
  stageIndex: number
): AdaptiveSelection | null {
  if (!candidates.length) return null;

  const scored = candidates.map((question) => buildCandidate(question, answers, slot, band, lastQuestion));
  const weighted = weightedPick(
    scored,
    scored.map((candidate) => candidate.weight),
    rng
  );

  return {
    question: weighted.question,
    slot,
    selectionReason: `${reasonPrefix}:stage${stageIndex}:${weighted.inBand ? "in_band" : "near_band"}`,
    predictedProbability: weighted.probability,
    targetBand: band
  };
}

function selectClosestToTarget(
  candidates: Question[],
  answers: AnswerRecord[],
  slot: CoverageSlot,
  target: number
): AdaptiveSelection | null {
  if (!candidates.length) return null;

  const ranked = candidates
    .map((question) => ({
      question,
      probability: estimateProbability(question, answers),
      targetDistance: Math.abs(estimateProbability(question, answers) - target)
    }))
    .sort((left, right) => left.targetDistance - right.targetDistance);

  const best = ranked[0];
  return {
    question: best.question,
    slot,
    selectionReason: "adaptive_fallback:stage5:closest_target",
    predictedProbability: best.probability,
    targetBand: { min: target - 0.05, max: target + 0.05 }
  };
}

export function selectFirstQuestion(context: AdaptiveSelectionContext): AdaptiveSelection | null {
  const { questions, plan, now = new Date() } = context;
  const slot = getCoverageSlot(0, plan, []);
  const targetDifficulty = difficultyForTargetProbability(
    scoringConfig.initialAbility,
    scoringConfig.firstQuestionTargetProbability
  );

  const candidates = filterCandidates(questions, [], slot, now, true, true)
    .filter((question) => question.domain === slot.domain && question.abilityAxis === slot.abilityAxis)
    .sort(
      (left, right) =>
        Math.abs(left.difficulty - targetDifficulty) - Math.abs(right.difficulty - targetDifficulty)
    );

  const question = candidates[0] || filterCandidates(questions, [], slot, now, true, true)[0];
  if (!question) return null;

  return {
    question,
    slot,
    selectionReason: "first_question_target_70pct",
    predictedProbability: predictCorrectProbability(
      scoringConfig.initialAbility,
      question.difficulty,
      question.discrimination
    ),
    targetBand: scoringConfig.lowRateTargetBand
  };
}

export function selectAdaptiveQuestion(context: AdaptiveSelectionContext): AdaptiveSelection | null {
  const { questions, answers, plan, now = new Date() } = context;
  const uniqueAnswers = dedupeAnswers(answers);
  const questionIndex = uniqueAnswers.length;

  if (questionIndex === 0) {
    return selectFirstQuestion(context);
  }

  const slot = getCoverageSlot(questionIndex, plan, uniqueAnswers);
  const cumulativeRate = estimateFromAnswers(uniqueAnswers).cumulativeCorrectRate;
  const baseBand = targetProbabilityBand(cumulativeRate);
  const lastQuestion =
    questions.find((question) => question.id === uniqueAnswers[uniqueAnswers.length - 1]?.questionId) || null;
  const rng = createRng(`${plan.sessionSeed}:select:${questionIndex}`);

  const relaxationStages = [
    { requireSlot: slot.required, requirePublished: true, bandSteps: 0 },
    { requireSlot: slot.required, requirePublished: true, bandSteps: 1 },
    { requireSlot: slot.required, requirePublished: true, bandSteps: 2 },
    { requireSlot: false, requirePublished: true, bandSteps: scoringConfig.maxBandRelaxationSteps },
    { requireSlot: false, requirePublished: false, bandSteps: scoringConfig.maxBandRelaxationSteps }
  ];

  for (let stageIndex = 0; stageIndex < relaxationStages.length; stageIndex += 1) {
    const stage = relaxationStages[stageIndex];
    const band = relaxProbabilityBand(baseBand, stage.bandSteps);
    const candidates = filterCandidates(questions, uniqueAnswers, slot, now, stage.requireSlot, stage.requirePublished);
    const inBandCandidates = candidates.filter(
      (question) => distanceToBand(estimateProbability(question, uniqueAnswers), band) === 0
    );
    const pool = inBandCandidates.length ? inBandCandidates : candidates;

    const selection = selectFromCandidates(
      pool,
      uniqueAnswers,
      slot,
      band,
      lastQuestion,
      rng,
      stage.requireSlot ? "adaptive_slot" : "adaptive_relaxed",
      stageIndex
    );
    if (selection) return selection;
  }

  const anyUnanswered = questions.filter(
    (question) => !uniqueAnswers.some((answer) => answer.questionId === question.id) && isPublishedAndValid(question, now)
  );
  const target = (baseBand.min + baseBand.max) / 2;
  return selectClosestToTarget(anyUnanswered, uniqueAnswers, slot, target);
}

export function nextQuestionForAnswers(
  questions: Question[],
  answers: AnswerRecord[],
  plan: ExamPlan
): AdaptiveSelection | null {
  return selectAdaptiveQuestion({ questions, answers, plan });
}
