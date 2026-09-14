#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const batchDir = args.find((arg) => !arg.startsWith("--")) ?? "scripts/batches";
const basePath = args.find((arg) => arg.startsWith("--base="))?.split("=")[1] ?? "supabase/seed/generated/questions-knowledge.json";
const outPath = args.find((arg) => arg.startsWith("--out="))?.split("=")[1] ?? basePath;

function visit(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return visit(path);
    return name.endsWith(".json") ? [path] : [];
  });
}

const base = JSON.parse(readFileSync(join(ROOT, basePath), "utf8"));
const byId = new Map(base.map((q) => [q.id, q]));
const files = visit(join(ROOT, batchDir));
let added = 0;
let replaced = 0;

for (const file of files) {
  const items = JSON.parse(readFileSync(file, "utf8"));
  for (const item of items) {
    if (byId.has(item.id)) replaced += 1;
    else added += 1;
    byId.set(item.id, item);
  }
}

const merged = [...byId.values()];
writeFileSync(join(ROOT, outPath), `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Merged ${files.length} batch files into ${outPath}: +${added}, replaced ${replaced}, total ${merged.length}`);
