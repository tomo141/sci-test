#!/usr/bin/env node
/**
 * Calibrate question levels to 50-step scale (100-900) per education-stage rubric.
 * Writes src/lib/data/questionLevels.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SNAPSHOT = join(ROOT, "supabase/seed/generated/_prod-questions-snapshot.json");
const OUT = join(ROOT, "src/lib/data/questionLevels.json");
const REPORT = join(ROOT, "supabase/seed/generated/calibration-report.json");

/** @type {Record<string, number>} */
const MANUAL_OVERRIDES = {
  // v1/v2 spot-checks from prior audit
  "10000000-0000-4000-8002-000000000001": 200, // π — not elementary Bq-level
  "10000000-0000-4000-8002-000000000011": 400, // Bq
  "10000000-0000-4000-8003-000000000008": 500, // integral — not 700
  "10000000-0000-4000-8003-000000000018": 300, // Newton person
  "10000000-0000-4000-8004-000000000002": 800, // compactness
  "10000000-0000-4000-8004-000000000027": 450, // Einstein
  "10000000-0000-4000-8004-000000000034": 550 // Young — not 900
};

const KEYWORD_RULES = [
  // 900
  { level: 900, patterns: [/素数定理/, /x\/log\s*x/, /π\(x\)/] },
  // 850
  {
    level: 850,
    patterns: [
      /測度/,
      /σ-加法/,
      /ナビエ・ストークス/,
      /リーマン/,
      /ヤン・ミルズ/,
      /素数定理/
    ]
  },
  // 800
  {
    level: 800,
    patterns: [
      /バナッハ空間/,
      /コンパクト性/,
      /有限被覆/,
      /トポス/,
      /カテゴリー論/,
      /表現論/,
      /代数幾何/,
      /リー群/
    ]
  },
  // 750
  {
    level: 750,
    patterns: [
      /グルーオン/,
      /クォーク/,
      /ボルツマン分布/,
      /ブラッグの法則/,
      /確率空間/,
      /全確率の和は1/,
      /フーリエ級数/,
      /シュレーディンガー/,
      /対易関係/,
      /ゲージ対称性/,
      /超伝導/,
      /ランダウ/
    ]
  },
  // 700
  {
    level: 700,
    patterns: [
      /カルノー/,
      /フーリエ変換/,
      /偏微分方程式/,
      /量子もつれ/,
      /密度汎関数理論/,
      /結晶格子の回折/,
      /ナビエ/,
      /ヒルベルト空間/,
      /スペクトル定理/,
      /中心極限定理/,
      /ベイズの定理/,
      /PCR/,
      /CRISPR/,
      /プラスミド/,
      /有機金属/,
      /立体選択性/,
      /FMEA/,
      /信頼性と品質/
    ]
  },
  // 650
  {
    level: 650,
    patterns: [
      /完全グラフ/,
      /K_nの辺数/,
      /ベンゼン/,
      /芳香族/,
      /ルイス酸/,
      /クロマトグラフィー/,
      /分光光度計/,
      /光電効果/,
      /ドップラー効果/,
      /虚数単位/,
      /i\^2=-1/,
      /ベクトルの大きさ.*ノルム/,
      /命題PならばQ/,
      /HR図/,
      /モース硬度/,
      /プレートテクトニクス/,
      /フィードバック制御/,
      /整流器/,
      /付加製造/
    ]
  },
  // 600
  {
    level: 600,
    patterns: [
      /群の公理/,
      /逆元の存在/,
      /位相空間/,
      /開集合/,
      /群論/,
      /線形代数/,
      /行列/,
      /内積/,
      /固有値/,
      /pHメーター/,
      /昇華/,
      /硫酸の化学式/,
      /H2SO4/,
      /リボソーム/,
      /ミトコンドリア/,
      /光合成/,
      /ウラシル/,
      /個体群/,
      /インスリン/,
      /P波/,
      /火成岩/,
      /等圧線/,
      /GPS/,
      /3Dプリンタ/
    ]
  },
  // 550
  {
    level: 550,
    patterns: [
      /アインシュタイン/,
      /相対性理論/,
      /光速不変/,
      /合成関数/,
      /一次関数/,
      /確率の値として取り得る範囲/,
      /エネルギー保存則/,
      /質量と重さ/,
      /屈折/,
      /回折/,
      /干渉/,
      /電磁誘導/,
      /変圧器/,
      /半導体/,
      /メンデル/,
      /ダーウィン/,
      /リンネ/,
      /デカルト/,
      /メタ認知/,
      /立法権/
    ]
  },
  // 500
  {
    level: 500,
    patterns: [
      /空集合/,
      /∅/,
      /積分/,
      /微分/,
      /判別式/,
      /b\^2-4ac/,
      /sin,\s*cos,\s*tan/,
      /三角関数/,
      /標本空間/,
      /運動量/,
      /磁束密度/,
      /光子/,
      /酸化還元/,
      /イオン結合/,
      /共有結合/,
      /mol（モル）/,
      /CH4/,
      /メタン/,
      /希ガス/,
      /染色体/,
      /46本/,
      /地核/,
      /外核/,
      /人口密度/,
      /鋼.*炭素/
    ]
  },
  // 450
  {
    level: 450,
    patterns: [
      /A∩B/,
      /共通部分/,
      /絶対零度.*-273/,
      /-273℃/,
      /オームの法則/,
      /V=IR/,
      /周波数/,
      /音の高さ/,
      /電気抵抗の単位/,
      /Ω（オーム）/,
      /絶対温度.*K/,
      /ケルビン/,
      /中央値/,
      /最頻値/,
      /円の面積/,
      /πr\^2/,
      /二酸化炭素/,
      /CO2/,
      /ナトリウム.*アルカリ/,
      /哺乳類/
    ]
  },
  // 400
  {
    level: 400,
    patterns: [
      /Bq/,
      /ベクレル/,
      /放射能の強さ/,
      /Sv/,
      /シーベルト/,
      /cd（カンデラ）/,
      /光度.*SI基本単位/,
      /ルーメン/,
      /光束/,
      /照度/,
      /テスラ/,
      /磁束密度.*T/,
      /パスカル/,
      /1気圧/,
      /10\^5 Pa/,
      /元素記号.*Ag/,
      /元素記号.*W/,
      /タングステン/,
      /ルイス/,
      /重曹/,
      /NaHCO3/,
      /リトマス/,
      /海水の.*塩分/,
      /3\.5%/,
      /等温線/,
      /等高線/
    ]
  },
  // 300
  {
    level: 300,
    patterns: [
      /階乗/,
      /n!/,
      /素数/,
      /斜辺/,
      /力のSI単位/,
      /ニュートン（N）/,
      /万有引力.*ニュートン/,
      /ニュートン.*知られる/,
      /ニュートン.*法則/,
      /慣性/,
      /F=ma/,
      /波長/,
      /周期/,
      /振幅/,
      /密度/,
      /濃度/,
      /pH/,
      /中和/,
      /食塩/,
      /NaCl/,
      /葉緑体/,
      /DNA/,
      /チミン/,
      /アデニン/,
      /木星/,
      /太陽系で最も大きい/,
      /窒素/,
      /大気で最も多い/,
      /月食/,
      /日食/,
      /地震波/
    ]
  },
  // 200
  {
    level: 200,
    patterns: [
      /円周率/,
      /ギリシャ文字.*π/,
      /直角三角形/,
      /約数/,
      /偶数/,
      /分数/,
      /百分率/,
      /割合/,
      /単位.*メートル/,
      /動物/,
      /植物/,
      /天気/,
      /雲/,
      /雨/,
      /四季/,
      /蒸発/,
      /凝固/,
      /融解/
    ]
  },
  // 100
  {
    level: 100,
    patterns: [
      /1\+1/,
      /かけ算/,
      /たし算/,
      /ひき算/,
      /朝.*昼.*夜/,
      /太陽が東/,
      /月が地球の衛星/
    ]
  }
];

