#!/usr/bin/env node
/**
 * Merge v5 batch JSON files → knowledgeQuestionsV5.ts + questionLevels.json entries
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BATCH_DIR = join(ROOT, "scripts/v5-generated");
const LEVELS_PATH = join(ROOT, "src/lib/data/questionLevels.json");
const OUT_TS = join(ROOT, "src/lib/data/knowledgeQuestionsV5.ts");

const DOMAIN_FILES = [
  "人文社会科学",
  "化学",
  "医歯薬学",
  "地学",
  "工学",
  "情報・計算機科学",
  "数学",
  "物理",
  "生物",
  "農学"
].map((d) => `${d}.json`);

function padId(n) {
  return String(n).padStart(12, "0");
}

function toBankQuestion(raw, seq) {
  const id = `10000000-0000-4000-8006-${padId(seq)}`;
  const level = raw.difficulty_initial;
  const subdomain = raw.subdomain || "一般";
  const tags = Array.isArray(raw.tags) ? [...raw.tags] : [raw.domain, subdomain];
  if (!tags.includes("v5")) tags.push("v5");
  if (!tags.includes("gap-fill")) tags.push("gap-fill");

  return {
    id,
    title: raw.title || `${raw.domain} 知識確認 ${subdomain}`,
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
    source_url: raw.source_url || "",
    source_note: raw.source_note || "全分野科学検定 ギャップ補充 v5",
    currentness_type: raw.currentness_type || "evergreen",
    expires_at: raw.expires_at ?? null,
    tags,
    status: "published"
  };
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
  lines.push(`    source_url: ${JSON.stringify(q.source_url)},`);
  lines.push(`    source_note: ${JSON.stringify(q.source_note)},`);
  lines.push(`    currentness_type: ${JSON.stringify(q.currentness_type)},`);
  lines.push(`    expires_at: ${q.expires_at === null ? "null" : JSON.stringify(q.expires_at)},`);
  lines.push(`    tags: ${JSON.stringify(q.tags)},`);
  lines.push(`    status: "published"`);
  lines.push("  }");
  return lines.join("\n");
}

const rawItems = [];
for (const file of DOMAIN_FILES) {
  const path = join(BATCH_DIR, file);
  const items = JSON.parse(readFileSync(path, "utf8"));
  if (items.length !== 20) {
    console.error(`${file}: expected 20 questions, got ${items.length}`);
    process.exit(1);
  }
  rawItems.push(...items);
}

if (rawItems.length !== 200) {
  console.error(`Expected 200 questions, got ${rawItems.length}`);
  process.exit(1);
}

const questions = rawItems.map((raw, i) => toBankQuestion(raw, i + 1));

const levels = JSON.parse(readFileSync(LEVELS_PATH, "utf8"));
for (const q of questions) {
  levels[q.id] = q.difficulty_initial;
}
writeFileSync(LEVELS_PATH, `${JSON.stringify(levels, null, 2)}\n`);

const tsContent = `import type { BankQuestion } from "./questions";

export const knowledgeQuestionsV5: BankQuestion[] = [
${questions.map(formatQuestion).join(",\n")}
];
`;
writeFileSync(OUT_TS, tsContent);

console.log(`Wrote ${questions.length} questions → ${OUT_TS}`);
console.log(`Added ${questions.length} level entries to questionLevels.json`);
