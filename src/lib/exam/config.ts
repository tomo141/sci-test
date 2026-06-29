const DEFAULT_QUESTIONS_PER_CYCLE = 50;
const QUICK_RESULT_THRESHOLD = 10;

function parseQuestionsPerCycle(): number {
  const raw = process.env.NEXT_PUBLIC_EXAM_QUESTIONS_PER_CYCLE;
  if (!raw) return DEFAULT_QUESTIONS_PER_CYCLE;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_QUESTIONS_PER_CYCLE;
  return parsed;
}

const questionsPerCycle = parseQuestionsPerCycle();

export const examConfig = {
  defaultQuestionsPerCycle: DEFAULT_QUESTIONS_PER_CYCLE,
  questionsPerCycle,
  quickResultThreshold: QUICK_RESULT_THRESHOLD,
  isShortMode: questionsPerCycle < DEFAULT_QUESTIONS_PER_CYCLE,
  canViewQuickResult(answerCount: number) {
    return answerCount >= QUICK_RESULT_THRESHOLD && answerCount < questionsPerCycle;
  },
  canViewKarte(answerCount: number) {
    return answerCount >= questionsPerCycle;
  },
  isCycleComplete(answerCount: number) {
    return answerCount >= questionsPerCycle;
  }
} as const;
