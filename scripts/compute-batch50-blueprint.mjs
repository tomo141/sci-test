#!/usr/bin/env node
/**
 * Blueprint: 10 domains × 50 questions, ~equal per level (100–900, skip 150/850).
 * 50 ÷ 9 levels → 6 each for 100–500, 5 each for 600–900.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "scripts/batch50-generated");
mkdirSync(OUT_DIR, { recursive: true });

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

const LEVEL_COUNTS = {
  100: 6,
  200: 6,
  300: 6,
  400: 6,
  500: 6,
  600: 5,
  700: 5,
  800: 5,
  900: 5
};

const COGNITIVE_TYPES = [
  "用語・定義",
  "原理・因果",
  "基本的な適用",
  "比較・分類",
  "誤解・境界"
];

/** Subdomain pools per domain (from existing bank taxonomy). */
const SUBDOMAINS = {
  数学: ["代数", "幾何", "関数", "確率", "統計", "線形代数", "微分積分", "論理", "数論", "位相"],
  物理: ["力学", "熱", "波", "電磁気", "量子", "熱力学", "統計力学", "固体物理", "素粒子", "相対性理論"],
  化学: ["元素", "結合", "酸塩基", "有機化学", "無機化学", "物理化学", "分析化学", "触媒化学", "酸化還元", "状態変化"],
  生物: ["細胞", "遺伝", "生態", "進化", "分子生物学", "生化学", "免疫学", "神経科学", "細胞生物学", "遺伝学"],
  地学: ["地質", "気象", "海洋", "天文", "地震", "地球化学", "地球物理学", "古気候", "鉱物", "プレート"],
  工学: ["機械", "電気", "材料", "制御", "土木", "熱工学", "流体力学", "構造工学", "材料力学", "情報通信"],
  農学: ["作物", "土壌", "育種", "病害虫", "畜産", "栽培", "食品", "林学", "水産", "植物栄養"],
  "情報・計算機科学": [
    "アルゴリズム",
    "データ構造",
    "プログラミング",
    "ネットワーク",
    "セキュリティ",
    "OS",
    "データベース",
    "AI",
    "計算理論",
    "暗号"
  ],
  医歯薬学: ["解剖", "生理", "薬理", "病理", "免疫", "生化学", "微生物", "歯学", "薬学", "分子腫瘍学"],
  人文社会科学: [
    "経済学",
    "心理学",
    "社会学",
    "哲学",
    "法学",
    "政治学",
    "歴史",
    "地理",
    "統計学",
    "科学哲学"
  ]
};

function buildDomainBlueprint(domain) {
  const subs = SUBDOMAINS[domain];
  const slots = [];
  let subIdx = 0;
  let cogIdx = 0;
  for (const [level, count] of Object.entries(LEVEL_COUNTS)) {
    for (let i = 0; i < count; i += 1) {
      slots.push({
        level: Number(level),
        subdomain: subs[subIdx % subs.length],
        cognitive_type: COGNITIVE_TYPES[cogIdx % COGNITIVE_TYPES.length],
        slot: slots.length + 1
      });
      subIdx += 1;
      cogIdx += 1;
    }
  }
  return slots;
}

const blueprint = {};
for (const domain of DOMAINS) {
  blueprint[domain] = buildDomainBlueprint(domain);
}

const levelDistribution = {};
for (const level of Object.keys(LEVEL_COUNTS)) {
  levelDistribution[level] = DOMAINS.length * LEVEL_COUNTS[level];
}

const summary = {
  generatedAt: new Date().toISOString(),
  summary: "全10分野×50問=500問。レベル100–900を均等配分（各レベル50問、100–500は6問/分野、600–900は5問/分野）。",
  questionsPerDomain: 50,
  totalQuestions: 500,
  levelDistribution,
  blueprint
};

writeFileSync(join(OUT_DIR, "blueprint.json"), `${JSON.stringify(summary, null, 2)}\n`);

console.log(summary.summary);
console.log("Level distribution (total across 10 domains):", levelDistribution);
for (const domain of DOMAINS) {
  const levels = blueprint[domain].map((s) => s.level);
  const counts = {};
  for (const l of levels) counts[l] = (counts[l] || 0) + 1;
  console.log(`${domain}: ${levels.length} slots`, counts);
}
