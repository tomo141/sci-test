import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

function inferRelaxationStage(reason) {
  if (!reason) return "unknown";
  if (reason === "first_question_target_70pct") return "first_question";
  if (reason === "adaptive_fallback_closest_target" || reason.startsWith("adaptive_fallback:")) {
    return "stage5_fallback";
  }
  const stageMatch = reason.match(/:stage(\d+):/);
  if (stageMatch) return `stage${stageMatch[1]}`;
  if (reason.startsWith("adaptive_slot:")) return "stage0-2_legacy";
  if (reason.startsWith("adaptive_relaxed:")) return "stage3-4_legacy";
  if (reason === "adaptive") return "legacy_adaptive";
  return "other";
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const pageSize = 1000;
let from = 0;
const counts = new Map();
let total = 0;

while (true) {
  const { data, error } = await supabase
    .from("exam_answers")
    .select("selection_reason")
    .range(from, from + pageSize - 1);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  for (const row of data) {
    total += 1;
    const stage = inferRelaxationStage(row.selection_reason);
    counts.set(stage, (counts.get(stage) || 0) + 1);
  }
  if (data.length < pageSize) break;
  from += pageSize;
}

const rawCounts = new Map();
from = 0;
while (true) {
  const { data, error } = await supabase
    .from("exam_answers")
    .select("selection_reason")
    .range(from, from + pageSize - 1);
  if (error) break;
  if (!data?.length) break;
  for (const row of data) {
    const key = row.selection_reason || "(null)";
    rawCounts.set(key, (rawCounts.get(key) || 0) + 1);
  }
  if (data.length < pageSize) break;
  from += pageSize;
}

console.log(JSON.stringify({ total, inferredStages: Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1])), rawReasons: Object.fromEntries([...rawCounts.entries()].sort((a, b) => b[1] - a[1])) }, null, 2));
