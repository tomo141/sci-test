import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const domainsDir = join(root, "supabase/seed/basic-v1/domains");

const DOMAINS = new Set([
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
]);

const COGNITIVE_TYPES = new Set([
  "用語・定義",
  "原理・因果",
  "基本的な適用",
  "比較・分類",
  "誤解・境界"
]);

const META_TAGS = new Set(["基礎力", "v1", "誤解"]);

function isTermLike(text) {
  if (!text || text.length > 14) return false;
  if (/[、。をするとがよりからまで表す選ぶ]/.test(text)) return false;
  return true;
}

function splitSentences(text) {
  return text
    .split(/(?<=[。．])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function filterTags(tags, question) {
  return (tags || []).filter(
    (tag) =>
      !DOMAINS.has(tag) &&
      !COGNITIVE_TYPES.has(tag) &&
      !META_TAGS.has(tag) &&
      tag !== question.domain &&
      tag !== question.subdomain &&
      tag.length <= 20
  );
}

function cleanRationale(rationale) {
  return rationale
    .replace(/^正解[（(][^）)]*[）)][。.、]?\s*/, "")
    .replace(/^正解[。.、]?\s*/, "")
    .trim();
}

function stripLeadingTerm(sentence, term) {
  if (!sentence.startsWith(term)) return sentence;
  const rest = sentence.slice(term.length).replace(/^[はがをに、・\s]+/, "");
  return rest || sentence;
}

function collectTerms(question) {
  const terms = [];
  const seen = new Set();

  const addTerm = (term) => {
    if (!term || seen.has(term) || term.length > 24) return;
    seen.add(term);
    terms.push(term);
  };

  const correctChoice = question.choices[question.correct_choice_index];
  if (isTermLike(correctChoice)) {
    addTerm(correctChoice);
  }

  for (const tag of filterTags(question.tags, question)) {
    addTerm(tag);
  }

  for (let index = 0; index < question.choices.length; index += 1) {
    if (index === question.correct_choice_index) continue;
    const choice = question.choices[index];
    if (isTermLike(choice)) addTerm(choice);
    if (terms.length >= 4) break;
  }

  if (terms.length === 0 && question.title) {
    addTerm(question.title.replace(/の定義$|の意味$|について$/, ""));
  }

  return terms.slice(0, 4);
}

export function generateBasicTerms(question) {
  const sentences = splitSentences(question.detailed_explanation);
  const terms = collectTerms(question);
  const lines = [];
  let fallbackIndex = 0;

  for (const term of terms) {
    const choiceIndex = question.choices.indexOf(term);
    let sentence = sentences.find((item) => item.includes(term));

    if (!sentence && choiceIndex >= 0) {
      const rationale = cleanRationale(question.distractor_rationales[choiceIndex] || "");
      if (rationale) {
        lines.push(`・${term}：${rationale.endsWith("。") ? rationale : `${rationale}。`}`);
        continue;
      }
    }

    if (!sentence && sentences[fallbackIndex]) {
      sentence = sentences[fallbackIndex];
      fallbackIndex += 1;
    }

    if (!sentence) continue;

    const body = stripLeadingTerm(sentence, term);
    lines.push(`・${term}：${body}`);
  }

  if (lines.length === 0) {
    return sentences.slice(0, Math.min(2, sentences.length)).join("");
  }

  return lines.join("\n");
}

function enrichQuestion(question) {
  return {
    ...question,
    basic_terms: generateBasicTerms(question)
  };
}

const files = readdirSync(domainsDir).filter((file) => file.endsWith(".json"));
let total = 0;

function enrichAllDomainFiles() {
  for (const file of files) {
    const path = join(domainsDir, file);
    const questions = JSON.parse(readFileSync(path, "utf8"));
    const enriched = questions.map(enrichQuestion);
    writeFileSync(path, `${JSON.stringify(enriched, null, 2)}\n`);
    total += enriched.length;
    console.log(`${file}: enriched ${enriched.length} questions`);
  }
  console.log(`Done. ${total} questions now include basic_terms.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  enrichAllDomainFiles();
}
