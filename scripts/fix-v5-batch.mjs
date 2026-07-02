#!/usr/bin/env node
/**
 * Fix v5 batch: normalize cognitive_type and patch giveaway distractors.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BATCH_DIR = join(process.cwd(), "scripts/v5-generated");

const COGNITIVE_MAP = {
  "知識・記憶": "用語・定義",
  記憶: "用語・定義",
  "事実・概念": "用語・定義",
  概念理解: "用語・定義",
  理解: "用語・定義",
  "理解・説明": "用語・定義",
  "数値・基準値": "用語・定義",
  "定理・法則": "原理・因果",
  "法則・原理": "原理・因果",
  "メカニズム・プロセス": "原理・因果",
  "機序・プロセス": "原理・因果",
  "手順・プロセス": "原理・因果",
  "応用・推論": "基本的な適用",
  "応用・計算": "基本的な適用",
  計算: "基本的な適用",
  "計算・導出": "基本的な適用",
  "計算・推論": "基本的な適用",
  "計算・数値": "基本的な適用",
  分析: "基本的な適用",
  臨床応用: "基本的な適用",
  "比較・対比": "比較・分類",
  "比較・鑑別": "比較・分類"
};

const CHOICE_PATCHES = {
  "工学.json": {
    10: {
      choices: [
        "エネルギーは形態を変えながら保存される",
        "エントロピーは孤立系で減少しうる",
        "仕事と熱はエネルギー変換の形態として等価である",
        "永久機関の第一種は理論上可能である"
      ],
      distractor_rationales: [
        "正解。熱力学第一法則はエネルギー保存を述べ、熱と仕事はエネルギーの変換形態です。",
        "不正解。エントロピー減少は第二法則の話であり、第一法則の内容ではありません。",
        "不正解。仕事と熱の等価性は第一法則の一部ですが、問いの核心はエネルギー保存そのものです。",
        "不正解。永久機関第一種はエネルギー保存に反するため不可能です。"
      ]
    }
  },
  "生物.json": {
    18: {
      choices: [
        "抗A抗体と抗B抗体の両方を持つ",
        "抗A抗体と抗B抗体の両方を持たない",
        "抗A抗体を持ち抗B抗体を持たない",
        "抗B抗体を持ち抗A抗体を持たない"
      ],
      distractor_rationales: [
        "正解。O型はA抗原・B抗原を持たないため、両方の抗体を血清中に持ちます。",
        "不正解。O型は抗原を持たない一方で、抗A・抗B抗体を持ちます。",
        "不正解。抗A抗体のみを持つのはB型の血清です。",
        "不正解。抗B抗体のみを持つのはA型の血清です。"
      ]
    }
  },
  "農学.json": {
    10: {
      choices: [
        "窒素固定は低酸素環境で活性が高い",
        "根粒菌が固定した窒素は根粒内に蓄積し植物体へ移行しない",
        "根粒菌は豆科植物の根に寄生して栄養を奪う",
        "窒素固定は光合成と同時に葉緑体で行われる"
      ],
      distractor_rationales: [
        "正解。根粒内の低酸素環境はニトロゲナーゼの活性を保つのに重要です。",
        "不正解。固定窒素は根粒から植物体へ移行し利用されます。",
        "不正解。根粒菌と豆科は共生関係であり寄生ではありません。",
        "不正解。窒素固定は根粒内の細菌で行われ、光合成とは別の過程です。"
      ]
    }
  }
};

const RATIONALE_PATCHES = {
  "工学.json": {
    1: { index: 0, text: "正解。オームの法則 I=V/R より I=5/10=0.5 A です。" },
    2: { index: 0, text: "正解。ヤング率は応力とひずみの比（縦弾性係数）を表します。" },
    6: { index: 1, text: "正解。変圧器の電圧比は巻数比に等しく、V2=V1×N2/N1=100×1/10=10 V です。" },
    7: { index: 0, text: "正解。転位の移動により塑性変形が起こり、加工硬化の原因となります。" },
    8: { index: 0, text: "正解。単純支持梁の中央での最大曲げモーメントは M=PL/4 です。" },
    11: { index: 0, text: "正解。RC回路の時定数は τ=RC=1000×0.001=1 s です。" },
    15: { index: 0, text: "正解。減速比10のギアではトルクが10倍に増幅されます。" },
    16: { index: 0, text: "正解。P=V²/R より P=100²/50=200 W です。" }
  }
};

const DOMAIN_FILES = [
  "人文社会科学.json",
  "化学.json",
  "医歯薬学.json",
  "地学.json",
  "工学.json",
  "情報・計算機科学.json",
  "数学.json",
  "物理.json",
  "生物.json",
  "農学.json"
];

let fixedTypes = 0;
let fixedChoices = 0;

for (const file of DOMAIN_FILES) {
  const path = join(BATCH_DIR, file);
  const items = JSON.parse(readFileSync(path, "utf8"));

  for (let i = 0; i < items.length; i += 1) {
    const q = items[i];
    if (COGNITIVE_MAP[q.cognitive_type]) {
      q.cognitive_type = COGNITIVE_MAP[q.cognitive_type];
      fixedTypes += 1;
    }
    const patch = CHOICE_PATCHES[file]?.[i];
    if (patch) {
      q.choices = patch.choices;
      q.distractor_rationales = patch.distractor_rationales;
      fixedChoices += 1;
    }
    const ratPatch = RATIONALE_PATCHES[file]?.[i];
    if (ratPatch) {
      q.distractor_rationales[ratPatch.index] = ratPatch.text;
    }
  }

  writeFileSync(path, `${JSON.stringify(items, null, 2)}\n`);
}

console.log(`Fixed cognitive_type: ${fixedTypes}, choice patches: ${fixedChoices}`);