function subdomainTier(subdomain = "") {
  const s = subdomain;
  if (/量子|素粒子|場の量子|超伝導|測度論|代数幾何|位相幾何|微分幾何|複素解析|数論|偏微分|リー群|カテゴリー|表現論|数理統計|計算理論|形式言語/.test(s))
    return 800;
  if (/群論|位相|解析|確率論|統計力学|量子力学|量子化学|固体物理|核物理|流体力学|熱力学|分子生物学|遺伝学|免疫学|構造工学|材料力学|薬物動態|病理|腫瘍|神経科学|進化生物学|系統分類/.test(s))
    return 700;
  if (/有機化学|有機反応|分析化学|物理化学|細胞生物学|生化学|電磁気|線形代数|微分積分|確率|統計|力学|波|熱|光学|化学工学|農業化学|薬理|環境|生態学|気候|海洋|天文|宇宙/.test(s))
    return 550;
  if (/数と式|図形|関数|集合|単位|元素|周期表|細胞|遺伝|地殻|大気|材料|電気|化学式|人体|歴史|法学|政治学|教育学|哲学|地理|農業|作物|食品|畜産/.test(s))
    return 350;
  if (/人物|略称|単位・記号|法則/.test(s)) return 400;
  return 450;
}

function round50(n) {
  const rounded = Math.max(100, Math.min(900, Math.round(n / 50) * 50));
  return rounded % 50 === 0 ? rounded : rounded < 150 ? 100 : 200;
}

