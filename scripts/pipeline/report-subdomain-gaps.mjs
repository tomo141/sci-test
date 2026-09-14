#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { emptyCognitiveDistribution, emptyLevelDistribution, levelBucket } from "./lib/questionHelpers.mjs";
import { loadTaxonomy, taxonomyPairs } from "./lib/taxonomy.mjs";

const ROOT = process.cwd();
const TARGET = Number(process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ?? 30);
const INPUT = process.argv.find((arg) => arg.startsWith("--input="))?.split("=")[1] ?? "supabase/seed/generated/questions-knowledge.json";

function loadQuestions() {
  return JSON.parse(readFileSync(join(ROOT, INPUT), "utf8"));
}

function buildReport() {
  const taxonomy = loadTaxonomy(ROOT);
  const questions = loadQuestions();
  const rows = taxonomyPairs(taxonomy).map(({ domain, subdomain }) => ({
    domain,
    subdomain,
    current: 0,
    target: TARGET,
    gap: TARGET,
    levels: emptyLevelDistribution(),
    cognitive_types: emptyCognitiveDistribution(),
    statuses: {}
  }));
  const byKey = new Map(rows.map((row) => [`${row.domain}/${row.subdomain}`, row]));
  const unknown = [];

  for (const question of questions) {
    const key = `${question.domain}/${question.subdomain}`;
    const row = byKey.get(key);
    if (!row) {
      unknown.push({ id: question.id, domain: question.domain, subdomain: question.subdomain });
      continue;
    }
    row.current += 1;
    row.gap = Math.max(0, row.target - row.current);
    row.levels[levelBucket(question.difficulty_continuous ?? question.difficulty_initial)] += 1;
    if (question.cognitive_type) {
      row.cognitive_types[question.cognitive_type] = (row.cognitive_types[question.cognitive_type] ?? 0) + 1;
    }
    const status = question.status ?? "unknown";
    row.statuses[status] = (row.statuses[status] ?? 0) + 1;
  }

  rows.sort((a, b) => b.gap - a.gap || a.domain.localeCompare(b.domain, "ja") || a.subdomain.localeCompare(b.subdomain, "ja"));
  return {
    generated_at: new Date().toISOString(),
    input: INPUT,
    target: TARGET,
    total_questions: questions.length,
    total_subdomains: rows.length,
    subdomains_below_target: rows.filter((row) => row.gap > 0).length,
    total_gap: rows.reduce((sum, row) => sum + row.gap, 0),
    unknown_taxonomy_questions: unknown,
    rows
  };
}

function markdown(report) {
  const lines = [
    "# 小分野ギャップレポート",
    "",
    `- 生成日時: ${report.generated_at}`,
    `- 入力: \`${report.input}\``,
    `- 目標問数: ${report.target}`,
    `- 総問題数: ${report.total_questions}`,
    `- 対象小分野: ${report.total_subdomains}`,
    `- 目標未達小分野: ${report.subdomains_below_target}`,
    `- 総不足数: ${report.total_gap}`,
    "",
    "| 大分野 | 小分野 | 現在 | 目標 | 不足 | L100-300 | L400-600 | L700-900 | status |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---|"
  ];

  for (const row of report.rows) {
    lines.push(
      `| ${row.domain} | ${row.subdomain} | ${row.current} | ${row.target} | ${row.gap} | ${row.levels["L100-300"]} | ${row.levels["L400-600"]} | ${row.levels["L700-900"]} | ${Object.entries(row.statuses).map(([k, v]) => `${k}:${v}`).join(", ")} |`
    );
  }

  if (report.unknown_taxonomy_questions.length > 0) {
    lines.push("", "## Taxonomy未一致", "");
    for (const q of report.unknown_taxonomy_questions.slice(0, 50)) {
      lines.push(`- ${q.id}: ${q.domain}/${q.subdomain}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

const report = buildReport();
mkdirSync(join(ROOT, "docs"), { recursive: true });
mkdirSync(join(ROOT, "supabase/seed/generated"), { recursive: true });
writeFileSync(join(ROOT, "supabase/seed/generated/subdomain-gaps.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(join(ROOT, "docs/subdomain-gaps.md"), markdown(report));

console.table(
  report.rows.slice(0, 30).map((row) => ({
    domain: row.domain,
    subdomain: row.subdomain,
    current: row.current,
    gap: row.gap,
    "L100-300": row.levels["L100-300"],
    "L400-600": row.levels["L400-600"],
    "L700-900": row.levels["L700-900"]
  }))
);
console.log(`Wrote docs/subdomain-gaps.md and supabase/seed/generated/subdomain-gaps.json`);
