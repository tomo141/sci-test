#!/usr/bin/env node
/**
 * Merge gap-fill batches → knowledgeQuestionsGapFill.ts + questionLevels.json entries
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BATCHES = ["a", "b", "c", "d", "e"];
const LEVELS_PATH = join(ROOT, "src/lib/data/questionLevels.json");
const OUT_TS = join(ROOT, "src/lib/data/knowledgeQuestionsGapFill.ts");
const FEEDBACK_PATH = join(ROOT, "scripts/gap-fill-calibration-feedback.json");

function padId(n) {
  return String(n).padStart(12, "0");
}

function toBankQuestion(raw, seq) {
  const id = `10000000-0000-4000-8005-${padId(seq)}`;
  const level = raw.difficulty_initial ?? raw.target_level;
  const subdomain = raw.subdomain || "一般";
  const tags = Array.isArray(raw.tags) ? raw.tags : [raw.domain, subdomain, "gap-fill"];
  if (!tags.includes("gap-fill")) tags.push("gap-fill");
  if (!tags.includes("v4")) tags.push("v4");

  return {
    id,
    title: `${raw.domain} 知識確認 ${subdomain}`,
    question_text: raw.question_text,
    choices: raw.choices,
    correct_choice_index: raw.correct_choice_index,
    short_explanation: raw.short_explanation,
    detailed_explanation: raw.detailed_explanation,
    domain: raw.domain,
    subdomain,
    ability_axis: "基礎力",
    cognitive_type: raw.cognitive_type || "用語・定義",
    learning_objective: raw.learning_objective || `${subdomain}の基礎知識を選択肢から正確に選べる`,
    difficulty_initial: level,
    difficulty_continuous: level,
    distractor_rationales: raw.distractor_rationales,
    common_misconception: raw.common_misconception || "似た用語を混同する",
    basic_terms: raw.basic_terms || "",
    source_url: "",
    source_note: "全分野科学検定 ギャップ補充 v4",
    currentness_type: "evergreen",
    expires_at: null,
    tags,
    status: "published",
    _meta: {
      target_level: raw.target_level,
      calibration_note: raw.calibration_note || null
    }
  };
}

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

function formatQuestion(q) {
  const lines = [];
  lines.push("  {");
  lines.push(`    id: ${JSON.stringify(q.id)},`);
  lines.push(`    title: ${JSON.stringify(q.title)},`);
  lines.push(`    question_text: ${JSON.stringify(q.question_text)},`);
  lines.push(`    choices: ${JSON.stringify(q.choices)},`);
  lines.push(`    correct_choice_index: ${q.correct_choice_index},`);
  lines.push(`    short_explanation: ${JSON.stringify(q.short_explanation)},`);
  lines.push(`    detailed_explanation: ${JSON.stringify(q.detailed_explanation)},`);
  lines.push(`    domain: ${JSON.stringify(q.domain)},`);
  lines.push(`    subdomain: ${JSON.stringify(q.subdomain)},`);
  lines.push(`    ability_axis: "基礎力",`);
  lines.push(`    cognitive_type: ${JSON.stringify(q.cognitive_type)},`);
  lines.push(`    learning_objective: ${JSON.stringify(q.learning_objective)},`);
  lines.push(`    difficulty_initial: ${q.difficulty_initial},`);
  lines.push(`    difficulty_continuous: ${q.difficulty_continuous},`);
  lines.push(`    distractor_rationales: ${JSON.stringify(q.distractor_rationales)},`);
  lines.push(`    common_misconception: ${JSON.stringify(q.common_misconception)},`);
  lines.push(`    basic_terms: ${JSON.stringify(q.basic_terms)},`);
  lines.push(`    source_url: "",`);
  lines.push(`    source_note: "全分野科学検定 ギャップ補充 v4",`);
  lines.push(`    currentness_type: "evergreen",`);
  lines.push(`    expires_at: null,`);
  lines.push(`    tags: ${JSON.stringify(q.tags)},`);
  lines.push(`    status: "published"`);
  lines.push("  }");
  return lines.join("\n");
}

const rawItems = [];
for (const batch of BATCHES) {
  const path = join(ROOT, `scripts/gap-fill-generated/batch-${batch}.json`);
  rawItems.push(...JSON.parse(readFileSync(path, "utf8")));
}

if (rawItems.length !== 190) {
  console.error(`Expected 190 questions, got ${rawItems.length}`);
  process.exit(1);
}

const questions = rawItems.map((raw, i) => toBankQuestion(raw, i + 1));

const feedback = questions
  .filter((q) => q._meta.target_level !== q.difficulty_initial)
  .map((q) => ({
    id: q.id,
    domain: q.domain,
    target_level: q._meta.target_level,
    calibrated_level: q.difficulty_initial,
    note: q._meta.calibration_note || "content-based adjustment"
  }));

for (const q of questions) delete q._meta;

const levels = JSON.parse(readFileSync(LEVELS_PATH, "utf8"));
for (const q of questions) {
  levels[q.id] = q.difficulty_initial;
}
writeFileSync(LEVELS_PATH, `${JSON.stringify(levels, null, 2)}\n`);

const tsContent = `import type { BankQuestion } from "./questions";

export const knowledgeQuestionsGapFill: BankQuestion[] = [
${questions.map(formatQuestion).join(",\n")}
];
`;
writeFileSync(OUT_TS, tsContent);
writeFileSync(FEEDBACK_PATH, `${JSON.stringify({ generatedAt: new Date().toISOString(), adjustments: feedback }, null, 2)}\n`);

console.log(`Wrote ${questions.length} questions → ${OUT_TS}`);
console.log(`Added ${questions.length} level entries to questionLevels.json`);
console.log(`Calibration adjustments: ${feedback.length}`);
