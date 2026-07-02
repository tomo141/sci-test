#!/usr/bin/env node
/**
 * Assemble batch50: blueprint slots filled from v5 (level-rounded), existing batch50,
 * and embedded gap questions. Writes 50 questions × 10 domains.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { balanceAll } from "./lib/batch50-helpers.mjs";
import { gapQuestions } from "./batch50-gap/index.mjs";

const ROOT = process.cwd();
const BATCH_DIR = join(ROOT, "scripts/batch50-generated");
const V5_DIR = join(ROOT, "scripts/v5-generated");
const SOURCE = "全分野科学検定 バッチ50（レベル均等）";

const DOMAINS = [
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
];

function nearest50(level) {
  if (level === 150 || level === 850) return null;
  const r = Math.round(level / 50) * 50;
  return r >= 100 && r <= 900 ? r : null;
}

function normalizeQuestion(raw, slot) {
  const level = slot.level;
  return {
    domain: raw.domain,
    subdomain: slot.subdomain || raw.subdomain,
    question_text: raw.question_text,
    choices: raw.choices,
    correct_choice_index: raw.correct_choice_index,
    short_explanation: raw.short_explanation,
    detailed_explanation: raw.detailed_explanation,
    cognitive_type: slot.cognitive_type || raw.cognitive_type,
    learning_objective: raw.learning_objective,
    common_misconception: raw.common_misconception,
    distractor_rationales: raw.distractor_rationales,
    basic_terms: typeof raw.basic_terms === "object" && raw.basic_terms !== null && !Array.isArray(raw.basic_terms)
      ? Object.entries(raw.basic_terms).map(([k, v]) => `${k}：${v}`).join("、")
      : raw.basic_terms,
    difficulty_initial: level,
    difficulty_continuous: level,
    source_note: SOURCE,
    source_url: raw.source_url || "",
    currentness_type: raw.currentness_type || "evergreen",
    expires_at: raw.expires_at ?? null,
    tags: [raw.domain, slot.subdomain || raw.subdomain, "batch50", `L${level}`]
  };
}

function fingerprint(q) {
  return q.question_text.slice(0, 80);
}

const blueprint = JSON.parse(readFileSync(join(BATCH_DIR, "blueprint.json"), "utf8"));

for (const domain of DOMAINS) {
  const slots = blueprint.blueprint[domain];
  const used = new Set();
  const pools = {};

  // Pool from v5
  const v5 = JSON.parse(readFileSync(join(V5_DIR, `${domain}.json`), "utf8"));
  for (const q of v5) {
    const lv = nearest50(q.difficulty_initial);
    if (!lv) continue;
    (pools[lv] ??= []).push(q);
  }

  // Pool from existing batch50
  try {
    const existing = JSON.parse(readFileSync(join(BATCH_DIR, `${domain}.json`), "utf8"));
    for (const q of existing) {
      (pools[q.difficulty_initial] ??= []).push(q);
    }
  } catch {
    /* first run */
  }

  // Pool from gap-fill batches
  const gapFillDir = join(ROOT, "scripts/gap-fill-generated");
  for (const file of readdirSync(gapFillDir).filter((f) => f.endsWith(".json"))) {
    const items = JSON.parse(readFileSync(join(gapFillDir, file), "utf8"));
    for (const q of items) {
      if (q.domain !== domain) continue;
      const lv = nearest50(q.difficulty_initial) ?? q.difficulty_initial;
      (pools[lv] ??= []).push(q);
    }
  }

  // Pool from gap questions
  const gaps = gapQuestions[domain] || [];
  for (const q of gaps) {
    (pools[q.difficulty_initial] ??= []).push(q);
  }

  const result = [];
  for (const slot of slots) {
    const candidates = pools[slot.level] || [];
    let picked = null;
    while (candidates.length > 0) {
      const c = candidates.shift();
      const fp = fingerprint(c);
      if (!used.has(fp)) {
        picked = c;
        used.add(fp);
        break;
      }
    }
    if (!picked) {
      console.error(`Missing question: ${domain} L${slot.level} slot ${slot.slot} (${slot.subdomain})`);
      process.exit(1);
    }
    result.push(normalizeQuestion(picked, slot));
  }

  const balanced = balanceAll(result);
  writeFileSync(join(BATCH_DIR, `${domain}.json`), `${JSON.stringify(balanced, null, 2)}\n`);
  console.log(`Wrote ${balanced.length} → ${domain}.json`);
}

console.log("Assembly complete.");
