import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const domainsDir = join(root, "supabase/seed/basic-v1/domains");
const outJson = join(root, "supabase/seed/generated/questions-basic-v1.json");
const outCsv = join(root, "supabase/seed/generated/questions-basic-v1.csv");
const legacyJson = join(root, "supabase/seed/generated/questions-400.sample.json");
const legacyCsv = join(root, "supabase/seed/generated/questions-400.sample.csv");

const DOMAINS = [
  "数学",
  "物理",
  "化学",
  "生物",
  "地学",
  "工学",
  "農学",
  "情報・計算機科学",
  "医歯薬学",
  "人文社会科学"
];

const DOMAIN_SLUGS = {
  数学: "math",
  物理: "physics",
  化学: "chemistry",
  生物: "biology",
  地学: "earth",
  工学: "engineering",
  農学: "agriculture",
  "情報・計算機科学": "informatics",
  医歯薬学: "medicine",
  人文社会科学: "humanities"
};

const COGNITIVE_TYPES = new Set([
  "用語・定義",
  "原理・因果",
  "基本的な適用",
  "比較・分類",
  "誤解・境界"
]);

const plan = JSON.parse(readFileSync(join(root, "supabase/seed/basic-v1/difficulty-plan.json"), "utf8"));

function stableUuid(globalIndex) {
  return `00000000-0000-4000-8001-${String(globalIndex + 1).padStart(12, "0")}`;
}

function validateQuestion(question, domainIndex, questionIndex) {
  const errors = [];
  const expectedId = stableUuid(domainIndex * 40 + questionIndex);
  if (question.id !== expectedId) errors.push(`id expected ${expectedId}, got ${question.id}`);
  if (question.domain !== DOMAINS[domainIndex]) errors.push(`domain mismatch`);
  if (question.ability_axis !== "基礎力") errors.push("ability_axis must be 基礎力");
  if (!question.subdomain) errors.push("subdomain required");
  if (!COGNITIVE_TYPES.has(question.cognitive_type)) errors.push(`invalid cognitive_type: ${question.cognitive_type}`);
  if (!Array.isArray(question.choices) || question.choices.length !== 4) errors.push("choices must be length 4");
  if (question.correct_choice_index < 0 || question.correct_choice_index > 3) errors.push("invalid correct_choice_index");
  if (!question.question_text || question.question_text.length < 10) errors.push("question_text too short");
  if (!question.short_explanation) errors.push("short_explanation required");
  if (!question.detailed_explanation) errors.push("detailed_explanation required");
  if (!question.basic_terms?.trim()) errors.push("basic_terms required");
  if (!Array.isArray(question.distractor_rationales) || question.distractor_rationales.length !== 4) {
    errors.push("distractor_rationales must be length 4");
  }
  if (!question.source_note) errors.push("source_note required");
  const expectedDifficulty = plan.per_domain[questionIndex];
  if (question.difficulty_initial !== expectedDifficulty) {
    errors.push(`difficulty_initial expected ${expectedDifficulty}, got ${question.difficulty_initial}`);
  }
  const expectedCognitive = plan.cognitive_types[questionIndex];
  if (question.cognitive_type !== expectedCognitive) {
    errors.push(`cognitive_type expected ${expectedCognitive}, got ${question.cognitive_type}`);
  }
  return errors;
}

function loadDomainFiles() {
  const all = [];
  for (let domainIndex = 0; domainIndex < DOMAINS.length; domainIndex += 1) {
    const domain = DOMAINS[domainIndex];
    const slug = DOMAIN_SLUGS[domain];
    const path = join(domainsDir, `${slug}.json`);
    if (!existsSync(path)) {
      throw new Error(`Missing domain file: ${path}`);
    }
    const items = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(items) || items.length !== 40) {
      throw new Error(`${path} must contain exactly 40 questions, got ${items?.length ?? 0}`);
    }
    for (let i = 0; i < items.length; i += 1) {
      const errors = validateQuestion(items[i], domainIndex, i);
      if (errors.length) {
        throw new Error(`${path}[${i}]: ${errors.join("; ")}`);
      }
    }
    all.push(...items);
  }
  return all;
}

function toAppRecord(question) {
  return {
    ...question,
    title: question.title || `${question.domain} 基礎力 ${question.subdomain}`,
    difficulty_continuous: question.difficulty_continuous ?? question.difficulty_initial,
    currentness_type: question.currentness_type ?? "evergreen",
    expires_at: question.expires_at ?? null,
    status: "published",
    tags: [
      ...(question.tags ?? []),
      question.domain,
      question.subdomain,
      question.cognitive_type,
      "基礎力",
      "v1"
    ]
  };
}

const questions = loadDomainFiles().map(toAppRecord);

await mkdir(join(root, "supabase/seed/generated"), { recursive: true });
writeFileSync(outJson, `${JSON.stringify(questions, null, 2)}\n`);
writeFileSync(legacyJson, `${JSON.stringify(questions, null, 2)}\n`);

const csvHeader = [
  "id", "title", "question_text", "choices_json", "correct_choice_index",
  "short_explanation", "detailed_explanation", "basic_terms", "domain", "subdomain", "ability_axis",
  "cognitive_type", "difficulty_initial", "source_url", "source_note",
  "currentness_type", "expires_at", "tags_json"
];
const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const csvRows = questions.map((q) =>
  [
    q.id, q.title, q.question_text, JSON.stringify(q.choices), q.correct_choice_index,
    q.short_explanation, q.detailed_explanation, q.basic_terms, q.domain, q.subdomain, q.ability_axis,
    q.cognitive_type, q.difficulty_initial, q.source_url ?? "", q.source_note,
    q.currentness_type, q.expires_at, JSON.stringify(q.tags)
  ].map(escapeCsv).join(",")
);
writeFileSync(outCsv, `${csvHeader.join(",")}\n${csvRows.join("\n")}\n`);
writeFileSync(legacyCsv, `${csvHeader.join(",")}\n${csvRows.join("\n")}\n`);

console.log(`Built ${questions.length} questions -> ${outJson}`);
console.log(`Domain files: ${readdirSync(domainsDir).filter((f) => f.endsWith(".json")).length}`);
