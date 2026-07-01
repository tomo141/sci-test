#!/usr/bin/env node
/**
 * Report question count by domain × level from questions-knowledge.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const BANK = join(ROOT, "supabase/seed/generated/questions-knowledge.json");
const VALID_LEVELS = [];
for (let l = 100; l <= 900; l += 50) VALID_LEVELS.push(l);

const questions = JSON.parse(readFileSync(BANK, "utf8"));
const domains = [...new Set(questions.map((q) => q.domain))].sort();

/** @type {Record<string, Record<number, number>>} */
const matrix = {};
for (const domain of domains) {
  matrix[domain] = Object.fromEntries(VALID_LEVELS.map((l) => [l, 0]));
}

for (const q of questions) {
  const level = q.difficulty_initial;
  if (!matrix[q.domain][level]) matrix[q.domain][level] = 0;
  matrix[q.domain][level] += 1;
}

const domainTotals = Object.fromEntries(domains.map((d) => [d, questions.filter((q) => q.domain === d).length]));
const levelTotals = Object.fromEntries(VALID_LEVELS.map((l) => [l, questions.filter((q) => q.difficulty_initial === l).length]));

const idealPerCell = questions.length / (domains.length * VALID_LEVELS.length);
const maxCell = Math.max(...domains.flatMap((d) => VALID_LEVELS.map((l) => matrix[d][l] || 0)));
const emptyCells = domains.reduce((n, d) => n + VALID_LEVELS.filter((l) => !matrix[d][l]).length, 0);

const report = {
  generatedAt: new Date().toISOString(),
  totalQuestions: questions.length,
  domains: domains.length,
  levels: VALID_LEVELS.length,
  domainTotals,
  levelTotals,
  matrix,
  bias: {
    idealPerDomainLevel: Number(idealPerCell.toFixed(2)),
    maxCountInOneCell: maxCell,
    emptyDomainLevelCells: emptyCells,
    levelGini: gini(Object.values(levelTotals)),
    domainLevelStdDev: stdDev(domains.flatMap((d) => VALID_LEVELS.map((l) => matrix[d][l] || 0)))
  }
};

writeFileSync(join(ROOT, "supabase/seed/generated/level-distribution-report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log("# 分野×レベル 問題数\n");
console.log("| 分野 | " + VALID_LEVELS.join(" | ") + " | 計 |");
console.log("|------|" + VALID_LEVELS.map(() => "---:").join("|") + "|---:|");
for (const domain of domains) {
  const row = VALID_LEVELS.map((l) => matrix[domain][l] || 0);
  const sum = row.reduce((a, b) => a + b, 0);
  console.log(`| ${domain} | ${row.join(" | ")} | ${sum} |`);
}
console.log(`| **計** | ${VALID_LEVELS.map((l) => levelTotals[l] || 0).join(" | ")} | ${questions.length} |`);
console.log("\n## 偏り評価");
console.log(`- 理想の均等配分（分野×レベルあたり）: 約 ${idealPerCell.toFixed(1)} 問`);
console.log(`- 最大セル件数: ${maxCell} 問`);
console.log(`- 空セル（0問の分野×レベル）: ${emptyCells} / ${domains.length * VALID_LEVELS.length}`);
console.log(`- レベル分布のジニ係数: ${report.bias.levelGini.toFixed(3)}（0=均等、1=集中）`);
console.log(`- 分野×レベル件数の標準偏差: ${report.bias.domainLevelStdDev.toFixed(2)}`);

function gini(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let num = 0;
  for (let i = 0; i < n; i += 1) num += (2 * (i + 1) - n - 1) * sorted[i];
  return num / (n * sum);
}

function stdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}
