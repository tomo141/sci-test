import type { Question } from "@/src/lib/data/questions";
import type { AbilityAxis } from "@/src/lib/data/taxonomy";
import { scoringConfig } from "./config";
import { type CoverageSlot, type ExamPlan, createRng, getCoverageSlot } from "./coverage";
import { blendedAbilityForQuestion, dedupeAnswers, estimateFromAnswers, selectionAbilityInflation } from "./estimate";
import {
  distanceToBand,
  difficultyForTargetProbability,
  effectiveCumulativeRateForSelection,
  maxDifficultyCeiling,
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

function estimateProbability(question: Question, answers: AnswerRecord[], questionIndex: number) {
  const estimate = estimateFromAnswers(answers);
  const selectionRate = effectiveCumulativeRateForSelection(estimate.cumulativeCorrectRate, questionIndex);
  const ability =
    blendedAbilityForQuestion(estimate.internal, question.domain, question.abilityAxis) +
    selectionAbilityInflation(selectionRate);
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
  lastQuestion: Question | null,
  questionIndex: number
): CandidateContext {
  const probability = estimateProbability(question, answers, questionIndex);
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
  requirePublished: boolean,
  questionIndex: number
) {
  const difficultyCeiling = maxDifficultyCeiling(questionIndex);
  const answeredIds = new Set(answers.map((answer) => answer.questionId));
  return questions.filter((question) => {
    if (question.abilityAxis !== BASIC_AXIS) return false;
    if (answeredIds.has(question.id)) return false;
    if (question.difficulty > difficultyCeiling) return false;
    if (requirePublished && !isPublishedAndValid(question, now)) return false;
    if (requireSlot && slot.required) {
      return question.domain === slot.domain && question.abilityAxis === slot.abilityAxis;
    }
    return true;
  });
}

function pickFromTopWeighted<T extends { weight: number }>(
  items: T[],
  rng: () => number,
  poolSize = scoringConfig.candidatePoolSize
): T {
  if (!items.length) throw new Error("pickFromTopWeighted requires at least one item");
  const ranked = [...items].sort((left, right) => right.weight - left.weight);
  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  return weightedPick(
    pool,
    pool.map((item) => item.weight),
    rng
  );
}

function selectFromCandidates(
  candidates: Question[],
  answers: AnswerRecord[],
  slot: CoverageSlot,
  band: { min: number; max: number },
  lastQuestion: Question | null,
  rng: () => number,
  reasonPrefix: string,
  stageIndex: number,
  questionIndex: number
): AdaptiveSelection | null {
  if (!candidates.length) return null;

  const scored = candidates.map((question) =>
    buildCandidate(question, answers, slot, band, lastQuestion, questionIndex)
  );
  const weighted = pickFromTopWeighted(scored, rng);

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
  target: number,
  rng: () => number,
  questionIndex: number
): AdaptiveSelection | null {
  if (!candidates.length) return null;

  const ranked = candidates
    .map((question) => ({
      question,
      probability: estimateProbability(question, answers, questionIndex),
      targetDistance: Math.abs(estimateProbability(question, answers, questionIndex) - target),
      weight: 0
    }))
    .sort((left, right) => left.targetDistance - right.targetDistance);

  const pool = ranked.slice(0, Math.min(scoringConfig.candidatePoolSize, ranked.length));
  for (const item of pool) {
    item.weight = 1 / (0.01 + item.targetDistance);
  }
  const best = pickFromTopWeighted(pool, rng);

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
  const rng = createRng(`${plan.sessionSeed}:select:0`);

  const domainCandidates = filterCandidates(questions, [], slot, now, true, true, 0).filter(
    (question) => question.domain === slot.domain && question.abilityAxis === slot.abilityAxis
  );

  const ranked = domainCandidates
    .map((question) => ({
      question,
      distance: Math.abs(question.difficulty - targetDifficulty),
      weight: 1 / (1 + Math.abs(question.difficulty - targetDifficulty) / 50)
    }))
    .sort((left, right) => left.distance - right.distance);

  const pool = ranked.slice(0, Math.min(scoringConfig.candidatePoolSize, ranked.length));
  const picked = pool.length
    ? pickFromTopWeighted(pool, rng).question
    : filterCandidates(questions, [], slot, now, true, true, 0)[0];
  if (!picked) return null;

  return {
    question: picked,
    slot,
    selectionReason: "first_question_target_70pct",
    predictedProbability: predictCorrectProbability(
      scoringConfig.initialAbility,
      picked.difficulty,
      picked.discrimination
    ),
    targetBand: scoringConfig.lowRateTargetBand
  };
}

function selectHardestAvailable(
  candidates: Question[],
  answers: AnswerRecord[],
  slot: CoverageSlot,
  selectionRate: number,
  rng: () => number,
  questionIndex: number
): AdaptiveSelection | null {
  if (!candidates.length || selectionRate < 1) return null;

  const maxDifficulty = Math.max(...candidates.map((question) => question.difficulty));
  const hardestPool = candidates.filter((question) => question.difficulty === maxDifficulty);
  const weighted = pickFromTopWeighted(
    hardestPool.map((question) => ({
      question,
      weight: 1 + question.qualityScore
    })),
    rng
  );

  return {
    question: weighted.question,
    slot,
    selectionReason: "adaptive_perfect:hardest_available",
    predictedProbability: estimateProbability(weighted.question, answers, questionIndex),
    targetBand: scoringConfig.perfectRateTargetBand
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
  const selectionRate = effectiveCumulativeRateForSelection(cumulativeRate, questionIndex);
  const baseBand = targetProbabilityBand(selectionRate);
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
    const candidates = filterCandidates(
      questions,
      uniqueAnswers,
      slot,
      now,
      stage.requireSlot,
      stage.requirePublished,
      questionIndex
    );
    const inBandCandidates = candidates.filter(
      (question) => distanceToBand(estimateProbability(question, uniqueAnswers, questionIndex), band) === 0
    );

    if (!inBandCandidates.length && selectionRate >= 1) {
      const hardest = selectHardestAvailable(candidates, uniqueAnswers, slot, selectionRate, rng, questionIndex);
      if (hardest) return hardest;
    }

    const pool = inBandCandidates.length ? inBandCandidates : candidates;

    const selection = selectFromCandidates(
      pool,
      uniqueAnswers,
      slot,
      band,
      lastQuestion,
      rng,
      stage.requireSlot ? "adaptive_slot" : "adaptive_relaxed",
      stageIndex,
      questionIndex
    );
    if (selection) return selection;
  }

  const anyUnanswered = questions.filter(
    (question) =>
      !uniqueAnswers.some((answer) => answer.questionId === question.id) &&
      isPublishedAndValid(question, now) &&
      question.difficulty <= maxDifficultyCeiling(questionIndex)
  );
  const target = (baseBand.min + baseBand.max) / 2;
  return selectClosestToTarget(anyUnanswered, uniqueAnswers, slot, target, rng, questionIndex);
}

export function nextQuestionForAnswers(
  questions: Question[],
  answers: AnswerRecord[],
  plan: ExamPlan
): AdaptiveSelection | null {
  return selectAdaptiveQuestion({ questions, answers, plan });
}
