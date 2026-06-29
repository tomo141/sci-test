import { examConfig } from "@/src/lib/exam/config";
import { domains, type AbilityAxis, type ScienceDomain } from "@/src/lib/data/taxonomy";

export type ExamPlan = {
  sessionSeed: string;
  domainOrder: ScienceDomain[];
};

export type CoverageSlot = {
  domain: ScienceDomain;
  abilityAxis: AbilityAxis;
  required: boolean;
  phase: "first_domains" | "coverage" | "extended";
};

const BASIC_AXIS: AbilityAxis = "基礎力";
const QUESTIONS_PER_CYCLE = examConfig.questionsPerCycle;

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function shuffleWithSeed<T>(items: readonly T[], seed: string): T[] {
  const rng = createRng(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickWithSeed<T>(items: readonly T[], seed: string): T {
  const rng = createRng(seed);
  return items[Math.floor(rng() * items.length)];
}

export function createExamPlan(sessionSeed = crypto.randomUUID()): ExamPlan {
  return {
    sessionSeed,
    domainOrder: shuffleWithSeed(domains, `${sessionSeed}:domains:first10`)
  };
}

export function allCoverageCells(): Array<{ domain: ScienceDomain; abilityAxis: AbilityAxis }> {
  return domains.map((domain) => ({ domain, abilityAxis: BASIC_AXIS }));
}

export function coveredCells(answered: Array<{ domain: ScienceDomain; abilityAxis: AbilityAxis }>) {
  return new Set(answered.map((answer) => `${answer.domain}:${answer.abilityAxis}`));
}

export function uncoveredCells(answered: Array<{ domain: ScienceDomain; abilityAxis: AbilityAxis }>) {
  const covered = coveredCells(answered);
  return allCoverageCells().filter((cell) => !covered.has(`${cell.domain}:${cell.abilityAxis}`));
}

export function getCoverageSlot(
  questionIndex: number,
  plan: ExamPlan,
  _answered: Array<{ domain: ScienceDomain; abilityAxis: AbilityAxis }>
): CoverageSlot {
  const cycle = Math.floor(questionIndex / QUESTIONS_PER_CYCLE);
  const posInCycle = questionIndex % QUESTIONS_PER_CYCLE;

  if (posInCycle < domains.length) {
    const domainOrder =
      cycle === 0
        ? plan.domainOrder
        : shuffleWithSeed(domains, `${plan.sessionSeed}:cycle:${cycle}:first-round`);
    return {
      domain: domainOrder[posInCycle],
      abilityAxis: BASIC_AXIS,
      required: true,
      phase: cycle === 0 ? "first_domains" : "coverage"
    };
  }

  const posAfterFirst = posInCycle - domains.length;
  const round = Math.floor(posAfterFirst / domains.length);
  const posInRound = posAfterFirst % domains.length;
  const domainOrder = shuffleWithSeed(domains, `${plan.sessionSeed}:cycle:${cycle}:round:${round}`);

  return {
    domain: domainOrder[posInRound],
    abilityAxis: BASIC_AXIS,
    required: false,
    phase: "extended"
  };
}

export { createRng };
