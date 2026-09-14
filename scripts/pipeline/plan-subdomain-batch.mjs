#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COGNITIVE_TYPES, LEVEL_BUCKETS, slugPart } from "./lib/questionHelpers.mjs";
import { loadTaxonomy } from "./lib/taxonomy.mjs";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const readArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const domain = readArg("--domain");
const subdomain = readArg("--subdomain");
const target = Number(readArg("--target") ?? 30);
const gapsPath = join(ROOT, "supabase/seed/generated/subdomain-gaps.json");

if (!domain || !subdomain) {
  console.error("Usage: pnpm questions:plan -- --domain <大分野> --subdomain <小分野> [--target 30]");
  process.exit(1);
}

if (!existsSync(gapsPath)) {
  console.error("Run pnpm questions:gaps first.");
  process.exit(1);
}

const taxonomy = loadTaxonomy(ROOT);
if (!taxonomy.subdomains[domain]?.includes(subdomain)) {
  console.error(`Unknown taxonomy pair: ${domain}/${subdomain}`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(gapsPath, "utf8"));
const row = report.rows.find((item) => item.domain === domain && item.subdomain === subdomain);
const gap = Math.max(0, target - (row?.current ?? 0));
const currentLevels = row?.levels ?? Object.fromEntries(LEVEL_BUCKETS.map((bucket) => [bucket, 0]));
const currentTypes = row?.cognitive_types ?? Object.fromEntries(COGNITIVE_TYPES.map((type) => [type, 0]));
const desiredPerBucket = Math.ceil(target / LEVEL_BUCKETS.length);

const needs = LEVEL_BUCKETS.map((bucket) => ({
  bucket,
  current: currentLevels[bucket] ?? 0,
  desired: desiredPerBucket,
  priority: Math.max(0, desiredPerBucket - (currentLevels[bucket] ?? 0))
})).sort((a, b) => b.priority - a.priority);

const plan = [];
for (let i = 0; i < gap; i += 1) {
  const bucket = needs[i % needs.length].bucket;
  const cognitive_type = [...COGNITIVE_TYPES].sort((a, b) => (currentTypes[a] ?? 0) - (currentTypes[b] ?? 0))[i % COGNITIVE_TYPES.length];
  currentTypes[cognitive_type] = (currentTypes[cognitive_type] ?? 0) + 1;
  plan.push({ no: i + 1, level_bucket: bucket, cognitive_type });
}

const lines = [
  `# ${domain}/${subdomain} 作問ブループリント`,
  "",
  `- 現在問数: ${row?.current ?? 0}`,
  `- 目標問数: ${target}`,
  `- 新規作問数: ${gap}`,
  "",
  "## 現在のレベル分布",
  "",
  "| レベル帯 | 現在 | 優先度 |",
  "|---|---:|---:|",
  ...needs.map((item) => `| ${item.bucket} | ${item.current} | ${item.priority} |`),
  "",
  "## 作問配分",
  "",
  "| No | レベル帯 | 認知タイプ | 執筆メモ |",
  "|---:|---|---|---|",
  ...plan.map((item) => `| ${item.no} | ${item.level_bucket} | ${item.cognitive_type} | ${subdomain}の小分野固有の対象・方法・誤解を扱う |`),
  "",
  "## 執筆ルール",
  "",
  "- 既存問題と同じ4択JSON形式で作る。",
  "- `difficulty_initial` と `difficulty_continuous` はレベル帯内の100, 200, ... 900の50刻みを使う。",
  "- L600以上は大分野一般ではなく、この小分野の専門的な深さを要求する。",
  "- 正解だけが長い、または不正解だけに絶対語が並ぶ選択肢を避ける。",
  "- 出典メモと `basic_terms` を必ず入れる。",
  ""
];

mkdirSync(join(ROOT, "scripts/blueprints"), { recursive: true });
const out = join(ROOT, "scripts/blueprints", `${slugPart(domain)}-${slugPart(subdomain)}.md`);
writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${out}`);
