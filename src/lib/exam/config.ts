const QUESTIONS_PER_CYCLE = 50;
const QUICK_RESULT_THRESHOLD = 10;

export const examConfig = {
  questionsPerCycle: QUESTIONS_PER_CYCLE,
  quickResultThreshold: QUICK_RESULT_THRESHOLD,
  canViewQuickResult(answerCount: number) {
    return answerCount >= QUICK_RESULT_THRESHOLD && answerCount < QUESTIONS_PER_CYCLE;
  },
  canViewKarte(answerCount: number) {
    return answerCount >= QUESTIONS_PER_CYCLE;
  },
  isCycleComplete(answerCount: number) {
    return answerCount >= QUESTIONS_PER_CYCLE;
  }
} as const;
