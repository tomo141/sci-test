#!/usr/bin/env node
/**
 * Auto-fix absolute-language giveaway patterns in batch50 assembled JSON.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BATCH_DIR = join(process.cwd(), "scripts/batch50-generated");
const ABSOLUTE_RE = /(?:のみ|すべて|必ず|常に|決して|絶対|いつも|全て|だけ$)/;

const REPLACEMENTS = [
  [/のみ/g, "を主成分とする"],
  [/すべて/g, "多くの"],
  [/全て/g, "多くの"],
  [/必ず/g, "多くの場合"],
  [/常に/g, "多くの場合"],
  [/いつも/g, "多くの場合"],
  [/決して/g, ""],
  [/絶対/g, "確実に"],
  [/だけ$/g, "に限る"]
];

function softenAbsolute(text) {
  let out = text;
  for (const [re, rep] of REPLACEMENTS) {
    out = out.replace(re, rep);
  }
  return out.trim();
}

function hasGiveaway(q) {
  const absoluteFlags = q.choices.map((c) => ABSOLUTE_RE.test(c));
  const wrongAbsolute = absoluteFlags.filter((f, i) => f && i !== q.correct_choice_index).length;
  return wrongAbsolute >= 2 && !absoluteFlags[q.correct_choice_index];
}

function patchQuestion(q) {
  const next = { ...q, choices: [...q.choices], distractor_rationales: [...q.distractor_rationales] };
  for (let i = 0; i < 4; i += 1) {
    if (i !== q.correct_choice_index && ABSOLUTE_RE.test(next.choices[i])) {
      next.choices[i] = softenAbsolute(next.choices[i]);
    }
  }
  return next;
}

let patched = 0;
for (const file of readdirSync(BATCH_DIR).filter((f) => f.endsWith(".json") && f !== "blueprint.json")) {
  const path = join(BATCH_DIR, file);
  const items = JSON.parse(readFileSync(path, "utf8"));
  const updated = items.map((q) => {
    if (!hasGiveaway(q)) return q;
    patched += 1;
    return patchQuestion(q);
  });
  writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`);
}

console.log(`Patched ${patched} questions for absolute-language giveaways`);
