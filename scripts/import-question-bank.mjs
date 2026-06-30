import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--")) || "supabase/seed/generated/questions-knowledge.json";
const publishMode = args.includes("--published");
const statusArg = args.find((arg) => arg.startsWith("--status="))?.split("=")[1];
const allowedStatuses = new Set(["draft", "published", "reduced", "archived"]);
const status = statusArg && allowedStatuses.has(statusArg) ? statusArg : publishMode ? "published" : "draft";
const qualityScore = status === "published" ? 0.9 : status === "archived" ? 0.3 : 0.6;
const batchSize = Number(process.env.IMPORT_BATCH_SIZE || 50);

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

function buildEvidenceMemo(question) {
  return JSON.stringify({
    short_explanation: question.short_explanation,
    detailed_explanation: question.detailed_explanation,
    distractor_rationales: question.distractor_rationales ?? [],
    common_misconception: question.common_misconception ?? "",
    subdomain: question.subdomain ?? "",
    cognitive_type: question.cognitive_type ?? "用語・定義",
    learning_objective: question.learning_objective ?? "",
    basic_terms: question.basic_terms ?? "",
    tags: question.tags ?? [],
    difficulty_continuous: question.difficulty_continuous ?? question.difficulty_initial
  });
}

function chunk(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function importBatch(batch) {
  const questionRows = batch.map((question) => ({
    id: question.id,
    title: question.title,
    question_text: question.question_text,
    domain: question.domain,
    ability_axis: question.ability_axis,
    difficulty_initial: question.difficulty_initial,
    difficulty_internal: question.difficulty_continuous ?? question.difficulty_initial,
    discrimination: 1,
    status,
    quality_score: qualityScore,
    currentness_type: question.currentness_type,
    expires_at: question.expires_at
  }));

  const { error: questionError } = await supabase.from("questions").upsert(questionRows);
  if (questionError) throw questionError;

  const choiceRows = batch.flatMap((question) =>
    question.choices.map((choice, index) => ({
      question_id: question.id,
      choice_index: index,
      choice_text: choice,
      is_correct: index === question.correct_choice_index
    }))
  );
  const { error: choiceError } = await supabase.from("question_choices").upsert(choiceRows, {
    onConflict: "question_id,choice_index"
  });
  if (choiceError) throw choiceError;

  const sourceRows = batch.map((question) => ({
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
    evidence_memo: buildEvidenceMemo(question)
  }));
  const { error: sourceError } = await supabase.from("question_sources").upsert(sourceRows, {
    onConflict: "question_id"
  });
  if (sourceError) throw sourceError;
}

const batches = chunk(questions, batchSize);
for (let index = 0; index < batches.length; index += 1) {
  await importBatch(batches[index]);
  console.log(`Imported batch ${index + 1}/${batches.length} (${batches[index].length} questions)`);
}

console.log(`Imported ${questions.length} questions from ${inputPath} as ${status}.`);
