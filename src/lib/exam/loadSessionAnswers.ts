import type { SupabaseClient } from "@supabase/supabase-js";
import { getQuestionById } from "@/src/lib/exam/session";
import type { ClientExamAnswer } from "@/src/lib/exam/session";

type ExamAnswerRow = {
  question_id: string;
  selected_choice_index: number;
  is_correct: boolean;
  answered_at: string;
  response_time_ms: number | null;
  served_difficulty: number | null;
};

export function toClientExamAnswers(rows: ExamAnswerRow[]): ClientExamAnswer[] {
  const answers: ClientExamAnswer[] = [];

  for (const row of rows) {
    const question = getQuestionById(row.question_id);
    if (!question) continue;
    answers.push({
      questionId: row.question_id,
      domain: question.domain,
      abilityAxis: question.abilityAxis,
      difficulty: row.served_difficulty ?? question.difficulty,
      discrimination: question.discrimination,
      qualityScore: question.qualityScore,
      correct: row.is_correct,
      selectedChoiceIndex: row.selected_choice_index,
      answeredAt: row.answered_at,
      responseTimeMs: row.response_time_ms ?? undefined
    });
  }

  return answers;
}

export async function loadSessionAnswersFromDb(
  supabase: SupabaseClient,
  sessionId: string
): Promise<ClientExamAnswer[]> {
  const { data, error } = await supabase
    .from("exam_answers")
    .select("question_id, selected_choice_index, is_correct, answered_at, response_time_ms, served_difficulty")
    .eq("session_id", sessionId)
    .order("answered_at", { ascending: true });

  if (error || !data?.length) return [];
  return toClientExamAnswers(data as ExamAnswerRow[]);
}

export async function loadLatestSessionAnswersForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<{ sessionId: string; answers: ClientExamAnswer[] } | null> {
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session?.id) return null;
  const answers = await loadSessionAnswersFromDb(supabase, session.id);
  if (!answers.length) return null;
  return { sessionId: session.id, answers };
}
