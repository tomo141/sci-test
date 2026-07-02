#!/usr/bin/env node
/**
 * Compute v5 blueprint: 20 questions per domain targeting underrepresented domain×level cells.
 * Skips levels 150 and 850 (not used in production).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORT = join(ROOT, "supabase/seed/generated/level-distribution-report.json");
const OUT = join(ROOT, "scripts/v5-generated/blueprint.json");

const SKIP_LEVELS = new Set([150, 850]);
const VALID_LEVELS = [];
for (let l = 100; l <= 900; l += 50) VALID_LEVELS.push(l);

const report = JSON.parse(readFileSync(REPORT, "utf8"));
const domains = Object.keys(report.matrix).sort();

const blueprint = {};
for (const domain of domains) {
  const cells = VALID_LEVELS.filter((l) => !SKIP_LEVELS.has(l)).map((level) => ({
    level,
    count: report.matrix[domain][level] || 0
  }));
  cells.sort((a, b) => a.count - b.count || a.level - b.level);

  const picks = [];
  let idx = 0;
  while (picks.length < 20) {
    const cell = cells[idx % cells.length];
    picks.push({ level: cell.level, currentCount: cell.count });
    idx += 1;
  }
  blueprint[domain] = picks;
}

writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), blueprint }, null, 2)}\n`);
console.log(`Wrote blueprint for ${domains.length} domains → ${OUT}`);
for (const domain of domains) {
  const levels = blueprint[domain].map((p) => p.level);
  console.log(`${domain}: ${levels.join(", ")}`);
}
