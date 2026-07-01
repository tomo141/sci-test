/**
 * Apply choice plausibility fixes to all knowledge question source files.
 * Supports V3/GapFill (id-based) and V1/V2 (question-text-based compact specs).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function loadFixes() {
  const batch1 = JSON.parse(readFileSync(join(ROOT, "scripts/choice-plausibility-fixes.json"), "utf8"));
  const batch2 = JSON.parse(readFileSync(join(ROOT, "scripts/choice-plausibility-fixes-batch2.json"), "utf8"));
  /** @type {Record<string, { question?: string, choices: string[] }>} */
  const merged = {};
  for (const [id, choices] of Object.entries(batch1)) {
    merged[id] = { choices };
  }
  for (const [id, entry] of Object.entries(batch2)) {
    merged[id] = entry;
  }
  return merged;
}

const FIXES = loadFixes();

const ID_SOURCES = [
  "src/lib/data/knowledgeQuestionsV3.ts",
  "src/lib/data/knowledgeQuestionsGapFill.ts",
];

const SPEC_SOURCES = [
  "src/lib/data/knowledgeQuestions.ts",
  "src/lib/data/knowledgeQuestionsV2.ts",
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceChoiceBlock(text, id, newChoices) {
  const idPattern = new RegExp(`id:\\s*"${escapeRegExp(id)}"`);
  const idMatch = idPattern.exec(text);
  if (!idMatch) return { text, changed: false };

  const start = idMatch.index;
  const nextId = text.indexOf("\n    id:", start + 5);
  const end = nextId === -1 ? text.length : nextId;
  let block = text.slice(start, end);

  const choicesMatch = block.match(/choices:\s*\[([\s\S]*?)\]/);
  if (!choicesMatch) return { text, changed: false };

  const oldChoices = [...choicesMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"')
  );
  if (oldChoices.length !== 4 || newChoices.length !== 4) return { text, changed: false };

  const correctMatch = block.match(/correct_choice_index:\s*(\d)/);
  const correctIdx = correctMatch ? Number(correctMatch[1]) : 0;
  if (oldChoices[correctIdx] !== newChoices[correctIdx]) {
    console.warn(`Skip ${id}: correct changed`);
    return { text, changed: false };
  }

  const newChoicesInline = `[${newChoices.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(", ")}]`;
  block = block.replace(/choices:\s*\[[\s\S]*?\]/, `choices: ${newChoicesInline}`);

  const rationalesMatch = block.match(/distractor_rationales:\s*\[([\s\S]*?)\]/);
  if (rationalesMatch) {
    const oldRationales = [...rationalesMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) =>
      m[1].replace(/\\"/g, '"')
    );
    const newRationales = oldRationales.map((r, i) => {
      if (i === correctIdx) return r;
      for (const old of oldChoices) {
        if (r.includes(`「${old}」`)) return r.replace(`「${old}」`, `「${newChoices[i]}」`);
      }
      return `不正解。「${newChoices[i]}」はこの問いで求める対象ではありません。`;
    });
    block = block.replace(
      /distractor_rationales:\s*\[[\s\S]*?\]/,
      `distractor_rationales: [${newRationales.map((r) => `"${r.replace(/"/g, '\\"')}"`).join(", ")}]`
    );
  }

  return { text: text.slice(0, start) + block + text.slice(end), changed: true };
}

function replaceSpecLine(text, question, newChoices) {
  const qPattern = new RegExp(`question:\\s*"${escapeRegExp(question)}"`);
  const qMatch = qPattern.exec(text);
  if (!qMatch) return { text, changed: false };

  const lineStart = text.lastIndexOf("\n", qMatch.index) + 1;
  const lineEnd = text.indexOf("\n", qMatch.index);
  const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);

  const choicesMatch = line.match(/choices:\s*\[([\s\S]*?)\]/);
  const correctMatch = line.match(/correct:\s*(\d)/);
  if (!choicesMatch || !correctMatch) return { text, changed: false };

  const oldChoices = [...choicesMatch[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"')
  );
  const correctIdx = Number(correctMatch[1]);
  if (oldChoices[correctIdx] !== newChoices[correctIdx]) {
    console.warn(`Skip spec "${question.slice(0, 30)}...": correct changed`);
    return { text, changed: false };
  }

  const newChoicesInline = `[${newChoices.map((c) => `"${c.replace(/"/g, '\\"')}"`).join(", ")}]`;
  const newLine = line.replace(/choices:\s*\[[^\]]*\]/, `choices: ${newChoicesInline}`);
  return {
    text: text.slice(0, lineStart) + newLine + text.slice(lineEnd === -1 ? text.length : lineEnd),
    changed: true,
  };
}

let totalApplied = 0;

for (const rel of ID_SOURCES) {
  const path = join(ROOT, rel);
  let text = readFileSync(path, "utf8");
  let fileApplied = 0;
  for (const [id, entry] of Object.entries(FIXES)) {
    const result = replaceChoiceBlock(text, id, entry.choices);
    if (result.changed) {
      text = result.text;
      fileApplied += 1;
    }
  }
  if (fileApplied > 0) {
    writeFileSync(path, text);
    console.log(`${rel}: applied ${fileApplied} fixes`);
    totalApplied += fileApplied;
  }
}

for (const rel of SPEC_SOURCES) {
  const path = join(ROOT, rel);
  let text = readFileSync(path, "utf8");
  let fileApplied = 0;
  for (const entry of Object.values(FIXES)) {
    if (!entry.question) continue;
    const result = replaceSpecLine(text, entry.question, entry.choices);
    if (result.changed) {
      text = result.text;
      fileApplied += 1;
    }
  }
  if (fileApplied > 0) {
    writeFileSync(path, text);
    console.log(`${rel}: applied ${fileApplied} fixes`);
    totalApplied += fileApplied;
  }
}

console.log(`Total applied: ${totalApplied}`);