function mergeBatchResults() {
  const batchDir = join(ROOT, "scripts/calibration-batches");
  const files = ["result-0-2.json", "result-3-5.json", "result-6-8.json"];
  /** @type {Record<string, number>} */
  const merged = {};
  for (const file of files) {
    const path = join(batchDir, file);
    try {
      const data = JSON.parse(readFileSync(path, "utf8"));
      for (const [id, level] of Object.entries(data)) {
        merged[id] = round50(Number(level));
      }
    } catch {
      // batch files optional when re-running rules-only
    }
  }
  return Object.keys(merged).length ? merged : null;
}

function calibrateQuestion(q) {
  if (MANUAL_OVERRIDES[q.id]) {
    return { level: MANUAL_OVERRIDES[q.id], method: "manual", signals: [] };
  }

  const text = [q.question_text || q.question, ...(q.choices || []), q.subdomain, q.title].filter(Boolean).join(" ");
  const signals = [subdomainTier(q.subdomain)];

  for (const rule of KEYWORD_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        signals.push(rule.level);
        break;
      }
    }
  }

  // Cognitive: mostly 用語・定義 in this bank — slight downward bias for pure vocabulary
  if (/用語・定義/.test(q.cognitive_type || q.cognitiveType || "")) {
    signals.push(Math.min(...signals) - 0); // keep
  }

  signals.sort((a, b) => a - b);
  const mid = Math.floor(signals.length / 2);
  const raw = signals.length % 2 === 1 ? signals[mid] : Math.round((signals[mid - 1] + signals[mid]) / 2);
  const level = round50(raw);

  return { level, method: "rules", signals };
}

function loadQuestions() {
  const raw = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  return raw.questions || raw;
}

function main() {
  const questions = loadQuestions();
  const batchLevels = mergeBatchResults();
  /** @type {Record<string, number>} */
  const levels = {};
  /** @type {Array<object>} */
  const details = [];

  for (const q of questions) {
    let level;
    let method;
    if (batchLevels?.[q.id]) {
      level = batchLevels[q.id];
      method = "batch-agent";
    } else {
      const result = calibrateQuestion({
        id: q.id,
        question_text: q.question_text || q.question,
        choices: q.choices,
        subdomain: q.subdomain,
        title: q.title,
        domain: q.domain,
        cognitive_type: q.cognitive_type || q.cognitiveType
      });
      level = result.level;
      method = result.method;
    }
    levels[q.id] = level;
    details.push({
      id: q.id,
      domain: q.domain,
      subdomain: q.subdomain,
      old: q.difficultyInitial ?? q.difficulty_initial,
      new: level,
      delta: level - (q.difficultyInitial ?? q.difficulty_initial ?? level),
      method,
      question: (q.question_text || q.question || "").slice(0, 80)
    });
  }

  mkdirSync(join(ROOT, "src/lib/data"), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(levels, null, 2)}\n`);
  writeFileSync(
    REPORT,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: questions.length,
        details
      },
      null,
      2
    )}\n`
  );

  const bigShifts = details.filter((d) => Math.abs(d.delta) >= 200).length;
  console.log(`Calibrated ${questions.length} questions → ${OUT}`);
  console.log(`Large shifts (|delta|>=200): ${bigShifts}`);
}

main();
