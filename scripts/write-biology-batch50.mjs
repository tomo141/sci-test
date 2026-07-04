#!/usr/bin/env node
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "scripts/batch50-generated/生物.json");
const blueprint = JSON.parse(
  readFileSync(join(ROOT, "scripts/batch50-generated/blueprint.json"), "utf8")
).blueprint.生物;

const SOURCE = "全分野科学検定 バッチ50（レベル均等）";

function q(fields) {
  const level = fields.difficulty_initial;
  return {
    currentness_type: "evergreen",
    expires_at: null,
    source_url: "",
    source_note: SOURCE,
    tags: ["生物", fields.subdomain, "batch50", `L${level}`],
    difficulty_continuous: level,
    ...fields
  };
}

function balance(item, targetIndex) {
  const cur = item.correct_choice_index;
  if (cur === targetIndex) return item;
  const shift = (cur - targetIndex + 4) % 4;
  const rotate = (arr) => [...arr.slice(shift), ...arr.slice(0, shift)];
  return {
    ...item,
    choices: rotate(item.choices),
    distractor_rationales: rotate(item.distractor_rationales),
    correct_choice_index: targetIndex
  };
}

// Questions keyed by slot (1-50)
const QUESTIONS = {
  1: q({
    domain: "生物", subdomain: "細胞", difficulty_initial: 100, cognitive_type: "用語・定義",
    question_text: "動物細胞にあって植物細胞には通常ない構造はどれか。",
    choices: ["細胞壁", "葉緑体", "液胞", "中心体"],
    correct_choice_index: 3,
    short_explanation: "中心体は動物細胞の分裂時に紡錘糸を形成するが、高等植物細胞には通常ない。",
    detailed_explanation: "植物細胞は細胞壁・葉緑体・大きな液胞を持つ。中心体は動物細胞や低等植物の分裂に関与するが、開花植物の体細胞には一般に中心体がない。",
    learning_objective: "動物細胞と植物細胞の主要構造の違いを説明できる",
    common_misconception: "植物細胞にも動物細胞と同じ小器官がすべて揃っていると思い込む",
    distractor_rationales: ["不正解。植物細胞に特有の構造。", "不正解。植物細胞に特有の構造。", "不正解。植物細胞に大きく発達しやすい。", "正解。動物細胞に典型的な構造。"],
    basic_terms: "中心体：中心粒を含み紡錘糸形成に関与、細胞壁：植物細胞外側の支持構造"
  }),
  2: q({
    domain: "生物", subdomain: "遺伝", difficulty_initial: 100, cognitive_type: "原理・因果",
    question_text: "子が親に似る主な理由として最も適切なものはどれか。",
    choices: ["親から受け継いだ遺伝情報に基づく", "同じ食事をするから", "同じ気候で育つから", "親の行動を真似するから"],
    correct_choice_index: 0,
    short_explanation: "遺伝子にコードされた情報が形質の基礎となる。",
    detailed_explanation: "親から子へ DNA が伝わり、その情報に基づいてタンパク質合成や発生が進むため子は親に似る。環境や学習も影響するが、遺伝が基本である。",
    learning_objective: "遺伝と形質の関係を説明できる",
    common_misconception: "似るのは環境や真似が主因だと考える",
    distractor_rationales: ["正解。遺伝情報の継承が基本。", "不正解。食事は影響しうるが主因ではない。", "不正解。環境は表現型に影響するが遺伝が基礎。", "不正解。行動の模倣は一部の動物に限られる。"],
    basic_terms: "遺伝子：形質を決める DNA 上の情報単位、DNA：遺伝情報を担う核酸"
  }),
  3: q({
    domain: "生物", subdomain: "生態", difficulty_initial: 100, cognitive_type: "基本的な適用",
    question_text: "草原の食物連鎖で、草を食べるウサギはどの栄養段階に当たるか。",
    choices: ["一次消費者", "二次消費者", "分解者", "生産者"],
    correct_choice_index: 0,
    short_explanation: "植物を食べる動物は一次消費者（草食動物）である。",
    detailed_explanation: "生産者（草）のエネルギーを直接摂取するのが一次消費者。ウサギは草食動物として一次消費者に分類される。",
    learning_objective: "食物連鎖の栄養段階を正しく分類できる",
    common_misconception: "動物はすべて消費者だが段階を区別しない",
    distractor_rationales: ["正解。植物を直接食べる草食動物。", "不正解。一次消費者を食べる肉食動物の段階。", "不正解。有機物を分解する生物。", "不正解。光合成する植物の段階。"],
    basic_terms: "生産者：有機物を作る生物、一次消費者：生産者を食べる消費者"
  }),
  4: q({
    domain: "生物", subdomain: "進化", difficulty_initial: 100, cognitive_type: "比較・分類",
    question_text: "次のうち、進化の証拠として化石が示すことはどれか。",
    choices: ["過去に存在した生物の形態と環境の変化", "個体が一生のうちに獲得した形質の遺伝", "同一個体内での突然変異の頻度", "現在生きる個体の遺伝子型"],
    correct_choice_index: 0,
    short_explanation: "化石は過去の生物の記録であり、種の変遷や絶滅を示す。",
    detailed_explanation: "地層中の化石は古い生物の形態を保存し、時間とともに生物群が変化したことを示す進化の証拠となる。",
    learning_objective: "化石が進化の証拠となる理由を説明できる",
    common_misconception: "化石は現在の生物と無関係だと考える",
    distractor_rationales: ["正解。化石が示す過去の生物記録。", "不正解。ラマルク的な獲得形質の誤概念。", "不正解。個体内変異は進化の直接証拠ではない。", "不正解。現在の遺伝子型は化石から直接は分からない。"],
    basic_terms: "化石：過去の生物の遺留物、進化：生物集団の遺伝的構成が世代を超えて変化すること"
  }),
  5: q({
    domain: "生物", subdomain: "分子生物学", difficulty_initial: 100, cognitive_type: "誤解・境界",
    question_text: "DNA とタンパク質の関係について、誤っている説明はどれか。",
    choices: ["DNA の配列がアミノ酸配列の情報を含む", "すべてのタンパク質は DNA から直接合成される", "遺伝子は DNA 上の特定領域である", "RNA を介してタンパク質が合成される"],
    correct_choice_index: 1,
    short_explanation: "タンパク質は mRNA をテンプレートにリボソームで合成され、DNA から直接ではない。",
    detailed_explanation: "中心法則により DNA→RNA→タンパク質の流れがある。DNA から直接タンパク質が作られるわけではなく、転写・翻訳を経る。",
    learning_objective: "DNA・RNA・タンパク質の関係を正しく説明できる",
    common_misconception: "DNA が直接タンパク質になると誤解する",
    distractor_rationales: ["不正解。正しい説明。", "正解。DNA から直接合成されるわけではない。", "不正解。正しい説明。", "不正解。正しい説明。"],
    basic_terms: "遺伝子：タンパク質などの情報を持つ DNA 領域、翻訳：mRNA からタンパク質を合成する過程"
  }),
  6: q({
    domain: "生物", subdomain: "生化学", difficulty_initial: 100, cognitive_type: "用語・定義",
    question_text: "生体内で主なエネルギー通貨として機能する分子はどれか。",
    choices: ["ATP", "DNA", "グルコース", "コレステロール"],
    correct_choice_index: 0,
    short_explanation: "ATP は加水分解によりエネルギーを放出し、多くの反応に利用される。",
    detailed_explanation: "ATP（アデノシン三リン酸）は高エネルギーリン酸結合を持ち、酵素反応や能動輸送などにエネルギーを供給する。",
    learning_objective: "ATP の役割を説明できる",
    common_misconception: "グルコース自体がエネルギー通貨だと混同する",
    distractor_rationales: ["正解。細胞のエネルギー通貨。", "不正解。遺伝情報を担う。", "不正解。エネルギー源だが直接の通貨ではない。", "不正解。膜構成脂質の一種。"],
    basic_terms: "ATP：アデノシン三リン酸、エネルギー通貨：反応間でエネルギーを受け渡す分子"
  }),
  7: q({
    domain: "生物", subdomain: "免疫学", difficulty_initial: 200, cognitive_type: "原理・因果",
    question_text: "病原体に再感染したとき、より速く強い免疫応答が起きる主な理由はどれか。",
    choices: ["記憶細胞が存在するため", "白血球の数が常に最大になるため", "皮膚のバリアが厚くなるため", "体温が上がり病原体が死ぬため"],
    correct_choice_index: 0,
    short_explanation: "初回感染で形成された記憶 B 細胞・記憶 T 細胞が再感染時に迅速に応答する。",
    detailed_explanation: "獲得免疫では初回抗原刺激で記憶細胞が形成され、再曝露時に速やかな二次応答が起こる。これがワクチンの原理でもある。",
    learning_objective: "二次免疫応答の仕組みを説明できる",
    common_misconception: "再感染時も初回と同じ速さで応答すると考える",
    distractor_rationales: ["正解。記憶細胞による二次応答。", "不正解。白血球数の恒常的増加ではない。", "不正解。物理的バリアの変化が主因ではない。", "不正解。発熱は副次的現象。"],
    basic_terms: "記憶細胞：再感染時に迅速応答するリンパ球、獲得免疫：抗原特異的な免疫"
  }),
  8: q({
    domain: "生物", subdomain: "神経科学", difficulty_initial: 200, cognitive_type: "基本的な適用",
    question_text: "反射弧において、感覚刺激を運動反応につなぐ情報の流れとして正しいものはどれか。",
    choices: ["感覚ニューロン→中枢→運動ニューロン→効果器", "運動ニューロン→感覚ニューロン→中枢→効果器", "効果器→運動ニューロン→中枢→感覚ニューロン", "中枢→感覚ニューロン→運動ニューロン→効果器"],
    correct_choice_index: 0,
    short_explanation: "刺激は感覚ニューロンで受け、中枢を経て運動ニューロンが効果器を動かす。",
    detailed_explanation: "反射弧は受容器→感覚ニューロン→（連合ニューロン）→運動ニューロン→効果器の順で情報が伝わる。",
    learning_objective: "反射弧の情報の流れを説明できる",
    common_misconception: "運動ニューロンから感覚へ情報が戻ると誤る",
    distractor_rationales: ["正解。反射弧の標準的な経路。", "不正解。方向が逆。", "不正解。効果器は出力側。", "不正解。感覚入力が先。"],
    basic_terms: "反射弧：刺激から反応までの神経経路、効果器：筋肉や腺体など反応を起こす器官"
  }),
  9: q({
    domain: "生物", subdomain: "細胞生物学", difficulty_initial: 200, cognitive_type: "比較・分類",
    question_text: "次の細胞小器官と主な機能の組み合わせとして正しいものはどれか。",
    choices: ["リボソーム—タンパク質合成", "ミトコンドリア—光合成", "細胞核—ATP 合成", "ゴルジ体—遺伝情報の複製"],
    correct_choice_index: 0,
    short_explanation: "リボソームは翻訳によりタンパク質を合成する。",
    detailed_explanation: "リボソームは mRNA を読み取りアミノ酸を結合する。ミトコンドリアは呼吸、細胞核は DNA 保持、ゴルジ体は分泌蛋白の修飾・輸送。",
    learning_objective: "主要細胞小器官の機能を正しく対応づけられる",
    common_misconception: "ミトコンドリアを光合成の場と混同する",
    distractor_rationales: ["正解。リボソームの機能。", "不正解。光合成は葉緑体。", "不正解。ATP 合成はミトコンドリア。", "不正解。DNA 複製は核内。"],
    basic_terms: "リボソーム：タンパク質合成の場、ゴルジ体：タンパク質の修飾と輸送"
  }),
  10: q({
    domain: "生物", subdomain: "遺伝学", difficulty_initial: 200, cognitive_type: "誤解・境界",
    question_text: "優性遺伝子と劣性遺伝子について、誤っている説明はどれか。",
    choices: ["ヘテロ接合でも優性形質が現れることがある", "劣性遺伝子は常に有害である", "対立遺伝子は同じ遺伝子座の変異型である", "優性・劣性は表現型の現れ方の関係である"],
    correct_choice_index: 1,
    short_explanation: "劣性遺伝子が常に有害とは限らず、キャリア状態で保たれることもある。",
    detailed_explanation: "劣性は対立遺伝子間の発現の優劣を示す用語であり、適応度の優劣ではない。劣性遺伝子も中性や有利な場合がある。",
    learning_objective: "優性・劣性の遺伝学的意味を正しく理解できる",
    common_misconception: "劣性＝悪い遺伝子と同一視する",
    distractor_rationales: ["不正解。正しい説明。", "正解。劣性が有害とは限らない。", "不正解。正しい説明。", "不正解。正しい説明。"],
    basic_terms: "優性：ヘテロ接合で表現型に現れる対立遺伝子、劣性：ホモ接合でないと表現型に現れない対立遺伝子"
  }),
  11: q({
    domain: "生物", subdomain: "細胞", difficulty_initial: 200, cognitive_type: "用語・定義",
    question_text: "細胞膜の主な構成成分はどれか。",
    choices: ["リン脂質とタンパク質", "セルロースとデンプン", "核酸とリボース", "カルシウム結晶"],
    correct_choice_index: 0,
    short_explanation: "細胞膜はリン脂質二重層に膜タンパク質が埋め込まれた構造である。",
    detailed_explanation: "流動モザイクモデルではリン脂質二重層が基盤で、膜タンパク質が物質輸送やシグナル伝達を担う。",
    learning_objective: "細胞膜の基本構成を説明できる",
    common_misconception: "細胞壁と細胞膜を混同する",
    distractor_rationales: ["正解。細胞膜の主成分。", "不正解。植物細胞壁の成分。", "不正解。核酸の成分。", "不正解。無関係。"],
    basic_terms: "リン脂質：膜の二重層を形成、流動モザイクモデル：膜の構造モデル"
  }),
  12: q({
    domain: "生物", subdomain: "遺伝", difficulty_initial: 200, cognitive_type: "原理・因果",
    question_text: "有性生殖において子の遺伝的多様性が増す主な理由はどれか。",
    choices: ["配偶子形成時の減数分裂と受精による遺伝子の組み換え", "体細胞分裂による同一コピーの増殖", "環境変化による獲得形質の遺伝", "親が多くの子を産むこと"],
    correct_choice_index: 0,
    short_explanation: "減数分裂での組み換えとランダムな受精が新しい遺伝子型を生む。",
    detailed_explanation: "相同染色体の交差と配偶子形成時の独立の分離、異なる配偶子の受精により子は親と異なる遺伝子型を持ちうる。",
    learning_objective: "有性生殖が遺伝的多様性をもたらす仕組みを説明できる",
    common_misconception: "体細胞分裂だけで多様性が生まれると考える",
    distractor_rationales: ["正解。減数分裂と受精による多様化。", "不正解。体細胞分裂は同一コピー。", "不正解。獲得形質は遺伝しない。", "不正解。子の数と多様性は別問題。"],
    basic_terms: "減数分裂：染色体数を半減する分裂、組み換え：相同染色体間の DNA 交換"
  }),
  13: q({
    domain: "生物", subdomain: "生態", difficulty_initial: 300, cognitive_type: "基本的な適用",
    question_text: "森林で枯れ葉が土壌の有機物に変換される過程で中心的な役割を果たす生物群はどれか。",
    choices: ["分解者", "生産者", "一次消費者", "頂点捕食者"],
    correct_choice_index: 0,
    short_explanation: "真菌や細菌などの分解者が有機物を無機物に戻す。",
    detailed_explanation: "分解者は枯死植物などの有機物を分解し、栄養塩を土壌に還元して物質循環を担う。",
    learning_objective: "生態系における分解者の役割を説明できる",
    common_misconception: "枯れ葉は自然に消えると考え分解者を見落とす",
    distractor_rationales: ["正解。有機物の分解を担う。", "不正解。光合成で有機物を作る。", "不正解。植物を食べる。", "不正解。食物連鎖の最上位。"],
    basic_terms: "分解者：死んだ有機物を分解する生物、物質循環：栄養素が生態系内を巡ること"
  }),
  14: q({
    domain: "生物", subdomain: "進化", difficulty_initial: 300, cognitive_type: "比較・分類",
    question_text: "自然選択と遺伝的浮動を区別する説明として正しいものはどれか。",
    choices: ["自然選択は適応度の差に基づく、浮動は偶然による", "両者とも常に適応を進める", "浮動は大集団でのみ起こる", "自然選択は突然変異を生む"],
    correct_choice_index: 0,
    short_explanation: "自然選択は適応度差を、遺伝的浮動は偶然のサンプリングを反映する。",
    detailed_explanation: "自然選択は遺伝子頻度を適応度に応じて変える。遺伝的浮動は小集団などで偶然により頻度が変わる非適応的過程。",
    learning_objective: "自然選択と遺伝的浮動の違いを説明できる",
    common_misconception: "すべての進化は自然選択によると考える",
    distractor_rationales: ["正解。適応的 vs 非適応的な頻度変化。", "不正解。浮動は適応を必ずしも進めない。", "不正解。浮動は小集団で顕著。", "不正解。突然変異は選択の前提。"],
    basic_terms: "自然選択：適応度の高い形質が残る過程、遺伝的浮動：偶然による遺伝子頻度の変化"
  }),
  15: q({
    domain: "生物", subdomain: "分子生物学", difficulty_initial: 300, cognitive_type: "誤解・境界",
    question_text: "転写と翻訳の関係について、誤っている説明はどれか。",
    choices: ["転写は DNA から RNA を合成する", "翻訳はリボソームで行われる", "転写と翻訳は真核細胞で同一区画で同時に行われる", "mRNA は翻訳のテンプレートになる"],
    correct_choice_index: 2,
    short_explanation: "真核細胞では転写は核、翻訳は細胞質で行われ時空間的に分離する。",
    detailed_explanation: "原核生物では転写・翻訳が同時進行するが、真核生物では核膜により転写と翻訳は分離される。",
    learning_objective: "真核と原核での転写・翻訳の違いを説明できる",
    common_misconception: "真核でも転写と翻訳が同時に核内で起こると誤解する",
    distractor_rationales: ["不正解。正しい説明。", "不正解。正しい説明。", "正解。真核では分離される。", "不正解。正しい説明。"],
    basic_terms: "転写：DNA から RNA を合成、翻訳：mRNA からタンパク質を合成"
  }),
  16: q({
    domain: "生物", subdomain: "生化学", difficulty_initial: 300, cognitive_type: "用語・定義",
    question_text: "酵素の「基質」とは何を指すか。",
    choices: ["酵素が触媒する反応の反応物", "酵素の補因子", "反応の生成物", "酵素自身の活性部位"],
    correct_choice_index: 0,
    short_explanation: "基質は酵素が作用する特定の反応物分子である。",
    detailed_explanation: "酵素は基質を活性部位で認識し、結合定数と触媒効率（kcat）で反応を促進する。",
    learning_objective: "酵素反応における基質の定義を述べられる",
    common_misconception: "基質と生成物を混同する",
    distractor_rationales: ["正解。酵素が作用する反応物。", "不正解。補因子は補助分子。", "不正解。生成物は反応の産物。", "不正解。活性部位は酵素上の部位。"],
    basic_terms: "基質：酵素反応の反応物、活性部位：基質が結合する酵素上の部位"
  }),
  17: q({
    domain: "生物", subdomain: "免疫学", difficulty_initial: 300, cognitive_type: "原理・因果",
    question_text: "ワクチン接種が感染症を予防できる主な免疫学的機序はどれか。",
    choices: ["抗原を認識した記憶細胞の形成", "血液中の全抗体を永久に増加させる", "自然免疫の物理的バリアを強化する", "病原体を体内から即座に排除する"],
    correct_choice_index: 0,
    short_explanation: "ワクチンは弱毒化抗原などで獲得免疫と記憶を誘導する。",
    detailed_explanation: "ワクチンは病原関連抗原を安全に提示し、特異的抗体産生と記憶 B/T 細胞を形成。実際の感染時に二次応答を可能にする。",
    learning_objective: "ワクチンの免疫学的原理を説明できる",
    common_misconception: "ワクチンが即座に病原体を殺すと考える",
    distractor_rationales: ["正解。記憶免疫の誘導。", "不正解。全抗体の永久増加ではない。", "不正解。物理バリア強化が主ではない。", "不正解。予防であり即時排除ではない。"],
    basic_terms: "ワクチン：免疫記憶を誘導する抗原製剤、記憶細胞：再曝露時に迅速応答するリンパ球"
  }),
  18: q({
    domain: "生物", subdomain: "神経科学", difficulty_initial: 300, cognitive_type: "基本的な適用",
    question_text: "神経細胞の活動電位が伝播する際、隣接部位の膜電位を変化させる主な機序はどれか。",
    choices: ["脱分極部の電位変化が隣接膜を脱分極させる", "シナプス小胞が常に放出される", "ミエリンが電位を吸収する", "カリウムチャネルだけが開く"],
    correct_choice_index: 0,
    short_explanation: "活動電位は脱分極が隣接区画へ伝わることで伝播する。",
    detailed_explanation: "活動電位発生部の脱分極電流が隣接膜を閾値まで脱分極させ、電位の連鎖的伝播が起こる。有髄鞘ではランビエ絞輪でジャンプ伝導。",
    learning_objective: "活動電位の伝播機序を説明できる",
    common_misconception: "活動電位は化学物質の拡散で伝わると誤解する",
    distractor_rationales: ["正解。脱分極の連鎖伝播。", "不正解。シナプス伝達は別過程。", "不正解。ミエリンは伝導を促進。", "不正解。K+ チャネルは再分極に関与。"],
    basic_terms: "活動電位：膜電位の一過性の反転、脱分極：膜電位が閾値に向かう変化"
  }),
  19: q({
    domain: "生物", subdomain: "細胞生物学", difficulty_initial: 400, cognitive_type: "比較・分類",
    question_text: "有糸分裂と減数分裂の比較として正しいものはどれか。",
    choices: ["有糸分裂は2個の相同染色体セットを持つ子細胞を作る", "減数分裂は体細胞の増殖に用いられる", "有糸分裂では染色体数が半減する", "減数分裂では交差が起こらない"],
    correct_choice_index: 0,
    short_explanation: "有糸分裂は2n→2n、減数分裂は2n→n で配偶子形成に使われる。",
    detailed_explanation: "有糸分裂は成長・再生用で子細胞は親と同じ染色体数。減数分裂は相同染色体の交差と2回分裂で染色体数半減。",
    learning_objective: "有糸分裂と減数分裂の目的と結果を比較できる",
    common_misconception: "減数分裂も体細胞分裂だと混同する",
    distractor_rationales: ["正解。有糸分裂は染色体数維持。", "不正解。減数分裂は配偶子形成用。", "不正解。有糸分裂は半減しない。", "不正解。減数分裂で交差が起こる。"],
    basic_terms: "有糸分裂：染色体数を維持する体細胞分裂、減数分裂：染色体数を半減する分裂"
  }),
  20: q({
    domain: "生物", subdomain: "遺伝学", difficulty_initial: 400, cognitive_type: "誤解・境界",
    question_text: "性連鎖遺伝について、誤っている説明はどれか。",
    choices: ["X 連鎖遺伝では男性が罹患しやすいことがある", "性染色体上の遺伝子は常に雌雄で同じ発現パターンを示す", "色覚異常は X 連鎖劣性の例である", "母から X 連鎖遺伝子を受け継ぐ"],
    correct_choice_index: 1,
    short_explanation: "X 連鎖遺伝子は雌雄でコピー数や不活化の影響を受け発現が異なる。",
    detailed_explanation: "男性は X を1本のみ持つため X 連鎖劣性に罹患しやすい。女性は X 不活化によりモザイク発現となる場合がある。",
    learning_objective: "性連鎖遺伝の特徴と雌雄差を説明できる",
    common_misconception: "性染色体上の遺伝子は常に同様に発現すると考える",
    distractor_rationales: ["不正解。正しい説明。", "正解。雌雄で発現パターンは異なりうる。", "不正解。正しい例。", "不正解。母から X を受け継ぐ。"],
    basic_terms: "X 連鎖：X 染色体上の遺伝子の遺伝、X 不活化：雌で一方の X を転写抑制"
  }),
  21: q({
    domain: "生物", subdomain: "細胞", difficulty_initial: 400, cognitive_type: "用語・定義",
    question_text: "能動輸送の定義として正しいものはどれか。",
    choices: ["ATP などのエネルギーを使い濃度勾配に逆らって物質を移動させる", "濃度勾配に従って物質が拡散する", "水分子が半透膜を通過する", "大きな粒子が細胞膜で融合する"],
    correct_choice_index: 0,
    short_explanation: "能動輸送はエネルギー消費により低濃度側へ物質を集める。",
    detailed_explanation: "ナトリウム・カリウムポンプなどは ATP 水解によりイオンを濃度勾配に逆らって輸送する。",
    learning_objective: "能動輸送と受動輸送を区別できる",
    common_misconception: "すべての膜輸送が受動的だと考える",
    distractor_rationales: ["正解。エネルギー依存の逆勾配輸送。", "不正解。受動輸送（単純拡散）。", "不正解。浸透の説明。", "不正解。胞飲・胞吐の説明。"],
    basic_terms: "能動輸送：エネルギーを使った物質輸送、濃度勾配：濃度の高低差"
  }),
  22: q({
    domain: "生物", subdomain: "遺伝", difficulty_initial: 400, cognitive_type: "原理・因果",
    question_text: "DNA 複製が半保存的である理由はどれか。",
    choices: ["各子 DNA は親鎖1本と新合成鎖1本からなる", "親 DNA が完全に分解されてから再合成される", "2本の子 DNA がともに全新合成である", "複製は RNA のみで行われる"],
    correct_choice_index: 0,
    short_explanation: "メセルソン・スタールの実験が半保存的複製を示した。",
    detailed_explanation: "複製フォークで各親鎖がテンプレートとなり、子 DNA 分子は旧鎖と新鎖のハイブリッドとなる。",
    learning_objective: "半保存的複製の意味を説明できる",
    common_misconception: "親 DNA が全分解されてから作られると考える",
    distractor_rationales: ["正解。半保存的複製の定義。", "不正解。分散複製の誤概念。", "不正解。全保存的複製。", "不正解。DNA 複製は DNA ポリメラーゼが担う。"],
    basic_terms: "半保存的複製：各子 DNA に親鎖1本が残る複製、複製フォーク：複製が進行する Y 字型部位"
  }),
  23: q({
    domain: "生物", subdomain: "生態", difficulty_initial: 400, cognitive_type: "基本的な適用",
    question_text: "人口が環境収容力 K に近づくと増加率が低下する成長を最もよく表すモデルはどれか。",
    choices: ["ロジスティック成長", "指数成長", "線形成長", "ランダムウォーク"],
    correct_choice_index: 0,
    short_explanation: "ロジスティック成長は資源制限により増加率が K に近づくと小さくなる。",
    detailed_explanation: "dN/dt = rN(1−N/K) で N が K に近づくと (1−N/K)→0 となり増加が鈍化する。",
    learning_objective: "ロジスティック成長モデルを適用できる",
    common_misconception: "人口は常に指数成長すると考える",
    distractor_rationales: ["正解。環境収容力を考慮した成長。", "不正解。資源制限を無視。", "不正解。一定速度の増加。", "不正解。人口動態モデルではない。"],
    basic_terms: "環境収容力 K：環境が支えうる最大個体数、ロジスティック成長：K による制限付き成長"
  }),
  24: q({
    domain: "生物", subdomain: "進化", difficulty_initial: 400, cognitive_type: "比較・分類",
    question_text: "相同器官と相似器官の区別として正しいものはどれか。",
    choices: ["相同器官は共通祖先に由来し構造が対応する", "相似器官は必ず遺伝的に同一起源である", "相同器官は機能が常に同一である", "相似器官は進化的に無関係な起源から生じうる"],
    correct_choice_index: 0,
    short_explanation: "相同は系統的相同（共通祖先）、相似は収斂進化による類似。",
    detailed_explanation: "ヒトの腕とクジラの胸びれは骨格が対応する相同器官。昆虫と鳥の翼は構造が異なり相似器官の例。",
    learning_objective: "相同器官と相似器官を区別できる",
    common_misconception: "似た形態はすべて相同だと考える",
    distractor_rationales: ["正解。相同器官の定義。", "不正解。相似は異なる起源。", "不正解。相同でも機能は変化しうる。", "不正解。D は相似器官の説明。"],
    basic_terms: "相同器官：共通祖先由来の対応する器官、相似器官：異なる起源からの類似形態"
  }),
  25: q({
    domain: "生物", subdomain: "分子生物学", difficulty_initial: 500, cognitive_type: "誤解・境界",
    question_text: "遺伝子発現調節について、誤っている説明はどれか。",
    choices: ["転写レベルでの調節が最も一般的である", "すべての遺伝子は常に最大速度で転写される", "翻訳後修飾も発現調節に関与する", "エピジェネティック修飾が発現に影響する"],
    correct_choice_index: 1,
    short_explanation: "遺伝子発現は細胞種・状態に応じて厳密に調節され、常に最大ではない。",
    detailed_explanation: "転写因子、クロマチン修飾、miRNA など多層的調節があり、必要な遺伝子のみが適切なタイミングで発現する。",
    learning_objective: "遺伝子発現の多層的調節を理解できる",
    common_misconception: "全遺伝子が常に発現していると考える",
    distractor_rationales: ["不正解。正しい説明。", "正解。常に最大転写ではない。", "不正解。正しい説明。", "不正解。正しい説明。"],
    basic_terms: "転写調節：転写開始の制御、エピジェネティクス：DNA 配列を変えず発現を制御"
  }),
  26: q({
    domain: "生物", subdomain: "生化学", difficulty_initial: 500, cognitive_type: "用語・定義",
    question_text: "解糖系（グリコリシス）の最終産物（ピルビン酸まで）として正しいものはどれか。",
    choices: ["1分子のグルコースから2分子のピルビン酸", "1分子のグルコースから1分子のピルビン酸", "2分子のグルコースから1分子のピルビン酸", "グルコースから直接 CO₂ のみ"],
    correct_choice_index: 0,
    short_explanation: "解糖系はグルコースを2分子のピルビン酸に分解し、ATP と NADH も産生する。",
    detailed_explanation: "解糖系10段階反応でグルコース（6炭素）が2つの3炭素糖に分割され、最終的に2ピルビン酸となる。正味 ATP 2分子（または基質レベルリン酸化で4）を産生。",
    learning_objective: "解糖系の基質と産物を正確に述べられる",
    common_misconception: "グルコース1分子からピルビン酸1分子と考える",
    distractor_rationales: ["正解。解糖系の産物は2ピルビン酸。", "不正解。炭素の分割を考慮していない。", "不正解。基質の数が誤り。", "不正解。解糖では CO₂ は出ない。"],
    basic_terms: "解糖系：細胞質でのグルコース分解、ピルビン酸：解糖系の終産物"
  }),
  27: q({
    domain: "生物", subdomain: "免疫学", difficulty_initial: 500, cognitive_type: "原理・因果",
    question_text: "MHC クラス I 分子が提示する抗原ペプチドの主な細胞内由来はどれか。",
    choices: ["細胞質で分解されたタンパク質", "細胞外から取り込んだ病原体", "リンパ節で濃縮された抗体", "血清中の補体タンパク質"],
    correct_choice_index: 0,
    short_explanation: "MHC I は細胞質タンパク質由来ペプチドを CD8+ T 細胞に提示する。",
    detailed_explanation: "プロテアソームで分解されたペプチドが TAP により内質網へ運ばれ MHC I に結合し、ウイルス感染細胞などを CTL に提示する。",
    learning_objective: "MHC I と MHC II の抗原提示経路の違いを説明できる",
    common_misconception: "MHC I と II が同じ抗原を提示すると混同する",
    distractor_rationales: ["正解。MHC I は細胞内由来。", "不正解。MHC II の経路。", "不正解。抗体は提示抗原ではない。", "不正解。補体は提示系とは別。"],
    basic_terms: "MHC I：細胞内抗原を CD8+ T 細胞に提示、プロテアソーム：細胞質タンパク質分解装置"
  }),
  28: q({
    domain: "生物", subdomain: "神経科学", difficulty_initial: 500, cognitive_type: "基本的な適用",
    question_text: "化学シナプスで興奮性伝達が起こるとき、シナプス後膜の電位変化として最も典型的なものはどれか。",
    choices: ["脱分極性の興奮性シナプス後電位", "過分極性の抑制性シナプス後電位", "活動電位の恒常的発火", "ミエリンの再形成"],
    correct_choice_index: 0,
    short_explanation: "興奮性伝達物質はシナプス後膜を脱分極させ EPSP を生じる。",
    detailed_explanation: "グルタミン酸など興奮性伝達物質は Na+ チャネルを開き脱分極。閾値に達すれば活動電位が発火する。",
    learning_objective: "興奮性・抑制性シナプス後電位の違いを説明できる",
    common_misconception: "すべてのシナプス伝達が活動電位を直接生むと考える",
    distractor_rationales: ["正解。興奮性伝達の典型。", "不正解。抑制性伝達の結果。", "不正解。恒常的発火ではない。", "不正解。シナプス伝達とは無関係。"],
    basic_terms: "EPSP：興奮性シナプス後電位、化学シナプス：神経伝達物質による接合"
  }),
  29: q({
    domain: "生物", subdomain: "細胞生物学", difficulty_initial: 500, cognitive_type: "比較・分類",
    question_text: "細胞内小器官の膜構造について正しい組み合わせはどれか。",
    choices: ["ミトコンドリア—二重膜", "リボソーム—単一膜", "小胞体—膜なし", "過酸化酵素体—四重膜"],
    correct_choice_index: 0,
    short_explanation: "ミトコンドリアは外膜と内膜の二重膜構造を持つ。",
    detailed_explanation: "リボソームは膜を持たない非膜性小器官。小胞体は膜性小器官。過酸化酵素体は単一膜。",
    learning_objective: "主要小器官の膜構造を分類できる",
    common_misconception: "すべての小器官が膜で囲まれていると考える",
    distractor_rationales: ["正解。ミトコンドリアの二重膜。", "不正解。リボソームは膜なし。", "不正解。小胞体は膜性。", "不正解。過酸化酵素体は単一膜。"],
    basic_terms: "二重膜：外膜と内膜の2層構造、リボソーム：タンパク質と rRNA からなる非膜性小器官"
  }),
  30: q({
    domain: "生物", subdomain: "遺伝学", difficulty_initial: 500, cognitive_type: "誤解・境界",
    question_text: "一遺伝子一酵素説について、現代遺伝学の理解として最も適切なものはどれか。",
    choices: ["1遺伝子が1つのポリペプチド鎖（または機能単位）に対応するが、1酵素が複数サブユニットを持つ場合もある", "1遺伝子が必ず1つの代謝経路全体を制御する", "酵素は遺伝子とは無関係に生じる", "すべての遺伝子が酵素をコードする"],
    correct_choice_index: 0,
    short_explanation: "Beadle-Tatum の説は「1遺伝子1酵素」を基礎とし、現代では多くの場合1遺伝子1ポリペプチドと理解される。",
    detailed_explanation: "多くの酵素は複数サブユニットからなり、各サブユニットは別遺伝子由来の場合もある。また遺伝子は酵素以外のタンパク質もコードする。",
    learning_objective: "一遺伝子一酵素説の歴史的意義と現代的限界を説明できる",
    common_misconception: "1遺伝子＝1完全な酵素分子と単純化する",
    distractor_rationales: ["正解。現代的な理解。", "不正解。過度な単純化。", "不正解。酵素は遺伝子産物。", "不正解。非コード遺伝子や調節遺伝子も存在。"],
    basic_terms: "一遺伝子一酵素説：遺伝子と酵素の対応を示した古典的概念、サブユニット：酵素を構成するタンパク質単位"
  }),
  31: q({
    domain: "生物", subdomain: "細胞", difficulty_initial: 600, cognitive_type: "用語・定義",
    question_text: "細胞周期の G1 期に主に行われるプロセスとして最も適切なものはどれか。",
    choices: ["細胞成長と代謝活性の亢進", "染色体の凝縮", "紡錘糸の形成", "細胞質の分裂"],
    correct_choice_index: 0,
    short_explanation: "G1 期は前間期の成長期で、細胞はサイズを増し S 期への準備をする。",
    detailed_explanation: "G1→S→G2→M の順で、G1 ではタンパク質・RNA 合成が活発。制限点（R 点）で S 期進入が決定される。",
    learning_objective: "細胞周期各期の特徴を説明できる",
    common_misconception: "G1 期を分裂期と混同する",
    distractor_rationales: ["正解。G1 の主な特徴。", "不正解。前期（prophase）の特徴。", "不正解。M 期の特徴。", "不正解。胞質分裂（cytokinesis）。"],
    basic_terms: "G1 期：DNA 合成前の成長期、制限点：S 期進入を決定するチェックポイント"
  }),
  32: q({
    domain: "生物", subdomain: "遺伝", difficulty_initial: 600, cognitive_type: "原理・因果",
    question_text: "相同組換え（ホモロガス組換え）修復が起こる主な条件はどれか。",
    choices: ["二本鎖切断と相同テンプレートの存在", "塩基の自発的脱アミノ", "翻訳の誤読", "リボソームの結合"],
    correct_choice_index: 0,
    short_explanation: "二本鎖切断に対し、相同染色体上の相同配列をテンプレートに修復する。",
    detailed_explanation: "Rad51 などが介在し、切断末端が相同鎖を侵食して正確な修復を行う。非同源的末端結合（NHEJ）とは異なる経路。",
    learning_objective: "相同組換え修復の条件と意義を説明できる",
    common_misconception: "すべての DNA 損傷が NHEJ で修復されると考える",
    distractor_rationales: ["正解。相同組換え修復の条件。", "不正解。別の損傷タイプ。", "不正解。翻訳の問題。", "不正解。無関係。"],
    basic_terms: "相同組換え修復：相同配列を用いた正確な DNA 修復、二本鎖切断：DNA の両鎖が切断された損傷"
  }),
  33: q({
    domain: "生物", subdomain: "生態", difficulty_initial: 600, cognitive_type: "基本的な適用",
    question_text: "競争排除の原理が予測する現象として最も適切なものはどれか。",
    choices: ["ニッチが完全に重なる2種は同じ生息地で永続的に共存できない", "捕食者が増えると被食者も必ず増える", "多様性は常に安定性を低下させる", "環境収容力は種間競争と無関係である"],
    correct_choice_index: 0,
    short_explanation: "Gause の競争排除原理：同一資源を完全競争する2種は共存できない。",
    detailed_explanation: "ニッチの完全重複では競争により一方が排除される。共存にはニッチ分化が必要とされる。",
    learning_objective: "競争排除原理を生態系の文脈で適用できる",
    common_misconception: "似た種は常に共存できると考える",
    distractor_rationales: ["正解。競争排除の予測。", "不正解。捕食者-被食者の関係。", "不正解。多様性-安定性の関係は複雑。", "不正解。K は競争に影響される。"],
    basic_terms: "競争排除：ニッチ重複種の一方が消滅、ニッチ：種の生態的地位"
  }),
  34: q({
    domain: "生物", subdomain: "進化", difficulty_initial: 600, cognitive_type: "比較・分類",
    question_text: "分子系統樹において、外群（アウトグループ）を設定する主な目的はどれか。",
    choices: ["系統樹の根（ルート）を決定する", "最も進化的に新しい種を特定する", "遺伝子発現量を測定する", "自然選択の強度を直接計算する"],
    correct_choice_index: 0,
    short_explanation: "外群は解析対象群（内群）の姉妹群として根の位置を極性化する。",
    detailed_explanation: "外群を含む系統樹解析により、進化の方向（祖先→子孫）を推定できる。",
    learning_objective: "分子系統解析における外群の役割を説明できる",
    common_misconception: "外群は最も原始的な種だと誤解する",
    distractor_rationales: ["正解。根の決定が主目的。", "不正解。新しい種の特定ではない。", "不正解。発現量測定とは無関係。", "不正解。選択強度の直接計算ではない。"],
    basic_terms: "外群：解析対象群の外にある関連分類群、系統樹：進化的関係を示す分岐図"
  }),
  35: q({
    domain: "生物", subdomain: "分子生物学", difficulty_initial: 600, cognitive_type: "誤解・境界",
    question_text: "中心法則について、現代分子生物学の理解として誤っている説明はどれか。",
    choices: ["DNA→RNA→タンパク質の流れが基本である", "逆転写により RNA から DNA が合成されうる", "情報の流れは常に一方向で例外はない", "RNA ウイルスは逆転写酵素を持つことがある"],
    correct_choice_index: 2,
    short_explanation: "逆転写や RNA 複製など、中心法則の例外が知られている。",
    detailed_explanation: "Crick の中心法則は基本フローを示すが、逆転写（RT）、RNA 複製、プリオンなど情報流の例外・拡張が存在する。",
    learning_objective: "中心法則の基本と例外を区別できる",
    common_misconception: "情報の流れに例外がないと考える",
    distractor_rationales: ["不正解。正しい説明。", "不正解。正しい説明。", "正解。逆転写など例外がある。", "不正解。正しい説明。"],
    basic_terms: "中心法則：遺伝情報の流れの基本図式、逆転写：RNA から DNA を合成"
  }),
  36: q({
    domain: "生物", subdomain: "生化学", difficulty_initial: 700, cognitive_type: "用語・定義",
    question_text: "ミカエリス・メンテン酵素反応における Km の定義として正しいものはどれか。",
    choices: ["反応速度が Vmax の半分になる基質濃度", "酵素の最大反応速度", "基質と酵素の結合定数の逆数のみ", "阻害剤の解離定数"],
    correct_choice_index: 0,
    short_explanation: "Km は V=vmax/2 となる基質濃度で、酵素と基質の親和性の指標となる。",
    detailed_explanation: "Km = (k−1 + kcat)/k1 で、小さいほど基質親和性が高い（低濃度で半最大速度）。",
    learning_objective: "Km と Vmax の意味を正確に述べられる",
    common_misconception: "Km を Vmax と混同する",
    distractor_rationales: ["正解。Km の定義。", "不正解。Vmax の定義。", "不正解。Km は複合的パラメータ。", "不正解。阻害剤の定数ではない。"],
    basic_terms: "Km：半最大速度時の基質濃度、Vmax：酵素飽和時の最大反応速度"
  }),
  37: q({
    domain: "生物", subdomain: "免疫学", difficulty_initial: 700, cognitive_type: "原理・因果",
    question_text: "抗体のクラススイッチ（isotype switching）が起こる主な免疫学的意義はどれか。",
    choices: ["同一抗原特異性を保ちつつ効果機能を変える", "抗原特異性そのものを変える", "T 細胞を B 細胞に変換する", "補体を恒久的に不活性化する"],
    correct_choice_index: 0,
    short_explanation: "クラススイッチは可変区を保ち定常区（Fc）を変え、IgM から IgG などへ切り替える。",
    detailed_explanation: "相同組換えにより C 遺伝子領域が変わり、補体活性化・Fc 受容体結合・胎盤通過など効果機能が変化する。",
    learning_objective: "クラススイッチの機序と意義を説明できる",
    common_misconception: "クラススイッチで抗原特異性が変わると誤解する",
    distractor_rationales: ["正解。特異性維持・効果機能変更。", "不正解。可変区は不変。", "不正解。細胞型転換ではない。", "不正解。補体との関係は効果の一側面。"],
    basic_terms: "クラススイッチ：抗体の定常区を変える相同組換え、可変区：抗原結合部位"
  }),
  38: q({
    domain: "生物", subdomain: "神経科学", difficulty_initial: 700, cognitive_type: "基本的な適用",
    question_text: "長期増強（LTP）がシナプス可塑性のモデルとされる主な理由はどれか。",
    choices: ["特定パターンの刺激後にシナプス伝達効率が長期間増大する", "すべてのシナプスが常に同じ強度を維持する", "神経細胞の数が増殖する", "ミエリンが完全に消失する"],
    correct_choice_index: 0,
    short_explanation: "LTP は海馬などで高頻度刺激後のシナプス伝達効率の持続的増大。",
    detailed_explanation: "NMDA 受容体依存性 LTP は学習・記憶の細胞基盤の候補とされ、Ca2+ 流入と AMPA 受容体増加が関与する。",
    learning_objective: "LTP の定義と学習記憶との関連を説明できる",
    common_misconception: "記憶は神経細胞の新生だけで説明できると考える",
    distractor_rationales: ["正解。LTP の定義的特徴。", "不正解。可塑性は強度変化を含む。", "不正解。成人海馬に限定的な神経新生。", "不正解。無関係。"],
    basic_terms: "LTP：長期増強、シナプス可塑性：シナプス伝達効率の変化可能性"
  }),
  39: q({
    domain: "生物", subdomain: "細胞生物学", difficulty_initial: 700, cognitive_type: "比較・分類",
    question_text: "オートファジー（自食作用）の種類と特徴の組み合わせとして正しいものはどれか。",
    choices: ["マクロオートファジー—二重膜のオートファジソームが細胞質成分を包み込む", "CMA—リボソームが直接 DNA を分解する", "ミクロオートファジー—核膜が常に溶解する", "オートファジー—常に細胞死を引き起こす"],
    correct_choice_index: 0,
    short_explanation: "マクロオートファジーはオートファジソームによる細胞質成分のlysosome への輸送。",
    detailed_explanation: "CMA は Hsc70 による可溶性タンパク質の直接リソソーム輸送。ミクロオートファジーはリソソーム膜の内方陷入。オートファジーは生存にも関与。",
    learning_objective: "オートファジーの主要経路を比較できる",
    common_misconception: "オートファジーは常に細胞死と同一視する",
    distractor_rationales: ["正解。マクロオートファジーの特徴。", "不正解。CMA はリボソームではなく Hsc70。", "不正解。核膜溶解は非典型的。", "不正解。生存にも寄与。"],
    basic_terms: "マクロオートファジー：オートファジソームを介した分解、CMA：シャペロン介在型オートファジー"
  }),
  40: q({
    domain: "生物", subdomain: "遺伝学", difficulty_initial: 700, cognitive_type: "誤解・境界",
    question_text: "ゲノムインプリンティングについて、誤っている説明はどれか。",
    choices: ["親由来により一方の対立遺伝子が発現抑制される", "インプリンティングは常に常染色体の両方に同時に起こる", "メチル化がインプリンティング制御に関与する", "プラダー・ウィリ症候群はインプリンティング異常の例である"],
    correct_choice_index: 1,
    short_explanation: "インプリンティングは特定遺伝子座で父または母由来の一方がサイレンシングされる。",
    detailed_explanation: "15番染色体の SNRPN 領域などで親特異的メチル化パターンにより一方が発現。両親由来で同時に両方抑制されるわけではない。",
    learning_objective: "ゲノムインプリンティングの特徴を説明できる",
    common_misconception: "両親からの遺伝子が常に同等に発現すると考える",
    distractor_rationales: ["不正解。正しい説明。", "正解。一方の親由来が抑制される。", "不正解。正しい説明。", "不正解。正しい例。"],
    basic_terms: "ゲノムインプリンティング：親由来による遺伝子発現の差異、メチル化：DNA のエピジェネティック修飾"
  }),
  41: q({
    domain: "生物", subdomain: "細胞", difficulty_initial: 800, cognitive_type: "用語・定義",
    question_text: "細胞接着におけるカドヘリンの特徴として正しいものはどれか。",
    choices: ["Ca2+ 依存性の相同細胞間接着を媒介する", "細胞外マトリックスのみに結合する", "すべての細胞種で発現が同一である", "G タンパク質共役型受容体である"],
    correct_choice_index: 0,
    short_explanation: "カドヘリンは Ca2+ 存在下で相同細胞間の接着結合を形成する。",
    detailed_explanation: "E-カドヘリンは上皮細胞の接着結合に、N-カドヘリンは神経・間葉系に関与。β-カテニンと連結しシグナル伝達にも関与。",
    learning_objective: "カドヘリンの機能と Ca2+ 依存性を説明できる",
    common_misconception: "細胞接着はすべてインテグリンのみが担うと考える",
    distractor_rationales: ["正解。カドヘリンの定義的特徴。", "不正解。ECM 結合は主にインテグリン。", "不正解。細胞種特異的発現。", "不正解。接着分子であり GPCR ではない。"],
    basic_terms: "カドヘリン：Ca2+ 依存性接着分子、接着結合：上皮細胞間の密着構造"
  }),
  42: q({
    domain: "生物", subdomain: "遺伝", difficulty_initial: 800, cognitive_type: "原理・因果",
    question_text: "DNA メチル化が遺伝子発現を抑制する主な機序はどれか。",
    choices: ["メチル化 DNA 結合タンパク質の募集とクロマチン構造変化", "DNA 配列そのものの永久変異", "リボソームの機能停止", "mRNA の加水分解のみ"],
    correct_choice_index: 0,
    short_explanation: "CpG メチル化は MBD タンパク質を介し転写抑制複合体を招集する。",
    detailed_explanation: "DNMT による 5-メチルシトシン形成、MeCP2 などが HDAC を招集しヒストン脱アセチル化・クロマチン凝縮で転写を抑制。",
    learning_objective: "DNA メチル化による転写抑制機序を説明できる",
    common_misconception: "メチル化が DNA 配列を変異させると誤解する",
    distractor_rationales: ["正解。エピジェネティック抑制機序。", "不正解。配列変異ではない。", "不正解。翻訳段階ではない。", "不正解。転写レベルの抑制が主。"],
    basic_terms: "DNA メチル化：シトシンへのメチル基付加、MeCP2：メチル化 DNA 結合タンパク質"
  }),
  43: q({
    domain: "生物", subdomain: "生態", difficulty_initial: 800, cognitive_type: "基本的な適用",
    question_text: "メタコミュニティ理論において、種の移動（dispersal）が局所的多様性に与える典型的な効果はどれか。",
    choices: ["移動が種の局所絶滅を補償し多様性を維持しうる", "移動は常に局所競争を完全に排除する", "移動は環境収容力を恒久的に増加させる", "移動は常に局所多様性を低下させる"],
    correct_choice_index: 0,
    short_explanation: "パッチ間の移動（救援効果）が局所絶滅を緩和し多様性維持に寄与する。",
    detailed_explanation: "メタコミュニティでは局所絶滅と再コロナイゼーションのバランスが多様性を規定。移動は rescue effect や mass effect を通じて多様性パターンを変える。",
    learning_objective: "メタコミュニティにおける移動の役割を適用できる",
    common_misconception: "移動は常に多様性を下げると単純化する",
    distractor_rationales: ["正解。救援効果などによる多様性維持。", "不正解。競争排除は依然起こりうる。", "不正解。K 自体は変わらない。", "不正解。効果は文脈依存的。"],
    basic_terms: "メタコミュニティ：複数パッチの集合体、救援効果：移入による局所絶滅の緩和"
  }),
  44: q({
    domain: "生物", subdomain: "進化", difficulty_initial: 800, cognitive_type: "比較・分類",
    question_text: "正のダーウィン選択と純化選択の違いとして正しいものはどれか。",
    choices: ["正の選択は有利な変異の頻度を増加させ、純化選択は有害変異を除去する", "純化選択は常に新規遺伝子を創出する", "正の選択は遺伝子頻度を変化させない", "両者は分子レベルでは区別できない"],
    correct_choice_index: 0,
    short_explanation: "dN/dS > 1 は正の選択、dN/dS < 1 は純化選択の指標となる。",
    detailed_explanation: "正の選択（適応的進化）は非同義置換が同義置換より多い。純化選択は機能制約の高い遺伝子で有害変異を除去。",
    learning_objective: "分子進化における選択の種類を比較できる",
    common_misconception: "すべての進化が正の選択だと考える",
    distractor_rationales: ["正解。両選択の定義的違い。", "不正解。純化は変異除去。", "不正解。正の選択は頻度を変える。", "不正解。dN/dS 等で区別可能。"],
    basic_terms: "正の選択：有利変異の固定、純化選択：有害変異の除去、dN/dS：非同義/同義置換比"
  }),
  45: q({
    domain: "生物", subdomain: "分子生物学", difficulty_initial: 800, cognitive_type: "誤解・境界",
    question_text: "転写と翻訳の境界に関する説明として、誤っているものはどれか。",
    choices: ["原核生物では転写と翻訳が偶連する", "真核生物では核膜により転写と翻訳が分離される", "すべての生物で mRNA は翻訳前に必ず核内で完全に加工される", "ミトコンドリアは独自の翻訳系を持つ"],
    correct_choice_index: 2,
    short_explanation: "原核生物には核がなく、mRNA は転写と同時に翻訳され核内加工の概念がない。",
    detailed_explanation: "真核ではスプライシング等の核内加工後に細胞質で翻訳。原核では未加工 mRNA がリボソームに結合し偶連翻訳。",
    learning_objective: "原核・真核・細胞器における転写翻訳の境界を区別できる",
    common_misconception: "すべての mRNA が核内で完全加工されると考える",
    distractor_rationales: ["不正解。正しい説明。", "不正解。正しい説明。", "正解。原核には核内加工がない。", "不正解。正しい説明。"],
    basic_terms: "偶連翻訳：転写と翻訳の同時進行、スプライシング：イントロン除去"
  }),
  46: q({
    domain: "生物", subdomain: "生化学", difficulty_initial: 900, cognitive_type: "用語・定義",
    question_text: "酵素のアロステリック調節における「協同性（cooperativity）」の定義として最も適切なものはどれか。",
    choices: ["基質結合が同一酵素の他の結合部位の親和性を変化させる現象", "酵素が常に基質と1:1 で結合する現象", "阻害剤が活性部位に不可逆結合する現象", "補因子がなくても最大活性を示す現象"],
    correct_choice_index: 0,
    short_explanation: "協同性は多量体酵素で基質結合の協調的変化（シグモイド曲線）を生じる。",
    detailed_explanation: "ヘモグロビンの T-R 状態転移やアロステリック酵素の MWC/KNF モデルが協同性の代表例。",
    learning_objective: "アロステリック協同性の定義を正確に述べられる",
    common_misconception: "すべての酵素がミカエリス・メンテン式に従うと考える",
    distractor_rationales: ["正解。協同性の定義。", "不正解。1:1 結合は協同性の説明ではない。", "不正解。不可逆阻害の説明。", "不正解。補因子不要は別の話。"],
    basic_terms: "協同性：基質結合の協調的変化、アロステリック：活性部位以外の部位での調節"
  }),
  47: q({
    domain: "生物", subdomain: "免疫学", difficulty_initial: 900, cognitive_type: "原理・因果",
    question_text: "胚中心における体細胞高頻度変異（SHM）と親和性成熟の関係として正しいものはどれか。",
    choices: ["SHM により抗体可変区に変異が導入され、高親和性 B 細胞が選択される", "SHM は T 細胞受容体にのみ起こる", "親和性成熟は抗体の定常区のみを変化させる", "SHM はミトコンドリア DNA で起こる"],
    correct_choice_index: 0,
    short_explanation: "AICDA による SHM で可変区に変異、胚中心のダークゾーンで親和性選択。",
    detailed_explanation: "活性化誘導性シチジンデアミナーゼ（AID）が Ig 遺伝子に変異を導入。ライトゾーンで抗原提示細胞との相互作用により高親和性クローンが優位に増殖。",
    learning_objective: "SHM と親和性成熟の機序を統合して説明できる",
    common_misconception: "抗体親和性は初回応答で最終決定されると考える",
    distractor_rationales: ["正解。SHM と親和性成熟の核心。", "不正解。B 細胞の Ig 遺伝子が主な標的。", "不正解。可変区が変化。", "不正解。核ゲノムの Ig 遺伝子。"],
    basic_terms: "SHM：抗体遺伝子の体細胞高頻度変異、親和性成熟：抗体親和性の段階的向上"
  }),
  48: q({
    domain: "生物", subdomain: "神経科学", difficulty_initial: 900, cognitive_type: "基本的な適用",
    question_text: "スパイクタイミング依存性可塑性（STDP）の典型的な規則として正しいものはどれか。",
    choices: ["シナプス前がシナプス後より先に発火すると LTP、逆順で LTD", "発火順序は可塑性に無関係である", "すべてのシナプスで LTD のみが起こる", "STDP はグリア細胞にのみ適用される"],
    correct_choice_index: 0,
    short_explanation: "STDP は発火タイミングの因果関係に基づきシナプス強度を調整する。",
    detailed_explanation: "シナプス前→後の順序（pre 先行）で LTP、後→前（post 先行）で LTD が典型的。Hebb 学習の時間的精密版。",
    learning_objective: "STDP の規則を神経回路の学習モデルに適用できる",
    common_misconception: "シナプス可塑性は発火頻度のみに依存すると考える",
    distractor_rationales: ["正解。STDP の標準的規則。", "不正解。タイミングが本質。", "不正解。LTP も起こる。", "不正解。ニューロン間シナプスで観察。"],
    basic_terms: "STDP：スパイクタイミング依存性可塑性、LTP/LTD：長期増強/長期抑制"
  }),
  49: q({
    domain: "生物", subdomain: "細胞生物学", difficulty_initial: 900, cognitive_type: "比較・分類",
    question_text: "オートファジー、プロテアソーム、およびリソソーム経路の比較として正しいものはどれか。",
    choices: ["プロテアソームは主にユビキチン標識された可溶性タンパク質を分解する", "オートファジーは可溶性タンパク質のみを対象とする", "リソソームは細胞質に存在し膜を持たない", "3経路は基質特異性が完全に同一である"],
    correct_choice_index: 0,
    short_explanation: "ユビキチン-プロテアソーム系は可溶性・短寿命タンパク質、オートファジーは大型構造物・オルガネラ。",
    detailed_explanation: "26S プロテアソームは polyubiquitin 標識タンパク質を分解。オートファジーはオルガネラ・凝集体をリソソームへ。経路は補完的。",
    learning_objective: "タンパク質分解経路の基質特異性を比較できる",
    common_misconception: "タンパク質分解はプロテアソームのみだと考える",
    distractor_rationales: ["正解。プロテアソームの特徴。", "不正解。オートファジーは大型構造も対象。", "不正解。リソソームは膜性小器官。", "不正解。基質特異性は異なる。"],
    basic_terms: "プロテアソーム：ATP 依存性プロテアーゼ複合体、ユビキチン：タンパク質分解の標識"
  }),
  50: q({
    domain: "生物", subdomain: "遺伝学", difficulty_initial: 900, cognitive_type: "誤解・境界",
    question_text: "X 染色体不活化（ライオンの仮説）について、誤っている説明はどれか。",
    choices: ["雌の体細胞で一方の X が転写不活化される", "不活化は Xist RNA により媒介される", "不活化された X は常に父由来である", "不活化は発生早期に起こりモザイク表現型を生む"],
    correct_choice_index: 2,
    short_explanation: "不活化される X は父由来・母由来のいずれもなりうる（ランダム X 不活化）。",
    detailed_explanation: "哺乳類の一般的な X 不活化はランダムで、各細胞で父または母 X のいずれかが Xist により不活化。三毛猫の毛色模様が典型例。",
    learning_objective: "X 不活化の機序と例外・境界を説明できる",
    common_misconception: "不活化 X は常に特定の親由来だと考える",
    distractor_rationales: ["不正解。正しい説明。", "不正解。正しい説明。", "正解。ランダム不活化が一般的。", "不正解。正しい説明。"],
    basic_terms: "Xist：X 不活化を媒介する長鎖非コード RNA、モザイク：細胞ごとに異なる X が活性"
  }),
};

// Build final array from blueprint, balance answer positions
const answerTargets = [0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1,2,3,0,1];
const questions = blueprint.map((slot, i) => {
  const item = QUESTIONS[slot.slot];
  if (!item) throw new Error(`Missing question for slot ${slot.slot}`);
  if (item.difficulty_initial !== slot.level) throw new Error(`Slot ${slot.slot} level mismatch`);
  if (item.subdomain !== slot.subdomain) throw new Error(`Slot ${slot.slot} subdomain mismatch: ${item.subdomain} vs ${slot.subdomain}`);
  if (item.cognitive_type !== slot.cognitive_type) throw new Error(`Slot ${slot.slot} cognitive_type mismatch`);
  return balance(item, answerTargets[i]);
});

writeFileSync(OUT, JSON.stringify(questions, null, 2) + "\n", "utf8");
console.log(`Wrote ${questions.length} questions to ${OUT}`);

// Level distribution check
const dist = {};
for (const q of questions) {
  dist[q.difficulty_initial] = (dist[q.difficulty_initial] || 0) + 1;
}
console.log("Level distribution:", dist);
