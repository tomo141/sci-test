import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const input = "supabase/seed/generated/questions-knowledge.json";
const output = "implementation/local/question-audit";
const records = JSON.parse(await readFile(input, "utf8"));
const normalize = value => value.normalize("NFKC").toLowerCase().replace(/\s+/gu, "").replace(/[?？。、「」『』]/gu, "");
const families = new Map();
for (const q of records) {
  const key = normalize(q.question_text);
  if (!families.has(key)) families.set(key, []);
  families.get(key).push(q.id);
}
await mkdir(output, { recursive: true, mode: 0o700 });
const packs = new Map();
for (const q of records) {
  const same = families.get(normalize(q.question_text));
  const content = { question: q.question_text, choices: q.choices, correctIndex: q.correct_choice_index, explanation: q.detailed_explanation || q.short_explanation, distractorRationales: q.distractor_rationales ?? [], sources: q.source_url ? [{ title: q.source_note, url: q.source_url }] : [] };
  const key = createHash("sha256").update(normalize(q.question_text)).digest("hex");
  const row = { legacyId: q.id, familyId: `legacy-stem:${key}`, domain: q.domain, subdomain: q.subdomain, content, legacyDifficulty: q.difficulty_continuous ?? q.difficulty_initial, expiresAt: q.expires_at, originalSourceNote: q.source_note, sameStem: same.length > 1 ? same : [], review: "pending" };
  if (!packs.has(q.domain)) packs.set(q.domain, []);
  packs.get(q.domain).push(row);
}
const manifest = { input, inputSha256: createHash("sha256").update(await readFile(input)).digest("hex"), preparedAt: new Date().toISOString(), count: records.length, distinctStems: families.size, sourceUrlCount: records.filter(q => q.source_url?.trim()).length, domains: [] };
for (const [domain, rows] of packs) {
  rows.sort((a, b) => a.subdomain.localeCompare(b.subdomain, "ja") || a.legacyDifficulty - b.legacyDifficulty || a.legacyId.localeCompare(b.legacyId));
  await writeFile(`${output}/${domain}.json`, JSON.stringify(rows, null, 2) + "\n", { mode: 0o600 });
  const text = rows.map((r, i) => `## ${i + 1}. ${r.legacyId} | ${r.subdomain} | prior ${r.legacyDifficulty}\n${r.content.question}\n${r.content.choices.map((c, j) => `${j === r.content.correctIndex ? "*" : "-"} ${j + 1}. ${c}`).join("\n")}\nExplanation: ${r.content.explanation}\nChoice rationale: ${r.content.distractorRationales.join(" / ")}\n${r.sameStem.length ? `Same stem: ${r.sameStem.join(", ")}\n` : ""}`);
  await writeFile(`${output}/${domain}.md`, text.join("\n"), { mode: 0o600 });
  manifest.domains.push({ domain, count: rows.length, distinctStems: new Set(rows.map(r => r.familyId)).size });
}
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600 });
console.log(JSON.stringify(manifest, null, 2));
