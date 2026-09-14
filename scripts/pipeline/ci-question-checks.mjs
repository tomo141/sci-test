#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadTaxonomy } from "./lib/taxonomy.mjs";

const ROOT = process.cwd();
const strictDistribution = process.argv.includes("--strict-distribution");
const questions = JSON.parse(readFileSync(join(ROOT, "supabase/seed/generated/questions-knowledge.json"), "utf8"));
const taxonomy = loadTaxonomy(ROOT);
const validPairs = new Set(taxonomy.domains.flatMap((domain) => taxonomy.subdomains[domain].map((subdomain) => `${domain}/${subdomain}`)));
let errors = 0;

function fail(message) {
  errors += 1;
  console.error(`ERROR: ${message}`);
}

const positions = [0, 0, 0, 0];
for (const q of questions) {
  if (!validPairs.has(`${q.domain}/${q.subdomain}`)) fail(`${q.id}: invalid taxonomy pair ${q.domain}/${q.subdomain}`);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${q.id}: choices must be length 4`);
  if (!Number.isInteger(q.correct_choice_index) || q.correct_choice_index < 0 || q.correct_choice_index > 3) fail(`${q.id}: invalid correct_choice_index`);
  if (q.correct_choice_index >= 0 && q.correct_choice_index < 4) positions[q.correct_choice_index] += 1;
}

const total = questions.length;
positions.forEach((count, index) => {
  const pct = (count / total) * 100;
  if (pct < 20 || pct > 30) {
    const message = `correct_choice_index ${index} distribution ${pct.toFixed(1)}% is outside 20-30%`;
    if (strictDistribution) fail(message);
    else console.warn(`WARN: ${message}`);
  }
});

try {
  const audit = JSON.parse(readFileSync(join(ROOT, "supabase/seed/generated/choice-plausibility-audit.json"), "utf8"));
  const high = (audit.findings ?? []).filter((f) => f.issues?.some((i) => i.severity === "high")).length;
  if (high > 0) fail(`choice plausibility high severity findings: ${high}`);
} catch {
  console.warn("WARN: choice plausibility audit report not found; run pnpm questions:audit first.");
}

console.log(`Question checks scanned ${total} questions. Answer distribution: ${positions.join(", ")}`);
process.exit(errors > 0 ? 1 : 0);
