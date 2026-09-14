#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const gaps = JSON.parse(readFileSync(join(ROOT, "supabase/seed/generated/subdomain-gaps.json"), "utf8"));
let audit = null;
try {
  audit = JSON.parse(readFileSync(join(ROOT, "supabase/seed/generated/choice-plausibility-audit.json"), "utf8"));
} catch {}

const worst = gaps.rows.slice().sort((a, b) => b.gap - a.gap).slice(0, 20);
const lines = [
  "# 週次問題バンクレポート",
  "",
  `- 生成日時: ${new Date().toISOString()}`,
  `- 総不足数: ${gaps.total_gap}`,
  `- 目標未達小分野: ${gaps.subdomains_below_target}/${gaps.total_subdomains}`,
  `- 選択肢監査: ${audit ? `${audit.flagged}件 flagged` : "未実行"}`,
  "",
  "## 不足が大きい小分野",
  "",
  "| 大分野 | 小分野 | 現在 | 不足 | L100-300 | L400-600 | L700-900 |",
  "|---|---|---:|---:|---:|---:|---:|",
  ...worst.map((row) => `| ${row.domain} | ${row.subdomain} | ${row.current} | ${row.gap} | ${row.levels["L100-300"]} | ${row.levels["L400-600"]} | ${row.levels["L700-900"]} |`),
  ""
];

writeFileSync(join(ROOT, "docs/weekly-bank-report.md"), lines.join("\n"));
console.log("Wrote docs/weekly-bank-report.md");
