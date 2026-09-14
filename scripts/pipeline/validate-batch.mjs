#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { COGNITIVE_TYPES } from "./lib/questionHelpers.mjs";
import { loadTaxonomy } from "./lib/taxonomy.mjs";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const batchDir = args.find((arg) => !arg.startsWith("--")) ?? "scripts/batches";
const strict = args.includes("--strict");
const taxonomy = loadTaxonomy(ROOT);
const validPairs = new Set(taxonomy.domains.flatMap((domain) => taxonomy.subdomains[domain].map((subdomain) => `${domain}/${subdomain}`)));
const cognitiveTypes = new Set(COGNITIVE_TYPES);
let errors = 0;
let warnings = 0;

function visit(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return visit(path);
    return name.endsWith(".json") ? [path] : [];
  });
}

function fail(message) {
  errors += 1;
  console.error(`ERROR: ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`WARN: ${message}`);
}

const files = visit(join(ROOT, batchDir));
let total = 0;
for (const file of files) {
  const items = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(items)) fail(`${file}: root must be an array`);
  items.forEach((q, index) => {
    const loc = `${file}[${index}]`;
    total += 1;
    if (!q.id) fail(`${loc}: id required`);
    if (!validPairs.has(`${q.domain}/${q.subdomain}`)) fail(`${loc}: invalid taxonomy pair ${q.domain}/${q.subdomain}`);
    if (!cognitiveTypes.has(q.cognitive_type)) fail(`${loc}: invalid cognitive_type`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${loc}: choices must be length 4`);
    if (!Number.isInteger(q.correct_choice_index) || q.correct_choice_index < 0 || q.correct_choice_index > 3) fail(`${loc}: invalid correct_choice_index`);
    if (!q.question_text || q.question_text.length < 10) fail(`${loc}: question_text required`);
    if (!q.short_explanation || !q.detailed_explanation) fail(`${loc}: explanations required`);
    if (!q.source_note) fail(`${loc}: source_note required`);
    if (!Number.isFinite(q.difficulty_initial) || q.difficulty_initial % 50 !== 0) fail(`${loc}: invalid difficulty_initial`);
    if ((q.difficulty_continuous ?? q.difficulty_initial) !== q.difficulty_initial) fail(`${loc}: difficulty_continuous must equal difficulty_initial`);
    if (new Set(q.choices ?? []).size !== 4) fail(`${loc}: duplicate choices`);
    if (/ないもの|誤っている|正しくない|除く/.test(q.question_text)) warn(`${loc}: negative wording in stem`);
  });
}

console.log(`Validated ${total} questions in ${files.length} files from ${batchDir}`);
console.log(`Errors: ${errors}, Warnings: ${warnings}`);
process.exit(errors > 0 || (strict && warnings > 0) ? 1 : 0);
