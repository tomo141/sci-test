#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE = "全分野科学検定 バッチ50（レベル均等）";
const OUT = join(process.cwd(), "scripts/batch50-generated/地学.json");

function q(fields, targetIndex) {
  const item = {
    currentness_type: "evergreen",
    expires_at: null,
    source_url: "",
    source_note: SOURCE,
    domain: "地学",
    difficulty_continuous: fields.difficulty_initial,
    tags: ["地学", fields.subdomain, "batch50", `L${fields.difficulty_initial}`],
    ...fields
  };
  const cur = item.correct_choice_index;
  if (targetIndex !== undefined && cur !== targetIndex) {
    const shift = (cur - targetIndex + 4) % 4;
    const rotate = (arr) => [...arr.slice(shift), ...arr.slice(0, shift)];
    item.choices = rotate(item.choices);
    item.distractor_rationales = rotate(item.distractor_rationales);
    item.correct_choice_index = targetIndex;
  }
  return item;
}

const raw = [
  // slot 1 L100 地質 用語・定義
  {
    subdomain: "地質", difficulty_initial: 100, cognitive_type: "用語・定義",
    question_text: "マグマが冷えて固まってできた岩石を総称して何というか。",
    choices: ["火成岩", "堆積岩", "変成岩", "礫岩"],
    correct_choice_index: 0,
    short_explanation: "マグマ起源の岩石は火成岩に分類される。",
    detailed_explanation: "岩石は火成岩・堆積岩・変成岩の三大類に分類される。火成岩はマグマが冷却固化したもので、深成岩（花崗岩など）と火山岩（玄武岩など）がある。堆積岩は堆積物が固まったもの、変成岩は既存岩石が変成したものである。",
    learning_objective: "三大岩石の定義と代表例を区別できる",
    common_misconception: "礫岩という名称から火成岩と混同しやすいが、礫岩は堆積岩である",
    distractor_rationales: ["正解。マグマ起源の岩石。", "不正解。堆積物が固まった岩石。", "不正解。変成作用を受けた岩石。", "不正解。礫が固まった堆積岩。"],
    basic_terms: "火成岩：マグマ起源の岩石、堆積岩：堆積物が固まった岩石、変成岩：変成作用を受けた岩石"
  },
  // slot 2 L100 気象 原理・因果
  {
    subdomain: "気象", difficulty_initial: 100, cognitive_type: "原理・因果",
    question_text: "地面に降った雨が再び空に戻る主な過程はどれか。",
    choices: ["蒸発", "凝固", "昇華", "融解"],
    correct_choice_index: 0,
    short_explanation: "水が液体から気体へ変わる蒸発が主な過程である。",
    detailed_explanation: "水循環では、太陽エネルギーにより海面や地表の水が蒸発し水蒸気となる。水蒸気は上昇・冷却して雲を形成し、降水として再び地表に戻る。凝固は液体から固体、昇華は固体から気体、融解は固体から液体への変化である。",
    learning_objective: "水循環の基本過程を説明できる",
    common_misconception: "雲が直接雨になると考え、蒸発の役割を見落としやすい",
    distractor_rationales: ["正解。液体から気体への相変化。", "不正解。液体から固体への変化。", "不正解。固体から気体への変化。", "不正解。固体から液体への変化。"],
    basic_terms: "蒸発：液体が気体になる現象、水循環：水が地表・大気・海洋を循環する過程"
  },
  // slot 3 L100 海洋 基本的な適用
  {
    subdomain: "海洋", difficulty_initial: 100, cognitive_type: "基本的な適用",
    question_text: "海水がしょっぱい主な理由として最も適切なものはどれか。",
    choices: ["塩化ナトリウムなどの塩分が溶けているため", "海の深さが深いため", "太陽光が強いため", "魚が塩を作るため"],
    correct_choice_index: 0,
    short_explanation: "海水には主に塩化ナトリウムなどのイオンが溶けている。",
    detailed_explanation: "海水の塩分は主に陸上の岩石風化により河川を通じて運ばれた塩類が蓄積した結果である。塩化ナトリウムが最も多く、マグネシウムや硫酸塩なども含まれる。海の深さや太陽光の強さは塩味の直接原因ではない。",
    learning_objective: "海水の塩分の主成分と起源を理解する",
    common_misconception: "海が深いから塩辛いと誤解する",
    distractor_rationales: ["正解。溶解した塩類が主因。", "不正解。深さと塩分濃度は直接関係しない。", "不正解。太陽光は塩分の直接原因ではない。", "不正解。生物が塩分の主因ではない。"],
    basic_terms: "塩化ナトリウム：海水の主成分、塩分濃度：海水1000g中の塩分量"
  },
  // slot 4 L100 天文 比較・分類
  {
    subdomain: "天文", difficulty_initial: 100, cognitive_type: "比較・分類",
    question_text: "太陽系の天体のうち、自ら光を発する天体はどれか。",
    choices: ["太陽", "月", "地球", "火星"],
    correct_choice_index: 0,
    short_explanation: "恒星である太陽だけが核融合により自ら光を発する。",
    detailed_explanation: "太陽は恒星であり、中心部での水素核融合によりエネルギーを発生する。月・地球・火星は惑星や衛星であり、太陽の光を反射して見える。惑星は恒星の周りを公転する天体である。",
    learning_objective: "恒星と惑星の違いを区別できる",
    common_misconception: "月も光っているように見えるため恒星と混同しやすい",
    distractor_rationales: ["正解。核融合で自ら光る恒星。", "不正解。太陽の光を反射する衛星。", "不正解。太陽の光を反射する惑星。", "不正解。太陽の光を反射する惑星。"],
    basic_terms: "恒星：自ら光る天体、惑星：恒星の周りを公転する天体"
  },
  // slot 5 L100 地震 誤解・境界
  {
    subdomain: "地震", difficulty_initial: 100, cognitive_type: "誤解・境界",
    question_text: "地震の「マグニチュード」と「震度」の関係として最も適切なものはどれか。",
    choices: ["同じ地震でも観測地点によって震度は異なりうる", "震度は常にマグニチュードと同じ数値になる", "マグニチュードは観測地点ごとに変わる", "震度は震源の深さだけで決まる"],
    correct_choice_index: 0,
    short_explanation: "マグニチュードは地震の大きさ、震度は各地の揺れの強さを表す。",
    detailed_explanation: "マグニチュードは地震そのもののエネルギー規模を表す尺度で、一つの地震に対してほぼ一定である。震度は各地の揺れの強さを表し、震源距離・地盤・建物などにより地点ごとに異なる。同じ地震でも近い場所ほど一般に震度は大きくなる。",
    learning_objective: "マグニチュードと震度の定義の違いを説明できる",
    common_misconception: "マグニチュードと震度を同じものと混同する",
    distractor_rationales: ["正解。震度は地点依存、マグニチュードは地震規模。", "不正解。両者は異なる尺度。", "不正解。マグニチュードは地震ごとにほぼ一定。", "不正解。震度は距離・地盤など複数要因で決まる。"],
    basic_terms: "マグニチュード：地震のエネルギー規模、震度：地点における揺れの強さ"
  },
  // slot 6 L100 地球化学 用語・定義
  {
    subdomain: "地球化学", difficulty_initial: 100, cognitive_type: "用語・定義",
    question_text: "地球の大気を構成する気体のうち、体積比で最も多いものはどれか。",
    choices: ["酸素", "二酸化炭素", "窒素", "アルゴン"],
    correct_choice_index: 2,
    short_explanation: "大気の約78%は窒素、約21%は酸素である。",
    detailed_explanation: "乾燥大気の組成は窒素約78%、酸素約21%、アルゴン約0.9%、二酸化炭素約0.04%（変動あり）が主である。生物活動や工業活動により二酸化炭素は増加傾向にあるが、依然として窒素が最多である。",
    learning_objective: "大気の主要組成ガスとその割合を述べられる",
    common_misconception: "呼吸に重要な酸素が最多だと誤解しやすい",
    distractor_rationales: ["不正解。約21%で2番目に多い。", "不正解。微量成分（変動あり）。", "正解。約78%で最多。", "不正解。約0.9%の微量成分。"],
    basic_terms: "窒素：大気の主成分、乾燥大気：水蒸気を除いた大気"
  },
  // slot 7 L200 地球物理学 原理・因果
  {
    subdomain: "地球物理学", difficulty_initial: 200, cognitive_type: "原理・因果",
    question_text: "地震観測で、同じ震源から発生した波のうち、通常いちばん早く観測点に到達するのはどれか。",
    choices: ["P波", "S波", "レイリー波", "愛波"],
    correct_choice_index: 0,
    short_explanation: "P波（縦波）は伝播速度が最も速く最初に到達する。",
    detailed_explanation: "P波（Primary wave）は体積変化を伴う縦波で、固体・液体・気体を通る。S波（Secondary wave）は横波でP波より遅い。レイリー波・愛波は表面波でさらに遅く到達する。P波とS波の到達時間差から震源距離を求められる。",
    learning_objective: "P波・S波・表面波の到達順序と性質を区別できる",
    common_misconception: "揺れが大きい表面波が最初に来ると誤解する",
    distractor_rationales: ["正解。最も速い縦波。", "不正解。P波より遅い横波。", "不正解。表面を伝わる遅い波。", "不正解。表面を伝わる遅い波。"],
    basic_terms: "P波：縦方向に伝わる地震波、S波：横方向に伝わる剪断波"
  },
  // slot 8 L200 古気候 基本的な適用
  {
    subdomain: "古気候", difficulty_initial: 200, cognitive_type: "基本的な適用",
    question_text: "過去の気候が寒冷だったことを示す代表的な地質的証拠はどれか。",
    choices: ["氷河による擦痕やモレーンの存在", "サンゴ礁の広がり", "乾燥した砂漠の拡大", "熱帯雨林の化石のみ"],
    correct_choice_index: 0,
    short_explanation: "氷河活動の痕跡は寒冷期（氷期）の直接的証拠となる。",
    detailed_explanation: "氷河は氷河期に形成され、基岩に擦痕を残し、運搬した土砂をモレーンとして堆積する。これらは過去の寒冷気候を示す。サンゴ礁や熱帯雨林化石は温暖な環境を示す。砂漠拡大は乾燥化の証拠であり寒冷の直接証拠ではない。",
    learning_objective: "氷期の地質学的証拠を挙げられる",
    common_misconception: "寒冷期の証拠として海面上昇を挙げる（実際は氷期に海水面は低下）",
    distractor_rationales: ["正解。氷河活動の痕跡は寒冷期の証拠。", "不正解。温暖な浅海環境の証拠。", "不正解。乾燥化の証拠。", "不正解。温暖環境の証拠。"],
    basic_terms: "氷期：大規模な氷河が発達した寒冷期、モレーン：氷河が運搬・堆積した土砂"
  },
  // slot 9 L200 鉱物 比較・分類
  {
    subdomain: "鉱物", difficulty_initial: 200, cognitive_type: "比較・分類",
    question_text: "モース硬度計で、一般的な鉱物のなかで最も硬度が高いものはどれか。",
    choices: ["方解石", "石英", "金剛石", "石膏"],
    correct_choice_index: 2,
    short_explanation: "金剛石はモース硬度10で最も硬い。",
    detailed_explanation: "モース硬度は1（最軟）から10（最硬）の相対尺度である。石膏は2、方解石は3、石英は7、金剛石は10である。金剛石は炭素の結晶で、工業用途にも用いられる。",
    learning_objective: "モース硬度の代表鉱物を比較できる",
    common_misconception: "石英が最硬だと考えがちだが、金剛石が最硬である",
    distractor_rationales: ["不正解。硬度3。", "不正解。硬度7。", "正解。硬度10で最硬。", "不正解。硬度2。"],
    basic_terms: "モース硬度：鉱物の硬度を比較する相対尺度、金剛石：炭素の結晶（硬度10）"
  },
  // slot 10 L200 プレート 誤解・境界
  {
    subdomain: "プレート", difficulty_initial: 200, cognitive_type: "誤解・境界",
    question_text: "プレートテクトニクスにおいて、ホットスポット火山の位置として最も適切な説明はどれか。",
    choices: ["プレート内部にあり、プレート運動に伴い火山列を形成しうる", "常にプレートの収束境界にのみ存在する", "プレートが発散する境界にのみ存在する", "プレート境界とは無関係に毎年同じ場所だけに現れる"],
    correct_choice_index: 0,
    short_explanation: "ホットスポットはマントルプルーム下のプレート内部火山である。",
    detailed_explanation: "ホットスポット（例：ハワイ、イエローストーン）はプレート内部のマントルプルーム上に位置する。プレートが移動すると、古い火山が消火し新しい火山が形成され、年齢が異なる火山列（ハワイ・皇帝海山列）ができる。プレート境界火山とは機構が異なる。",
    learning_objective: "ホットスポットとプレート境界火山の違いを説明できる",
    common_misconception: "すべての火山はプレート境界で起きると誤解する",
    distractor_rationales: ["正解。プレート内部の固定熱源下で火山列を形成。", "不正解。収束境界の火山とは機構が異なる。", "不正解。発散境界とは別の機構。", "不正解。プレートは移動するため位置関係が変化する。"],
    basic_terms: "ホットスポット：マントルプルーム上の火山活動、プレート境界：プレート同士の接する境界"
  },
  // slot 11 L200 地質 用語・定義
  {
    subdomain: "地質", difficulty_initial: 200, cognitive_type: "用語・定義",
    question_text: "古生物の化石が最も多く見つかる岩石の種類はどれか。",
    choices: ["火成岩", "堆積岩", "変成岩", "隕石"],
    correct_choice_index: 1,
    short_explanation: "化石は堆積岩中に保存されやすい。",
    detailed_explanation: "堆積岩は泥・砂などが堆積・固結した岩石で、生物遺体や痕跡が埋もれて化石化しやすい。火成岩は高温で生物遺体は保存されにくい。変成岩は変成作用で化石が破壊されやすい。",
    learning_objective: "化石の保存環境と岩石種の関係を理解する",
    common_misconception: "すべての岩石に化石があると考える",
    distractor_rationales: ["不正解。高温環境で化石保存に不向き。", "正解。堆積環境で化石が保存される。", "不正解。変成作用で化石が破壊されやすい。", "不正解。宇宙起源の岩石。"],
    basic_terms: "化石：過去の生物の遺体・痕跡、堆積岩：堆積物が固まった岩石"
  },
  // slot 12 L200 気象 原理・因果
  {
    subdomain: "気象", difficulty_initial: 200, cognitive_type: "原理・因果",
    question_text: "北半球で低気圧の中心付近を吹く風の向きとして最も適切なものはどれか。",
    choices: ["中心に向かいながら反時計回りに吹く", "中心から外へ時計回りに吹く", "常に東から西へ吹く", "常に西から東へ吹く"],
    correct_choice_index: 0,
    short_explanation: "北半球の低気圧では風は中心へ向かい反時計回りに吹く。",
    detailed_explanation: "気圧勾配力により風は低気圧へ向かうが、コリオリ力により北半球では右に偏る。その結果、低気圧周辺では反時計回り（サイクロン）の循環となる。高気圧では外へ向かい時計回りに吹く。",
    learning_objective: "北半球における高低気圧周辺の風の向きを説明できる",
    common_misconception: "風は単純に気圧の低い方向へ直進すると考える",
    distractor_rationales: ["正解。北半球低気圧の典型的循環。", "不正解。高気圧の風の向き。", "不正解。偏西風など大規模流とは別の問い。", "不正解。偏西風の方向と混同。"],
    basic_terms: "低気圧：周囲より気圧が低い領域、コリオリ力：自転による見かけの偏向力"
  },
  // slot 13 L300 海洋 基本的な適用
  {
    subdomain: "海洋", difficulty_initial: 300, cognitive_type: "基本的な適用",
    question_text: "日本南岸付近を流れる黒潮がもたらす気候への影響として最も適切なものはどれか。",
    choices: ["沿岸部を温暖・多湿にしやすい", "沿岸部を寒冷・乾燥にしやすい", "海面上昇を直接止める", "潮汐の周期を短くする"],
    correct_choice_index: 0,
    short_explanation: "黒潮は高温の海流で、沿岸に暖かく湿った空気を運ぶ。",
    detailed_explanation: "黒潮（日本海流）は北赤道海流の続きで、表面水温が高い。これが日本南岸・太平洋側に暖かい湿った空気をもたらし、温暖な気候に寄与する。親潮は逆に寒流で、北海道東岸などを冷やす。",
    learning_objective: "黒潮と親潮の気候への影響を説明できる",
    common_misconception: "海流は気候に影響しないと考える",
    distractor_rationales: ["正解。暖かい海流が温暖・多湿化に寄与。", "不正解。寒流（親潮）の影響。", "不正解。海流は海面上昇を直接制御しない。", "不正解。潮汐は月・太陽の引力で決まる。"],
    basic_terms: "黒潮：太平洋の暖かい海流、親潮：オホーツク海由来の寒流"
  },
  // slot 14 L300 天文 比較・分類
  {
    subdomain: "天文", difficulty_initial: 300, cognitive_type: "比較・分類",
    question_text: "太陽系の惑星を内惑星と外惑星に分ける際の主な違いとして最も適切なものはどれか。",
    choices: ["内惑星は岩石質で小型、外惑星はガス・氷巨星で大型", "内惑星はすべて衛星を持たない", "外惑星はすべて太陽より近い軌道にある", "内惑星はすべて液体でできている"],
    correct_choice_index: 0,
    short_explanation: "内惑星（水星〜火星）は岩石質、外惑星（木星〜海王星）は巨大ガス・氷巨星。",
    detailed_explanation: "内太陽系惑星（水星・金星・地球・火星）はシリケート岩石主体で比較的小さい。外太陽系惑星（木星・土星はガス巨星、天王星・海王星は氷巨星）は水素・ヘリウムや氷成分を多く含み質量・サイズが大きい。",
    learning_objective: "内惑星と外惑星の組成・サイズの違いを説明できる",
    common_misconception: "すべての惑星が同じ組成だと考える",
    distractor_rationales: ["正解。組成とサイズの典型的違い。", "不正解。火星には衛星がある。", "不正解。外惑星は小惑星帯より外側。", "不正解。内惑星は固体岩石質。"],
    basic_terms: "内惑星：火星より内側の岩石質惑星、外惑星：小惑星帯より外側の巨大惑星"
  },
  // slot 15 L300 地震 誤解・境界
  {
    subdomain: "地震", difficulty_initial: 300, cognitive_type: "誤解・境界",
    question_text: "地震における「震源」と「震央」の関係として最も適切なものはどれか。",
    choices: ["震央は震源の真上の地表の点である", "震源は震央の真上の地表の点である", "震源と震央は常に同じ位置である", "震央は震源より常に深い"],
    correct_choice_index: 0,
    short_explanation: "震源は地震が発生した地下の点、震央はその真上の地表。",
    detailed_explanation: "震源（フォーカス）は断層破壊が始まった地下の点である。震央（エピセンター）は震源の真上に対応する地表上の点である。震源の深さが深いほど、地表での揺れは一般に弱まる。",
    learning_objective: "震源・震央・震源深さの定義を正確に述べられる",
    common_misconception: "震源と震央を同じものと混同する",
    distractor_rationales: ["正解。震央は震源の地表投影点。", "不正解。関係が逆。", "不正解。震源は地下にある。", "不正解。震央は地表、震源は地下。"],
    basic_terms: "震源：地震が発生した地下の点、震央：震源の真上の地表の点"
  },
  // slot 16 L300 地球化学 用語・定義
  {
    subdomain: "地球化学", difficulty_initial: 300, cognitive_type: "用語・定義",
    question_text: "炭素が地球表層で循環する主要な貯留庫（リザーバー）に含まれるものはどれか。",
    choices: ["大気・海洋・岩石圏", "地核のみ", "外宇宙空間のみ", "生物圏のみ"],
    correct_choice_index: 0,
    short_explanation: "炭素は大気（CO₂）、海洋、岩石・土壤、生物圏などに貯留する。",
    detailed_explanation: "地球表層炭素循環の主要リザーバーは大気中CO₂、溶解無機炭素を含む海洋、石灰岩などの岩石圏、有機物としての生物圏である。これらの間で火山放出・風化・光合成・呼吸などにより炭素が交換される。",
    learning_objective: "炭素循環の主要リザーバーを挙げられる",
    common_misconception: "炭素は大気にのみ存在すると考える",
    distractor_rationales: ["正解。表層炭素循環の主要貯留庫。", "不正解。地核は表層循環の主要庫ではない。", "不正解。宇宙は地球炭素循環の庫ではない。", "不正解。生物圏のみではない。"],
    basic_terms: "炭素循環：炭素が各貯留庫間を移動する過程、リザーバー：物質の貯留場"
  },
  // slot 17 L300 地球物理学 原理・因果
  {
    subdomain: "地球物理学", difficulty_initial: 300, cognitive_type: "原理・因果",
    question_text: "地球の磁場が主に生成されると考えられる場所と機構はどれか。",
    choices: ["外核の対流によるダイナモ効果", "地殻中の磁性体の永久磁化のみ", "内核の固体結晶の摩擦のみ", "大気中のイオン層の電流のみ"],
    correct_choice_index: 0,
    short_explanation: "外核の溶融鉄の対流がダイナモとして磁場を生成する。",
    detailed_explanation: "地球磁場は主に外核（液体鉄・ニッケル合金）の対流とコリオリ力によるダイナモ効果で生成されると考えられる。地殻の残留磁化は局地磁場異常の原因にはなるが、地球全体の主磁場の源ではない。",
    learning_objective: "地球磁場のダイナモ起源を説明できる",
    common_misconception: "地殻の磁石だけで地球磁場が説明できると考える",
    distractor_rationales: ["正解。外核ダイナモが主起源。", "不正解。地殻磁化は主磁場の源ではない。", "不正解。内核単独では説明できない。", "不正解。大気は主磁場の源ではない。"],
    basic_terms: "ダイナモ効果：対流と磁場の相互作用で磁場を増幅、外核：液体鉄主体の層"
  },
  // slot 18 L300 古気候 基本的な適用
  {
    subdomain: "古気候", difficulty_initial: 300, cognitive_type: "基本的な適用",
    question_text: "沼や湖の堆積物中の花粉化石を分析する主な目的として最も適切なものはどれか。",
    choices: ["当時の植生と気候を復元する", "地震の震源深さを測定する", "鉱物の硬度を決定する", "プレートの移動速度を直接測る"],
    correct_choice_index: 0,
    short_explanation: "花粉は植物種を示し、植生から気候を推定できる。",
    detailed_explanation: "花粉分析（パリノロジー）では、各植物種が好む気候条件が知られているため、堆積層中の花粉組成の変化から過去の植生・気温・降水量などを復元できる。年層と組み合わせれば時間変化も追える。",
    learning_objective: "花粉化石による古気候・古環境復元を説明できる",
    common_misconception: "化石は年代決定にしか使えないと考える",
    distractor_rationales: ["正解。植生指標として気候復元に用いる。", "不正解。地震学の手法ではない。", "不正解。鉱物学の分析。", "不正解。プレート速度はGPS等で測定。"],
    basic_terms: "花粉分析：花粉化石から古環境を復元、パリノロジー：花粉学"
  },
  // slot 19 L400 鉱物 比較・分類
  {
    subdomain: "鉱物", difficulty_initial: 400, cognitive_type: "比較・分類",
    question_text: "結晶系の分類において、3つの結晶軸の長さがすべて等しく、互いに直角をなす晶系はどれか。",
    choices: ["等軸晶系", "単斜晶系", "三斜晶系", "六方晶系"],
    correct_choice_index: 0,
    short_explanation: "等軸晶系は a=b=c かつ α=β=γ=90° である。",
    detailed_explanation: "等軸晶系（立方晶系）は3軸等長かつ直角。単斜晶系は1軸が他2軸と直角でない。三斜晶系は3軸とも互いに直角でない。六方晶系は4軸記号を用い、a=b≠c、α=β=90°、γ=120°。",
    learning_objective: "主要結晶系の軸長・軸角の特徴を区別できる",
    common_misconception: "六方晶系を等軸晶系と混同する",
    distractor_rationales: ["正解。a=b=c、全軸直角。", "不正解。1軸が斜交。", "不正解。全軸が斜交。", "不正解。a=bだがcが異なり、γ=120°。"],
    basic_terms: "等軸晶系：3軸等長・直角、結晶系：対称性による分類"
  },
  // slot 20 L400 プレート 誤解・境界
  {
    subdomain: "プレート", difficulty_initial: 400, cognitive_type: "誤解・境界",
    question_text: "プレートが互いに離れて新しい海洋プレートが生成される境界はどれか。",
    choices: ["発散境界（拡大境界）", "収束境界", "トランスフォーム境界", "ホットスポット"],
    correct_choice_index: 0,
    short_explanation: "発散境界ではマントル上昇により新しい海洋地殻が形成される。",
    detailed_explanation: "発散境界（例：大西洋中央海嶺）ではプレートが離れ、マントル物質が上昇して玄武岩質の新しい海洋プレートを生成する。収束境界は沈み込み、トランスフォームは横ずれ、ホットスポットはプレート内部の火山活動である。",
    learning_objective: "三類型のプレート境界と地形・現象を対応づけられる",
    common_misconception: "海嶺は沈み込みでできると誤解する",
    distractor_rationales: ["正解。プレート拡大・新規海洋地殻形成。", "不正解。プレート衝突・沈み込み。", "不正解。横断断層による横ずれ。", "不正解。プレート境界ではない。"],
    basic_terms: "発散境界：プレートが離れる境界、大洋中背：海洋プレート生成域"
  },
  // slot 21 L400 地質 用語・定義
  {
    subdomain: "地質", difficulty_initial: 400, cognitive_type: "用語・定義",
    question_text: "地層累重の法則（ステノの法則）の内容として最も適切なものはどれか。",
    choices: ["通常、下の地層ほど堆積年代が古い", "上の地層ほど堆積年代が古い", "地層の厚さは堆積時間に必ず比例する", "すべての地層は同時に形成される"],
    correct_choice_index: 0,
    short_explanation: "逆転がなければ下位地層が先に堆積し年代が古い。",
    detailed_explanation: "ニコラウス・ステノの地層累重の法則は、水平堆積が連続する場合、下の地層が上の地層より先に形成されたという原則である。褶曲・断層で地層逆転が起きれば例外がある。",
    learning_objective: "地層累重の法則と相対年代決定への応用を説明できる",
    common_misconception: "地層逆転がない前提を見落とす",
    distractor_rationales: ["正解。通常条件下の相対年代原則。", "不正解。法則と逆の記述。", "不正解。厚さと時間は必ず比例しない。", "不正解。地層は順次堆積される。"],
    basic_terms: "地層累重の法則：下位ほど古い、相対年代：地層の前後関係による年代"
  },
  // slot 22 L400 気象 原理・因果
  {
    subdomain: "気象", difficulty_initial: 400, cognitive_type: "原理・因果",
    question_text: "北半球で高気圧に向かって吹く風が右に偏れる結果、高気圧周辺の風の向きはどうなるか。",
    choices: ["中心から外へ時計回りに吹く", "中心へ向かい反時計回りに吹く", "常に南から北へ吹く", "常に北から南へ吹く"],
    correct_choice_index: 0,
    short_explanation: "北半球の高気圧では風は外へ向かい時計回り（アンチサイクロン）に吹く。",
    detailed_explanation: "気圧勾配力は高気圧から低気圧へ向かうが、コリオリ力で北半球では右偏する。高気圧周辺では外側へ向かいながら時計回りに循環する。低気圧では反時計回りである。",
    learning_objective: "北半球における高気圧・低気圧の風の循環を説明できる",
    common_misconception: "高低気圧で風の向きが同じだと考える",
    distractor_rationales: ["正解。北半球高気圧の典型的循環。", "不正解。低気圧の循環。", "不正解。単純な南北流ではない。", "不正解。単純な南北流ではない。"],
    basic_terms: "高気圧：周囲より気圧が高い領域、アンチサイクロン：高気圧の時計回り循環"
  },
  // slot 23 L400 海洋 基本的な適用
  {
    subdomain: "海洋", difficulty_initial: 400, cognitive_type: "基本的な適用",
    question_text: "エルニーニョ現象が発生したとき、太平洋赤道域で一般に観測される海面水温の変化はどれか。",
    choices: ["東太平洋で海面水温が上昇する", "東太平洋で海面水温が低下する", "全球の海面水温が一様に低下する", "海面水温に変化はない"],
    correct_choice_index: 0,
    short_explanation: "エルニーニョでは東太平洋の暖水が拡大し、海面水温が上昇する。",
    detailed_explanation: "通常、太平洋では東太平洋（ペルー沖）で湧昇により冷水が上がる。エルニーニョ時は東風が弱まり湧昇が抑制され、暖水が東に拡大して東太平洋の海面水温が上昇する。ラニーニャはその逆である。",
    learning_objective: "エルニーニョ・ラニーニャの海面水温パターンを説明できる",
    common_misconception: "エルニーニョは西太平洋だけが暖まると誤解する",
    distractor_rationales: ["正解。東太平洋の顕著な暖化。", "不正解。ラニーニャや通常年の東太平洋。", "不正解。地域的・非一様な変化。", "不正解。明確な変化がある。"],
    basic_terms: "エルニーニョ：東太平洋の異常暖化、湧昇：深層冷水が上昇する現象"
  },
  // slot 24 L400 天文 比較・分類
  {
    subdomain: "天文", difficulty_initial: 400, cognitive_type: "比較・分類",
    question_text: "恒星のスペクトル型と表面温度の関係として最も適切なものはどれか。",
    choices: ["O型は高温、M型は低温である", "O型は低温、M型は高温である", "スペクトル型と温度は無関係である", "すべての恒星は同じ表面温度である"],
    correct_choice_index: 0,
    short_explanation: "スペクトル型はO→B→A→F→G→K→Mの順に表面温度が低下する。",
    detailed_explanation: "恒星のスペクトル分類は表面温度に対応する。O型（青白・最高温）からM型（赤・最低温）へと温度が下がる。太陽はG型主系列星である。色と温度の関係はウィーンの位移則とも整合する。",
    learning_objective: "恒星のスペクトル型と温度の対応を説明できる",
    common_misconception: "赤い星ほど高温だと誤解する（実際は低温）",
    distractor_rationales: ["正解。O型高温・M型低温。", "不正解。関係が逆。", "不正解。スペクトル型は温度指標。", "不正解。恒星の温度は多様。"],
    basic_terms: "スペクトル型：恒星の分光分類、主系列星：水素燃焼段階の恒星"
  },
  // slot 25 L500 地震 誤解・境界
  {
    subdomain: "地震", difficulty_initial: 500, cognitive_type: "誤解・境界",
    question_text: "地震時の液状化について最も適切な説明はどれか。",
    choices: ["飽和した砂質地盤で地震動により孔隙水圧が上昇し、地盤強度が著しく低下しうる", "すべての地盤で必ず液状化が起こる", "液状化は火山活動でのみ起こる", "液状化は地下深部のマントルで主に起こる"],
    correct_choice_index: 0,
    short_explanation: "飽和砂層では地震動で粒子構造が崩れ、水圧上昇により液体状に振る舞う。",
    detailed_explanation: "液状化は地下水位以下の飽和した粒状地盤（特に砂）が地震動により剪断抵抗が失われ、一時的に液体のように振る舞う現象である。粘土地盤や不飽和地盤では起こりにくい。建物の傾斜・マンホール突出などの被害を招く。",
    learning_objective: "液状化の発生条件と地盤の種類との関係を説明できる",
    common_misconception: "すべての地盤で液状化すると誤解する",
    distractor_rationales: ["正解。飽和砂質地盤の典型的液状化機構。", "不正解。地盤条件に依存する。", "不正解。地震動が主な誘因。", "不正解。表層地盤の現象。"],
    basic_terms: "液状化：飽和地盤の強度急低下、孔隙水圧：地層中の水の圧力"
  },
  // slot 26 L500 地球化学 用語・定義
  {
    subdomain: "地球化学", difficulty_initial: 500, cognitive_type: "用語・定義",
    question_text: "安定同位体のδ¹⁸O値が試料の¹⁸O/¹⁶O比の標準（VSMOW）からの偏差を千分率で表すものである理由として最も適切なものはどれか。",
    choices: ["同位体比の微小差を拡大して比較しやすくするため", "酸素の原子量を直接測定するため", "試料の温度を直接測定するため", "放射性崩壊速度を求めるため"],
    correct_choice_index: 0,
    short_explanation: "δ値は (R_sample/R_std - 1)×1000 で微小な同位体比差を表す。",
    detailed_explanation: "δ¹⁸Oは古気候・岩石成因などで広く用いられる。同位体比の差は通常ごく小さいため、千分率（‰）で表記する。値が大きいほど¹⁸Oが富化している。温度や水源の指標となる。",
    learning_objective: "δ¹⁸Oの定義と用途を説明できる",
    common_misconception: "δ値が酸素濃度そのものだと誤解する",
    distractor_rationales: ["正解。微小差の標準化表記。", "不正解。原子量の直接測定ではない。", "不正解。間接的指標にはなるが直接測定ではない。", "不正解。安定同位体の概念。"],
    basic_terms: "δ¹⁸O：酸素安定同位体比の偏差、VSMOW：国際標準水"
  },
  // slot 27 L500 地球物理学 原理・因果
  {
    subdomain: "地球物理学", difficulty_initial: 500, cognitive_type: "原理・因果",
    question_text: "海洋プレートが大陸プレートの下に沈み込む際、スラブ引き（スラブプル）がプレート運動を駆動しうるとされる主な理由はどれか。",
    choices: ["冷たく密度の高いスラブがマントル中で沈降するため", "大陸プレートが常に軽く浮上するため", "ホットスポットがプレートを押すため", "地球の自転だけでプレートが動くため"],
    correct_choice_index: 0,
    short_explanation: "冷たく重い沈み込み板が重力で引っ張り、プレートを牽引しうる。",
    detailed_explanation: "スラブプルは沈み込み帯で冷たく密度の高い海洋プレートがマントル中へ沈降することで、プレートに引張力を与える駆動機構の一つとされる。リッジプッシュ（大洋中背での押し出し）と併せて議論される。",
    learning_objective: "プレート駆動力の主要仮説を区別できる",
    common_misconception: "プレート運動は大洋中背の押し出しだけで説明できると考える",
    distractor_rationales: ["正解。スラブの負の浮力による牽引。", "不正解。浮力だけでは駆動力の説明にならない。", "不正解。ホットスポットは別機構。", "不正解。コリオリ力はプレート駆動の主因ではない。"],
    basic_terms: "スラブプル：沈み込み板による牽引、リッジプッシュ：中背での押し出し"
  },
  // slot 28 L500 古気候 基本的な適用
  {
    subdomain: "古気候", difficulty_initial: 500, cognitive_type: "基本的な適用",
    question_text: "更新世の氷期・間氷期の繰り返しを示す深海コアのδ¹⁸O記録が主に反映している要因として最も適切なものはどれか。",
    choices: ["大陸氷床量の変化に伴う海水の同位体組成変化", "海底火山の噴火頻度のみ", "太陽フレアの周期のみ", "月の公転周期の変化のみ"],
    correct_choice_index: 0,
    short_explanation: "氷期に¹⁸Oが富化した水が氷床に固定され、海水のδ¹⁸Oが上昇する。",
    detailed_explanation: "有孔虫殻のδ¹⁸Oは海水組成と温度の両方の影響を受けるが、更新世スケールでは氷床拡大・縮小による全球海水の同位体組成変化が主要信号である。これによりミルコビッチサイクルに対応する氷期循環が記録される。",
    learning_objective: "δ¹⁸O記録と氷床変動の関係を説明できる",
    common_misconception: "δ¹⁸Oは温度だけを記録すると誤解する",
    distractor_rationales: ["正解。氷床-海水間の同位体分別。", "不正解。火山は主要信号ではない。", "不正解。太陽フレアは氷期循環の主因ではない。", "不正解。月の公転は無関係。"],
    basic_terms: "間氷期：氷期と氷期の間の温暖期、有孔虫：深海堆積物の微化石"
  },
  // slot 29 L500 鉱物 比較・分類
  {
    subdomain: "鉱物", difficulty_initial: 500, cognitive_type: "比較・分類",
    question_text: "同じ化学組成で結晶構造が異なる鉱物の関係を何というか。",
    choices: ["同質異像（ポリモーフィズム）", "同型（アイソモーフィズム）", "類質同像", "双晶"],
    correct_choice_index: 0,
    short_explanation: "同組成・異構造の関係は同質異像（例：ダイヤモンドと石墨）。",
    detailed_explanation: "同質異像（ポリモーフィズム）は化学組成が同じで結晶構造が異なる鉱物の関係である（例：ダイヤモンド/石墨、方解石/霰石）。同型は異なる組成で同じ構造型。類質同像は組成の置換による連続固溶体。",
    learning_objective: "同質異像・同型・類質同像を区別できる",
    common_misconception: "同型と同質異像を混同する",
    distractor_rationales: ["正解。同組成・異構造。", "不正解。異組成・同構造。", "不正解。イオン置換による組成変化。", "不正解。結晶の規則的連結。"],
    basic_terms: "同質異像：同組成で異なる結晶構造、同型：異組成で同じ構造型"
  },
  // slot 30 L500 プレート 誤解・境界
  {
    subdomain: "プレート", difficulty_initial: 500, cognitive_type: "誤解・境界",
    question_text: "トランスフォーム断層（横ずれ境界）の特徴として最も適切なものはどれか。",
    choices: ["プレートが互いに横方向にずれ、新しいプレートは生成しない", "プレートが離れて新しい海洋地殻ができる", "大洋プレートが沈み込む", "マントルプルームの上に位置する"],
    correct_choice_index: 0,
    short_explanation: "トランスフォーム境界は横断断層によるプレートの横ずれ運動である。",
    detailed_explanation: "トランスフォーム断層（例：サンアンドレアス断層）は発散境界と収束境界をつなぎ、プレート間の相対運動がほぼ水平な横ずれとなる。新規プレート生成や沈み込みは起こらない。",
    learning_objective: "三類型のプレート境界の運動様式を区別できる",
    common_misconception: "すべての断層でプレートが生成されると誤解する",
    distractor_rationales: ["正解。横ずれ運動が特徴。", "不正解。発散境界の特徴。", "不正解。収束境界の特徴。", "不正解。ホットスポットの特徴。"],
    basic_terms: "トランスフォーム境界：横ずれ境界、横断断層：プレート間の横方向断層"
  },
  // slot 31 L600 地質 用語・定義
  {
    subdomain: "地質", difficulty_initial: 600, cognitive_type: "用語・定義",
    question_text: "変成相（metamorphic facies）の定義として最も適切なものはどれか。",
    choices: ["特定のP-T条件下で安定な鉱物組合せの総称", "堆積岩の粒径分類の名称", "火山噴出物の粘度分類", "地震の規模を表す尺度"],
    correct_choice_index: 0,
    short_explanation: "変成相は圧力・温度条件に対応する平衡鉱物組合せで定義される。",
    detailed_explanation: "変成相（例：緑片岩相、角閃岩相、麻粒岩相）は変成作用のP-T条件を示す。各相は特徴的な鉱物組合せ（インデックス鉱物）で識別される。フェイシーズ図上の領域と対応する。",
    learning_objective: "変成相の定義とP-T条件との関係を説明できる",
    common_misconception: "変成相を岩石名と混同する",
    distractor_rationales: ["正解。P-T条件下の鉱物組合せ。", "不正解。堆積岩の分類。", "不正解。火山学の概念。", "不正解。地震学の尺度。"],
    basic_terms: "変成相：P-T条件下の平衡鉱物組合せ、インデックス鉱物：変成度の指標鉱物"
  },
  // slot 32 L600 気象 原理・因果
  {
    subdomain: "気象", difficulty_initial: 600, cognitive_type: "原理・因果",
    question_text: "大気の絶対渦度がほぼ保存する状況で、気流が緯度方向に移動するときに起こる現象として最も適切なものはどれか。",
    choices: ["高緯度へ向かうほど相対渦度が増加しうる", "渦度は常にゼロになる", "風向は常に東西に固定される", "気圧勾配力は消滅する"],
    correct_choice_index: 0,
    short_explanation: "絶対渦度保存により緯度変化で相対渦度が変化する（渦度方程式）。",
    detailed_explanation: "絶対渦度 f + ζ の保存は大気大循環の基礎である。気塊が高緯度（大きな f）へ移動すると相対渦度 ζ が調整され、低気圧・高気圧の形成に関与する。",
    learning_objective: "渦度保存と大気運動の関係を説明できる",
    common_misconception: "コリオリ力だけで渦度が決まると考える",
    distractor_rationales: ["正解。絶対渦度保存の帰結。", "不正解。一般に非ゼロ。", "不正解。南北運動が伴う。", "不正解。勾配力は存在しうる。"],
    basic_terms: "絶対渦度：地球自転と相対渦度の和、相対渦度：流れの回転成分"
  },
  // slot 33 L600 海洋 基本的な適用
  {
    subdomain: "海洋", difficulty_initial: 600, cognitive_type: "基本的な適用",
    question_text: "表層の定常風により海水がエクマン輸送を受ける結果、北半球では風の吹く方向に対して何が起こるか。",
    choices: ["風に対して右90°の方向へ質量輸送が生じる", "風と同じ方向へのみ輸送される", "風に対して左90°の方向へ輸送される", "鉛直方向のみに輸送される"],
    correct_choice_index: 0,
    short_explanation: "北半球ではエクマン輸送は風向きの右90°方向に生じる。",
    detailed_explanation: "エクマン螺旋により表面流は風向きの右45°（北半球）、エクマン輸送（深さ積分）は右90°となる。これが沿岸上昇・下降やスツォーム輸送の基礎となる。",
    learning_objective: "エクマン輸送の方向と北半球での偏りを説明できる",
    common_misconception: "海水は風と同じ方向にだけ流れると考える",
    distractor_rationales: ["正解。北半球のエクマン輸送の方向。", "不正解。コリオリ効果で偏る。", "不正解。南半球の方向。", "不正解。水平輸送が主。"],
    basic_terms: "エクマン輸送：風成流の深さ積分輸送、エクマン螺旋：流速の深さ方向の回転"
  },
  // slot 34 L600 天文 比較・分類
  {
    subdomain: "天文", difficulty_initial: 600, cognitive_type: "比較・分類",
    question_text: "銀河の形態分類で、明るい核と棒状構造を持ち、渦巻き腕が棒から伸びるタイプはどれか。",
    choices: ["棒渦巻銀河（SB）", "楕円銀河（E）", "不規則銀河（Irr）", "球状星団"],
    correct_choice_index: 0,
    short_explanation: "棒渦巻銀河は中心の棒構造と渦巻き腕が特徴である。",
    detailed_explanation: "ハッブル分類では渦巻銀河（S）と棒渦巻銀河（SB）がある。棒構造は銀河の中心で形成され、腕の形成・ガス流入に関与すると考えられる。楕円銀河は滑らかな楕円形、不規則銀河は明確な対称性を持たない。",
    learning_objective: "主要な銀河形態分類を区別できる",
    common_misconception: "すべての渦巻銀河に棒があると考える",
    distractor_rationales: ["正解。棒＋渦巻き腕の形態。", "不正解。楕円形で渦巻き腕なし。", "不正解。不規則な形態。", "不正解。銀河ではなく星団。"],
    basic_terms: "棒渦巻銀河：棒構造を持つ渦巻銀河、ハッブル分類：銀河形態の分類体系"
  },
  // slot 35 L600 地震 誤解・境界
  {
    subdomain: "地震", difficulty_initial: 600, cognitive_type: "誤解・境界",
    question_text: "同じ震源・同じマグニチュードの地震でも、観測地点の震度が異なりうる主な要因として最も適切なものはどれか。",
    choices: ["震源距離・地盤条件・建物の構造などの地点依存要因", "マグニチュードが地点ごとに変わるため", "震源の経度が異なるため", "地震の発生時刻が地点ごとに異なるため"],
    correct_choice_index: 0,
    short_explanation: "震度は地点の揺れの強さで、距離・地盤・構造物により変わる。",
    detailed_explanation: "マグニチュードは地震のエネルギー規模で一つの値。震度は震源距離（減衰）、地盤の増幅（軟弱地盤・液状化）、地形効果、建物の共振などで地点ごとに大きく異なる。",
    learning_objective: "震度の地点依存性とその要因を説明できる",
    common_misconception: "マグニチュードが大きければ全地点で同じ震度だと考える",
    distractor_rationales: ["正解。震度の地点依存要因。", "不正解。マグニチュードはほぼ一定。", "不正解。震源は一つ。", "不正解。発生時刻は同一。"],
    basic_terms: "震源距離：震源から観測点までの距離、地盤増幅：軟弱地盤による揺れの増大"
  },
  // slot 36 L700 地球化学 用語・定義
  {
    subdomain: "地球化学", difficulty_initial: 700, cognitive_type: "用語・定義",
    question_text: "Sm-Nd同位体体系でεNd値が示すものとして最も適切なものはどれか。",
    choices: ["試料の¹⁴³Nd/¹⁴⁴Nd比がチョンドライト比からの偏差", "試料の放射性年代のみ", "試料の酸素 fugacity の絶対値", "試料の密度"],
    correct_choice_index: 0,
    short_explanation: "εNdは¹⁴³Nd/¹⁴⁴Nd比のチョンドライト基準からの偏差を拡大表示した指標。",
    detailed_explanation: "Sm-Nd法は放射性年代測定とソース特性のトレーサーに用いられる。εNdはマントル・地殻分化の程度を示し、負の値は地殻成分の混入、正の値はデプロletedマントル由来を示唆する。",
    learning_objective: "Sm-Nd体系とεNdの地球化学的意味を説明できる",
    common_misconception: "εNdを年代の値そのものと混同する",
    distractor_rationales: ["正解。Nd同位体比の標準化偏差。", "不正解。年代は別途計算。", "不正解。酸素 fugacity とは無関係。", "不正解。密度とは無関係。"],
    basic_terms: "εNd：Nd同位体比のチョンドライト偏差、Sm-Nd法：放射性年代・トレーサー法"
  },
  // slot 37 L700 地球物理学 原理・因果
  {
    subdomain: "地球物理学", difficulty_initial: 700, cognitive_type: "原理・因果",
    question_text: "地磁気の古地磁気記録から地磁気反転が繰り返し起きていることが知られているが、反転の主な発生場所として最も妥当なのはどれか。",
    choices: ["外核のダイナモ過程", "地殻の磁性鉱物のみ", "大気のイオン層", "内核の固体結晶のみ"],
    correct_choice_index: 0,
    short_explanation: "地磁気反転は外核ダイナモの不安定性により生じると考えられる。",
    detailed_explanation: "古地磁気は岩石の熱残留磁化などから過去の磁場極性を復元する。極性反転は外核ダイナモのカオス的挙動により断続的に起き、平均間隔は数十万年程度である。地殻磁化は記録媒体であり発生源ではない。",
    learning_objective: "地磁気反転と外核ダイナモの関係を説明できる",
    common_misconception: "地殻の磁石が反転の原因だと考える",
    distractor_rationales: ["正解。主磁場の発生源。", "不正解。記録媒体であって発生源ではない。", "不正解。大気は主磁場の源ではない。", "不正解。内核単独では説明困難。"],
    basic_terms: "地磁気反転：磁場の南北逆転、古地磁気：過去の磁場の復元"
  },
  // slot 38 L700 古気候 基本的な適用
  {
    subdomain: "古気候", difficulty_initial: 700, cognitive_type: "基本的な適用",
    question_text: "深海コアの酸素同位体記録で識別される海洋同位体段階（MIS）の番号付けが示すものとして最も適切なものはどれか。",
    choices: ["氷期・間氷期の冷暖サイクルを時系列で識別する段階", "火山噴火の回数のみ", "プレート移動の速度段階", "潮汐の振幅段階"],
    correct_choice_index: 0,
    short_explanation: "MIS（Marine Isotope Stage）はδ¹⁸O記録に基づく氷期循環の標準時系列。",
    detailed_explanation: "MIS番号は奇数が間氷期（温暖）、偶数が氷期（寒冷）に対応する（例：MIS 5eは最終間氷期、MIS 2は最終氷期最大期）。国際的な古気候比較の基準として広く用いられる。",
    learning_objective: "MISの定義と氷期循環への応用を説明できる",
    common_misconception: "MIS番号が大きいほど新しいと誤解する（番号体系は複雑）",
    distractor_rationales: ["正解。δ¹⁸Oに基づく氷期循環段階。", "不正解。火山活動の段階ではない。", "不正解。プレート運動の段階ではない。", "不正解。潮汐の段階ではない。"],
    basic_terms: "MIS：海洋同位体段階、δ¹⁸O：酸素安定同位体比の偏差"
  },
  // slot 39 L700 鉱物 比較・分類
  {
    subdomain: "鉱物", difficulty_initial: 700, cognitive_type: "比較・分類",
    question_text: "双晶（ツイン）のうち、接触面が鉱物の特定の結晶面（ラツョー面）に平行な規則的な双晶を何というか。",
    choices: ["接触双晶", "貫通双晶", "聚片双晶", "不整双晶"],
    correct_choice_index: 0,
    short_explanation: "接触双晶はラツョー面（ツイン面）に沿って結晶が規則的に連結する。",
    detailed_explanation: "接触双晶はツイン面で接する双晶（例：正長石のカールバスド双晶）。貫通双晶は一方の結晶が他方を貫く（十字石）。聚片双晶は多数の薄片が平行に連なる（斜長石）。",
    learning_objective: "主要な双晶の類型を区別できる",
    common_misconception: "すべての双晶が同じ形成機構だと考える",
    distractor_rationales: ["正解。ラツョー面に沿う接触双晶。", "不正解。一方が他方を貫通。", "不正解。多数薄片の平行連結。", "不正解。規則性のない双晶。"],
    basic_terms: "接触双晶：ツイン面で接する双晶、ラツョー面：双晶の接触面"
  },
  // slot 40 L700 プレート 誤解・境界
  {
    subdomain: "プレート", difficulty_initial: 700, cognitive_type: "誤解・境界",
    question_text: "バックアーク盆地が形成される典型的なプレート構造として最も適切なものはどれか。",
    choices: ["沈み込み帯の弧の内側でプレートが引き伸ばされる構造", "大陸内部のホットスポットのみ", "大洋中背の発散境界のみ", "トランスフォーム断層のみ"],
    correct_choice_index: 0,
    short_explanation: "バックアーク盆地は沈み込み帯の火山弧の内側で拡大する盆地である。",
    detailed_explanation: "日本海などのバックアーク盆地は、太平洋プレートの沈み込みに伴い弧の後方で引き伸ばし・拡大が起きた結果と考えられる。スラブロールバックやマントル流が関与する。単純な発散境界やホットスポットだけでは説明できない。",
    learning_objective: "バックアーク盆地と沈み込み帯の関係を説明できる",
    common_misconception: "すべての盆地は大陸衝突だけでできると考える",
    distractor_rationales: ["正解。沈み込み帯弧後方の拡大構造。", "不正解。ホットスポットだけでは説明不十分。", "不正解。中背とは位置・機構が異なる。", "不正解。横ずれ境界とは別。"],
    basic_terms: "バックアーク盆地：火山弧内側の拡大盆地、スラブロールバック：沈み込み板の後退"
  },
  // slot 41 L800 地質 用語・定義
  {
    subdomain: "地質", difficulty_initial: 800, cognitive_type: "用語・定義",
    question_text: "ブルッチャー系列（Bucher series）が示す変成作用の進行において、泥質岩が低圧高温条件下で進む変成相の順序として最も適切なものはどれか。",
    choices: ["緑片岩相 → 角閃岩相 → 麻粒岩相", "藍片岩相 → エクロジャイト相のみ", "沸石相 → 緑片岩相のみで終了", "すべての変成岩が堆積岩に戻る"],
    correct_choice_index: 0,
    short_explanation: "典型的な進行変成系列では温度・圧力上昇に伴い緑片岩相→角閃岩相→麻粒岩相へ遷移する。",
    detailed_explanation: "ブルッチャー系列は泥質岩の進行変成を示す。低温側は緑片岩相（クロライト・バイオタイト）、中温は角閃岩相、高温は麻粒岩相（シリマナイト・カリ長石）へ。藍片岩相・エクロジャイト相は低温高圧系列である。",
    learning_objective: "進行変成系列と変成相の順序を区別できる",
    common_misconception: "低温高圧系列と進行系列を混同する",
    distractor_rationales: ["正解。典型的進行変成系列。", "不正解。低温高圧系列。", "不正解。途中で終了しない。", "不正解。変成作用は不可逆的。"],
    basic_terms: "進行変成系列：温度上昇に伴う変成相の遷移、藍片岩相：低温高圧変成相"
  },
  // slot 42 L800 気象 原理・因果
  {
    subdomain: "気象", difficulty_initial: 800, cognitive_type: "原理・因果",
    question_text: "準地転平衡の大気において、等圧面に沿った風（地衡風）が成立する主な力のバランスはどれか。",
    choices: ["気圧勾配力とコリオリ力", "重力と浮力のみ", "摩擦力のみ", "遠心力のみ"],
    correct_choice_index: 0,
    short_explanation: "地衡風は気圧勾配力とコリオリ力が釣り合った状態の風である。",
    detailed_explanation: "大尺度大気では摩擦が小さい場合、気圧勾配力とコリオリ力のバランスで地衡風が吹く。北半球では低気圧の左側、高気圧の右側を等圧線に沿って吹く。",
    learning_objective: "地衡風の力のバランスを説明できる",
    common_misconception: "風は単純に勾配力だけで決まると考える",
    distractor_rationales: ["正解。地衡風の力のバランス。", "不正解。鉛直方向の力のバランス。", "不正解。摩擦は地衡風では無視される。", "不正解。遠心力単独では説明できない。"],
    basic_terms: "地衡風：勾配力とコリオリ力が平衡の風、準地転平衡：大尺度大気の近似"
  },
  // slot 43 L800 海洋 基本的な適用
  {
    subdomain: "海洋", difficulty_initial: 800, cognitive_type: "基本的な適用",
    question_text: "大西洋子午面循環（AMOC）の弱体化が北大西洋の気候に与えうる影響として最も議論されているものはどれか。",
    choices: ["高緯度への熱輸送減少による地域冷却", "赤道のみの気温上昇", "潮汐の完全停止", "地磁気の即時反転"],
    correct_choice_index: 0,
    short_explanation: "AMOCは北大西洋への暖水輸送に寄与し、弱体化は高緯度冷却の可能性が議論される。",
    detailed_explanation: "AMOCは熱塩循環の大西洋成分で、表層の温暖な海水が高緯度へ運ばれ、冷却・沈降して深層に戻る。弱体化すると熱輸送が減り、ヨーロッパなどの気候に影響しうるとされる（ただし全球温暖化との相対効果は複雑）。",
    learning_objective: "AMOCの役割と気候への影響を説明できる",
    common_misconception: "AMOC弱体化が即座に氷河期をもたらすと単純化する",
    distractor_rationales: ["正解。熱輸送減少による冷却の可能性。", "不正解。地域的・複合的影響。", "不正解。潮汐とは無関係。", "不正解。地磁気とは無関係。"],
    basic_terms: "AMOC：大西洋子午面循環、熱塩循環：密度差による全球海洋循環"
  },
  // slot 44 L800 天文 比較・分類
  {
    subdomain: "天文", difficulty_initial: 800, cognitive_type: "比較・分類",
    question_text: "チャンドラセカール限界として知られる白色矮星の最大質量はおよそどれか。",
    choices: ["約0.8太陽質量", "約1.4太陽質量", "約2.2太陽質量", "約3.0太陽質量"],
    correct_choice_index: 1,
    short_explanation: "チャンドラセカール限界は約1.4太陽質量で、電子縮退圧の限界である。",
    detailed_explanation: "白色矮星は電子縮退圧で重力を支える。質量が約1.4M☉（チャンドラセカール限界）を超えると不安定となり、Ia型超新星などを起こしうる。約2.2M☉は中性子星のTOV限界付近、0.8M☉は典型白色矮星質量。",
    learning_objective: "チャンドラセカール限界の数値と物理的意味を説明できる",
    common_misconception: "TOV限界（中性子星）と混同する",
    distractor_rationales: ["不正解。典型白色矮星質量に近いが限界値ではない。", "正解。電子縮退圧の限界質量。", "不正解。中性子星のTOV限界付近。", "不正解。中性子星上限の推定値。"],
    basic_terms: "チャンドラセカール限界：白色矮星の最大質量、電子縮退圧：パウリ原理による圧力"
  },
  // slot 45 L800 地震 誤解・境界
  {
    subdomain: "地震", difficulty_initial: 800, cognitive_type: "誤解・境界",
    question_text: "地震断層のすべり分布において、アシンメトリッククレスト（非対称クレスト）が生じる主な理由として最も適切なものはどれか。",
    choices: ["断層面の曲率やプレート境界の幾何学的非対称性", "地震波が常に対称に伝播するため", "マグニチュードが常に左右対称であるため", "震源が常に地表直下にあるため"],
    correct_choice_index: 0,
    short_explanation: "断層の形状・境界条件の非対称性により最大すべり位置が偏る。",
    detailed_explanation: "アシンメトリッククレストは、断層面の曲率、沈み込み角度の変化、周辺構造の違いなどにより、最大すべり量の位置（クレスト）が断層長の中央からずれる現象である。地震ハザード評価で重要な概念。",
    learning_objective: "断層すべり分布の非対称性とその要因を説明できる",
    common_misconception: "断層のすべりは常に中央最大だと考える",
    distractor_rationales: ["正解。幾何学的・構造的非対称性。", "不正解。地震波伝播とは別の概念。", "不正解。マグニチュード分布とは直接関係しない。", "不正解。震源は一般に地下深部。"],
    basic_terms: "アシンメトリッククレスト：最大すべり位置の非対称性、すべり分布：断層上の変位量分布"
  },
  // slot 46 L900 地球化学 用語・定義
  {
    subdomain: "地球化学", difficulty_initial: 900, cognitive_type: "用語・定義",
    question_text: "マントル岩石の酸素 fugacity を示すバッファー曲線のうち、FMQ（Fayalite-Magnetite-Quartz）バッファーが表す平衡はどれか。",
    choices: ["鉄の酸化還元状態におけるフェアライト・磁鉄鉱・石英の三相平衡", "炭酸カルシウムの分解のみ", "水素と酸素の直接燃焼のみ", "塩化ナトリウムの溶解のみ"],
    correct_choice_index: 0,
    short_explanation: "FMQはFe₂SiO₄-Fe₃O₄-SiO₂の酸化還元平衡を示す酸素 fugacity 基準。",
    detailed_explanation: "FMQバッファーはマントル・地殻岩石の酸素 fugacity 比較の標準的参照である。他にIW（鉄-ウüスタイト）、NNO（ニッケル-ニッケル酸化物）などがある。酸素 fugacity は鉱物組合せ・配位に影響する。",
    learning_objective: "主要酸素 fugacity バッファーの定義と用途を説明できる",
    common_misconception: "酸素 fugacity を酸素分圧と同一視する（活量係数の違い）",
    distractor_rationales: ["正解。FMQ三相平衡の酸化還元基準。", "不正解。炭酸塩の反応。", "不正解。単純燃焼反応。", "不正解。塩類溶解。"],
    basic_terms: "酸素 fugacity：酸化還元条件の指標、FMQ：鉄硅酸塩酸化還元バッファー"
  },
  // slot 47 L900 地球物理学 原理・因果
  {
    subdomain: "地球物理学", difficulty_initial: 900, cognitive_type: "原理・因果",
    question_text: "地球内核の異方性（IC anisotropy）がP波速度に与える影響として最も確立している観測的事実はどれか。",
    choices: ["内核においてP波速度が伝播方向に対して異なる", "内核でP波とS波の速度が同一になる", "内核は完全な等方性媒体である", "内核で地震波は伝播しない"],
    correct_choice_index: 0,
    short_explanation: "内核のP波速度は自転軸に平行・垂直で約3-4%の差がある（異方性）。",
    detailed_explanation: "内核異方性は、hexagonal close-packed鉄結晶の配向や成長過程に起因すると考えられる。伝播方向依存の速度差は、内核の構造・進化を制約する重要な観測である。",
    learning_objective: "内核異方性の観測的事実と意義を説明できる",
    common_misconception: "内核は均一な球体だと考える",
    distractor_rationales: ["正解。方向依存のP波速度差。", "不正解。内核でS波は伝播しない。", "不正解。異方性が観測されている。", "不正解。P波は内核を通過する。"],
    basic_terms: "内核異方性：伝播方向依存の弾性性質、HCP鉄：内核の主要構成物質候補"
  },
  // slot 48 L900 古気候 基本的な適用
  {
    subdomain: "古気候", difficulty_initial: 900, cognitive_type: "基本的な適用",
    question_text: "シルル紀末のδ¹³C正異常（Lau/Kozlowskiiイベント等）が示唆する地球システム変化として最も支持されている解釈はどれか。",
    choices: ["有機炭素の埋藏増加または有機物生産の変化に伴う炭素循環の擾乱", "月の公転周期の急変", "地磁気の恒常的消失", "プレートテクトニクスの停止"],
    correct_choice_index: 0,
    short_explanation: "δ¹³C正異常は有機炭素庫の変化や生産・埋藏バランスの変動を反映しうる。",
    detailed_explanation: "シルル紀末の正のδ¹³C異常は、大気-海洋-生物圏の炭素循環の大規模擾乱を示す。有機炭素の大量埋藏、生産力変化、風化フラックスの変動などが議論される。同時期の生物大量絶滅イベントとも関連づけられる。",
    learning_objective: "δ¹³C異常と古海洋・古気候変動の解釈を説明できる",
    common_misconception: "δ¹³C異常を温度変化だけで説明する",
    distractor_rationales: ["正解。炭素循環擾乱の典型的解釈。", "不正解。天文起源ではない。", "不正解。地磁気消失とは無関係。", "不正解。プレート運動は継続。"],
    basic_terms: "δ¹³C：炭素安定同位体比の偏差、炭素循環擾乱：有機・無機炭素庫の変動"
  },
  // slot 49 L900 鉱物 比較・分類
  {
    subdomain: "鉱物", difficulty_initial: 900, cognitive_type: "比較・分類",
    question_text: "転位（ディスロケーション）のうち、刃状転位（edge dislocation）のバーガースベクトルと転位線の関係として最も適切なものはどれか。",
    choices: ["バーガースベクトルは転位線に垂直である", "バーガースベクトルは常に転位線と平行である", "バーガースベクトルは転位線と無関係である", "バーガースベクトルは常にゼロである"],
    correct_choice_index: 0,
    short_explanation: "刃状転位ではバーガースベクトルは転位線に垂直、ねじ状転位では平行。",
    detailed_explanation: "結晶の塑性変形では転位が滑りを担う。刃状転位は余分な原子面の端に対応し、バーガースベクトルは転位線に垂直。ねじ状転位は螺旋階段に対応し、ベクトルは平行。混合転位も存在する。",
    learning_objective: "刃状・ねじ状転位の幾何学的特徴を区別できる",
    common_misconception: "すべての転位でベクトルが平行だと考える",
    distractor_rationales: ["正解。刃状転位の定義的性質。", "不正解。ねじ状転位の性質。", "不正解。幾何学的に定義される。", "不正解。ゼロでは変形を説明できない。"],
    basic_terms: "刃状転位：余分原子面の端、バーガースベクトル：転位の強さと方向"
  },
  // slot 50 L900 プレート 誤解・境界
  {
    subdomain: "プレート", difficulty_initial: 900, cognitive_type: "誤解・境界",
    question_text: "沈み込み帯におけるスラブのロールバック（後退）がバックア弧拡大と関連づけられる際の誤解として最も適切なものはどれか。",
    choices: ["スラブロールバックは常にプレートの収束速度を直接増加させる単純な現象である", "スラブロールバックは沈み込み角度の変化と弧後引き伸ばしに関与しうる", "バックア弧は沈み込み帯の弧の後方に形成しうる", "ロールバックはマントル楔の流れに影響しうる"],
    correct_choice_index: 0,
    short_explanation: "ロールバックは複雑な力学過程であり、単純に収束速度を増やすだけではない。",
    detailed_explanation: "スラブロールバックは沈み込み板が重力により後方へ「転がる」ように後退する概念で、バックア弧拡大・マントル流に関与する。しかし「常に収束速度を直接増加させる」は単純化しすぎた誤解である。実際はプレート運動・トルクバランス・マントル粘性など多要因が絡む。",
    learning_objective: "スラブロールバックの概念と誤解を区別できる",
    common_misconception: "ロールバックを単純な速度増加と同一視する",
    distractor_rationales: ["正解（誤解の記述）。単純化しすぎた誤った理解。", "不正解。妥当な記述。", "不正解。妥当な記述。", "不正解。妥当な記述。"],
    basic_terms: "スラブロールバック：沈み込み板の後退、バックア弧：火山弧後方の拡大域"
  }
];

const questions = raw.map((item, i) => q(item, i % 4));
writeFileSync(OUT, JSON.stringify(questions, null, 2) + "\n", "utf8");
console.log(`Wrote ${questions.length} questions to ${OUT}`);
const levels = {};
for (const item of questions) levels[item.difficulty_initial] = (levels[item.difficulty_initial] || 0) + 1;
console.log("Level distribution:", levels);
