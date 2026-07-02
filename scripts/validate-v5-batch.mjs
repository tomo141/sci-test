#!/usr/bin/env node
/**
 * Validate v5 batch JSON: schema, QC rules, choice plausibility patterns.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BATCH_DIR = join(ROOT, "scripts/v5-generated");
const SCHEMA = JSON.parse(readFileSync(join(ROOT, "supabase/seed/question_schema.json"), "utf8"));
const ABSOLUTE_RE = /(?:のみ|すべて|必ず|常に|決して|絶対|いつも|全て|だけ$)/;

const COGNITIVE_TYPES = new Set([
  "用語・定義",
  "原理・因果",
  "基本的な適用",
  "比較・分類",
  "誤解・境界"
]);

const DOMAIN_FILES = readdirSync(BATCH_DIR).filter((f) => f.endsWith(".json") && f !== "blueprint.json");

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  errors += 1;
}

function warn(msg) {
  console.warn(`WARN: ${msg}`);
  warnings += 1;
}

function validateQuestion(q, file, index) {
  const loc = `${file}[${index}]`;

  if (!q.domain) fail(`${loc}: domain required`);
  if (!q.subdomain) fail(`${loc}: subdomain required`);
  if (!COGNITIVE_TYPES.has(q.cognitive_type)) fail(`${loc}: invalid cognitive_type`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${loc}: choices must be length 4`);
  if (q.correct_choice_index < 0 || q.correct_choice_index > 3) fail(`${loc}: invalid correct_choice_index`);
  if (!q.question_text || q.question_text.length < 10 || q.question_text.length > 500) {
    fail(`${loc}: question_text length out of range`);
  }
  if (!q.short_explanation) fail(`${loc}: short_explanation required`);
  if (!q.detailed_explanation) fail(`${loc}: detailed_explanation required`);
  if (!String(q.basic_terms ?? "").trim()) fail(`${loc}: basic_terms required`);
  if (!Array.isArray(q.distractor_rationales) || q.distractor_rationales.length !== 4) {
    fail(`${loc}: distractor_rationales must be length 4`);
  }
  if (!q.source_note) fail(`${loc}: source_note required`);
  if (!q.difficulty_initial || q.difficulty_initial % 50 !== 0) fail(`${loc}: invalid difficulty_initial`);
  if ([150, 850].includes(q.difficulty_initial)) fail(`${loc}: level 150/850 not allowed`);

  const uniqueChoices = new Set(q.choices);
  if (uniqueChoices.size !== 4) fail(`${loc}: duplicate choices`);

  const absoluteFlags = q.choices.map((c) => ABSOLUTE_RE.test(c));
  const wrongAbsolute = absoluteFlags.filter((f, i) => f && i !== q.correct_choice_index).length;
  if (wrongAbsolute >= 2 && !absoluteFlags[q.correct_choice_index]) {
    fail(`${loc}: giveaway absolute-language pattern in distractors`);
  }

  if (/ないもの|誤っている|正しくない|除く/.test(q.question_text)) {
    warn(`${loc}: negative wording in stem`);
  }

  const correctRationale = q.distractor_rationales[q.correct_choice_index];
  if (!correctRationale?.includes("正解")) {
    warn(`${loc}: correct distractor_rationale should mention 正解`);
  }
}

let total = 0;
for (const file of DOMAIN_FILES) {
  const items = JSON.parse(readFileSync(join(BATCH_DIR, file), "utf8"));
  if (items.length !== 20) fail(`${file}: expected 20 questions, got ${items.length}`);
  items.forEach((q, i) => validateQuestion(q, file, i));
  total += items.length;
}

if (total !== 200) fail(`Expected 200 total questions, got ${total}`);

console.log(`Validated ${total} questions from ${DOMAIN_FILES.length} files`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);

if (errors > 0) process.exit(1);
