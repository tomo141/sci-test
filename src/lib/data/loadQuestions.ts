import { unstable_cache } from "next/cache";
import { mapDbQuestionRow, type DbQuestionRow } from "./mapDbQuestion";
import { questions as staticPublishedQuestions, type Question } from "./questions";
import { createServiceRoleClient } from "@/src/lib/supabase/server";

async function loadPublishedQuestionsFromDb() {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("questions")
    .select(
      `
      id,
      title,
      question_text,
      domain,
      ability_axis,
      difficulty_initial,
      difficulty_internal,
      discrimination,
      status,
      quality_score,
      currentness_type,
      expires_at,
      question_choices (
        choice_index,
        choice_text,
        is_correct
      ),
      question_sources (
        source_url,
        source_note,
        evidence_memo
      ),
      question_statistics (
        answer_count,
        correct_rate,
        average_response_time_ms,
        good_count,
        bad_count,
        good_weight,
        bad_weight,
        high_scorer_bad_weight
      )
    `
    )
    .eq("status", "published")
    .order("id", { ascending: true });

  if (error || !data?.length) return [];
  return data.map((row) => mapDbQuestionRow(row as DbQuestionRow));
}

const loadPublishedQuestionsCached = unstable_cache(
  async () => {
    const fromDb = await loadPublishedQuestionsFromDb();
    if (fromDb.length) return fromDb;
    return staticPublishedQuestions;
  },
  ["published-questions"],
  { revalidate: 60 }
);

export async function getPublishedQuestions(): Promise<Question[]> {
  return loadPublishedQuestionsCached();
}

export async function getQuestionByIdFromBank(id: string): Promise<Question | null> {
  const bank = await getPublishedQuestions();
  return bank.find((question) => question.id === id) ?? null;
}
