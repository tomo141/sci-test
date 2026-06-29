import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const inputPath = process.argv[2] || "supabase/seed/generated/questions-basic-v1.json";
const publishMode = process.argv.includes("--published");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const questions = JSON.parse(readFileSync(inputPath, "utf8"));

for (const question of questions) {
  const { error: questionError } = await supabase.from("questions").upsert({
    id: question.id,
    title: question.title,
    question_text: question.question_text,
    domain: question.domain,
    ability_axis: question.ability_axis,
    difficulty_initial: question.difficulty_initial,
    difficulty_internal: question.difficulty_initial,
    discrimination: 1,
    status: publishMode ? "published" : "draft",
    quality_score: publishMode ? 0.9 : 0.6,
    currentness_type: question.currentness_type,
    expires_at: question.expires_at
  });
  if (questionError) throw questionError;

  const choices = question.choices.map((choice, index) => ({
    question_id: question.id,
    choice_index: index,
    choice_text: choice,
    is_correct: index === question.correct_choice_index
  }));
  const { error: choiceError } = await supabase.from("question_choices").upsert(choices, {
    onConflict: "question_id,choice_index"
  });
  if (choiceError) throw choiceError;

  const { error: sourceError } = await supabase.from("question_sources").upsert({
    question_id: question.id,
    source_url: question.source_url ?? "",
    source_note: [
      question.source_note,
      question.subdomain ? `小テーマ: ${question.subdomain}` : null,
      question.cognitive_type ? `問題タイプ: ${question.cognitive_type}` : null,
      question.learning_objective ? `学習目標: ${question.learning_objective}` : null
    ]
      .filter(Boolean)
      .join(" / "),
    evidence_memo: JSON.stringify({
      detailed_explanation: question.detailed_explanation,
      distractor_rationales: question.distractor_rationales ?? [],
      common_misconception: question.common_misconception ?? ""
    })
  }, {
    onConflict: "question_id"
  });
  if (sourceError) throw sourceError;
}

console.log(`Imported ${questions.length} questions as ${publishMode ? "published" : "draft"}.`);
