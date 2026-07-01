/**
 * Audit 4-choice questions for "giveaway" distractors:
 * - Absolute language (のみ/すべて/必ず/常に/決して/絶対/いつも/全て)
 * - Single-choice absolute pattern (only one choice lacks absolutes)
 * - Cross-domain term salad (choices span unrelated domains)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ABSOLUTE_RE = /(?:のみ|すべて|必ず|常に|決して|絶対|いつも|全て|だけ$)/;
const DOMAIN_KEYWORDS = {
  数学: /数|関数|行列|確率|微分|積分|群|位相|ベクトル|定理|方程式|幾何|代数/,
  物理: /波|力|エネルギ|電|磁|光|粒子|量子|熱|圧|速度|加速度|ニュートン|マクスウェル/,
  化学: /反応|分子|原子|イオン|酸|塩基|結合|触媒|平衡|酸化|還元|有機|無機|元素/,
  生物: /細胞|遺伝|DNA|タンパク|酵素|光合成|呼吸|神経|ホルモン|膜|染色体|遺伝子/,
  地学: /地層|岩石|プレート|地震|火山|化石|鉱物|気候|大気|海洋/,
  工学: /応力|構造|材料|制御|設計|加工|熱伝|流体|機械|電子|半導体/,
  情報: /アルゴリズム|プログラム|データ|ネット|暗号|CPU|メモリ|ソフト|ハード|DB|SQL/,
  医学: /病|薬|感染|免疫|診断|治療|症状|細菌|ウイルス|血液/,
  農学: /土|作物|肥料|栽培|収穫|灌漑|pest|害虫|品種/,
  心理学: /記憶|認知|学習|知覚|感情|行動|発達|心理/,
  社会科学: /社会|経済|政治|法律|契約|民主|公共|文化/,
};

function loadQuestions() {
  const path = join(process.cwd(), "supabase/seed/generated/questions-knowledge.json");
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function detectDomain(text) {
  const hits = [];
  for (const [domain, re] of Object.entries(DOMAIN_KEYWORDS)) {
    if (re.test(text)) hits.push(domain);
  }
  return hits;
}

function auditQuestion(q) {
  const issues = [];
  const choices = q.choices ?? [];
  const correctIdx = q.correct_choice_index;

  const absoluteFlags = choices.map((c) => ABSOLUTE_RE.test(c));
  const absoluteWrongCount = absoluteFlags.filter((f, i) => f && i !== correctIdx).length;
  const absoluteCorrect = absoluteFlags[correctIdx];

  if (absoluteWrongCount > 0) {
    const wrongWithAbsolute = choices
      .map((c, i) => (i !== correctIdx && absoluteFlags[i] ? { index: i, text: c } : null))
      .filter(Boolean);
    issues.push({
      type: "absolute_language_in_distractor",
      severity: absoluteWrongCount >= 2 ? "high" : "medium",
      detail: wrongWithAbsolute,
    });
  }

  if (absoluteWrongCount >= 2 && !absoluteCorrect) {
    issues.push({
      type: "only_correct_lacks_absolute",
      severity: "high",
      detail: "複数の不正解に絶対語があり、正解だけが相対的 → 消去法で正解可能",
    });
  }

  const choiceDomains = choices.map((c) => detectDomain(c));
  const allDomains = new Set(choiceDomains.flat());
  if (allDomains.size >= 3) {
    const perChoiceUnique = choices.map((c, i) => {
      const d = detectDomain(c);
      const others = choices.filter((_, j) => j !== i).flatMap((oc) => detectDomain(oc));
      const unique = d.filter((x) => !others.includes(x));
      return unique.length > 0 ? { index: i, domains: unique, text: c } : null;
    }).filter(Boolean);
    if (perChoiceUnique.length >= 2) {
      issues.push({
        type: "cross_domain_salad",
        severity: "medium",
        detail: perChoiceUnique,
      });
    }
  }

  const lengths = choices.map((c) => c.length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const outliers = choices
    .map((c, i) => ({ index: i, text: c, len: c.length }))
    .filter(({ len, index }) => len < avgLen * 0.4 && index !== correctIdx);
  if (outliers.length >= 2 && choices.some((c, i) => i !== correctIdx && /のみ$/.test(c))) {
    issues.push({
      type: "short_absolute_distractors",
      severity: "high",
      detail: outliers,
    });
  }

  return issues;
}

function main() {
  const questions = loadQuestions();
  if (!questions) {
    console.error("Run pnpm questions:build-knowledge first");
    process.exit(1);
  }

  const findings = [];
  for (const q of questions) {
    const issues = auditQuestion(q);
    if (issues.length) {
      findings.push({
        id: q.id,
        title: q.title,
        question_text: q.question_text,
        choices: q.choices,
        correct_choice_index: q.correct_choice_index,
        issues,
      });
    }
  }

  const outPath = join(process.cwd(), "supabase/seed/generated/choice-plausibility-audit.json");
  writeFileSync(outPath, `${JSON.stringify({ scanned: questions.length, flagged: findings.length, findings }, null, 2)}\n`);

  const high = findings.filter((f) => f.issues.some((i) => i.severity === "high"));
  console.log(`Scanned ${questions.length} questions, flagged ${findings.length} (${high.length} high severity)`);
  console.log(`Report: ${outPath}`);

  if (process.argv.includes("--strict") && high.length > 0) {
    process.exit(1);
  }
}

main();
