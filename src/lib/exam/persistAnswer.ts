import type { SupabaseClient } from "@supabase/supabase-js";
import { examConfig } from "@/src/lib/exam/config";
import { persistProficiencyEstimates } from "@/src/lib/exam/persistEstimates";
import type { ExamPlan } from "@/src/lib/scoring";
import type { Estimate } from "@/src/lib/scoring/types";

type PersistExamAnswerInput = {
  sessionId: string;
  userId: string | null;
  questionId: string;
  selectedOriginalIndex: number;
  correct: boolean;
  responseTimeMs: number | null;
  servedDifficulty: number;
  predictedProbability: number;
  selectionReason: string;
  scoreBefore: number;
  scoreAfter: number;
  estimate: Estimate;
  examPlan: ExamPlan;
};

export async function persistExamAnswer(
  supabase: SupabaseClient,
  input: PersistExamAnswerInput
) {
  await supabase.from("exam_answers").insert({
    session_id: input.sessionId,
    user_id: input.userId,
    question_id: input.questionId,
    selected_choice_index: input.selectedOriginalIndex,
    is_correct: input.correct,
    response_time_ms: input.responseTimeMs,
    served_difficulty: input.servedDifficulty,
    predicted_correct_probability: input.predictedProbability,
    selection_reason: input.selectionReason,
    score_before: input.scoreBefore,
    score_after: input.scoreAfter
  });

  await supabase
    .from("exam_sessions")
    .update({
      latest_score:
        input.examPlan.mode === "domain" && input.examPlan.targetDomain
          ? input.estimate.domains[input.examPlan.targetDomain]
          : input.estimate.overall,
      score_low: input.estimate.scoreRange[0],
      score_high: input.estimate.scoreRange[1],
      diagnostic_accuracy: input.estimate.accuracyLabel,
      completed_10_at:
        input.estimate.counts.overall >= examConfig.quickResultThreshold ? new Date().toISOString() : null,
      completed_50_at: examConfig.isCycleComplete(input.estimate.counts.overall) ? new Date().toISOString() : null
    })
    .eq("id", input.sessionId);

  await persistProficiencyEstimates(supabase, input.sessionId, input.userId, input.estimate);
}
