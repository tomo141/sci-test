import { q } from "../lib/batch50-helpers.mjs";

export const chemistryGap = [
  // L100 ×1 — 物理化学・用語・定義
  q({
    domain: "化学",
    subdomain: "物理化学",
    difficulty_initial: 100,
    cognitive_type: "用語・定義",
    question_text: "物質を構成する粒子が常に運動しているという考え方を何と呼ぶか。",
    choices: ["分子運動論", "原子価結合理論", "質量保存の法則", "定比例の法則"],
    correct_choice_index: 0,
    short_explanation: "分子運動論は、気体・液体・固体中の粒子が運動していると説明する考え方である。",
    detailed_explanation: "分子運動論により、温度上昇は粒子の運動エネルギー増加として理解できる。原子価結合理論は結合の説明、質量保存・定比例の法則は化学反応量論に関する法則である。",
    learning_objective: "分子運動論の意味を説明できる",
    common_misconception: "固体では粒子が静止していると考える",
    distractor_rationales: [
      "正解。粒子の運動で物性を説明する理論。",
      "不正解。結合の種類と電子の扱いに関する理論。",
      "不正解。反応前後の質量不変に関する法則。",
      "不正解。化合物の元素比に関する法則。"
    ],
    basic_terms: "分子運動論：物質を運動する粒子の集まりとして扱うモデル、温度：粒子の平均運動エネルギーの尺度"
  }),

  // L200 ×1 — 結合・原理・因果
  q({
    domain: "化学",
    subdomain: "結合",
    difficulty_initial: 200,
    cognitive_type: "原理・因果",
    question_text: "ナトリウム原子と塩素原子が塩化ナトリウムを形成するとき、主に関与する結合の種類はどれか。",
    choices: ["共有結合", "イオン結合", "金属結合", "ファンデルワールス力"],
    correct_choice_index: 1,
    short_explanation: "金属と非金属の電気陰性度差が大きく、電子の授受によりイオン結合が形成される。",
    detailed_explanation: "Na は電子を失い Na⁺、Cl は電子を得て Cl⁻ となり、静電引力でイオン結晶を形成する。共有結合は電子対の共有による結合である。",
    learning_objective: "イオン結合が形成される条件を説明できる",
    common_misconception: "すべての塩類が共有結合の分子からなると考える",
    distractor_rationales: [
      "不正解。電子対を共有する結合で、NaCl には当てはまらない。",
      "正解。Na⁺ と Cl⁻ の静電引力による結合。",
      "不正解。金属同士の結合の典型。",
      "不正解。分子間力であり、結晶内の主結合ではない。"
    ],
    basic_terms: "イオン結合：陽イオンと陰イオンの静電引力、電気陰性度：原子が結合電子対を引き寄せる性質"
  }),

  // L300 ×5
  q({
    domain: "化学",
    subdomain: "有機化学",
    difficulty_initial: 300,
    cognitive_type: "比較・分類",
    question_text: "一般式 CₙH₂ₙ₊₂ に属する炭化水素の系統名はどれか。",
    choices: ["アルケン", "アルキン", "アルカン", "アロマチック炭化水素"],
    correct_choice_index: 2,
    short_explanation: "飽和炭化水素（単結合のみ）で、水素数が炭素数の2倍加2の一般式を持つ。",
    detailed_explanation: "アルカンは CₙH₂ₙ₊₂。アルケンは CₙH₂ₙ（二重結合1）、アルキンは CₙH₂ₙ₋₂（三重結合1）である。",
    learning_objective: "主要な炭化水素の一般式と系統名を対応づけられる",
    common_misconception: "炭化水素の一般式を混同する",
    distractor_rationales: [
      "不正解。CₙH₂ₙ の不飽和炭化水素。",
      "不正解。CₙH₂ₙ₋₂ の不飽和炭化水素。",
      "正解。飽和炭化水素 CₙH₂ₙ₊₂。",
      "不正解。ベンゼン環などを含む炭化水素。"
    ],
    basic_terms: "アルカン：飽和炭化水素、一般式：化合物の組成を表す式"
  }),
  q({
    domain: "化学",
    subdomain: "無機化学",
    difficulty_initial: 300,
    cognitive_type: "誤解・境界",
    question_text: "遷移金属イオンの性質として正しいものはどれか。",
    choices: ["常に単一の酸化数のみをとる", "価電子は常にs軌道のみで結合する", "すべてアルカリ金属に分類される", "複数の酸化数をとりやすい"],
    correct_choice_index: 3,
    short_explanation: "遷移金属はd軌道を用い、酸化数の変化が豊富である。",
    detailed_explanation: "遷移金属は(n−1)d軌道とns軌道の電子を用い、Fe²⁺/Fe³⁺ など多种の酸化態を示す。アルカリ金属は第1族の主族元素である。",
    learning_objective: "遷移金属の代表的性質を説明できる",
    common_misconception: "遷移金属の酸化数は固定だと考える",
    distractor_rationales: [
      "不正解。遷移金属は多种の酸化数を示す。",
      "不正解。d軌道も結合に関与する。",
      "不正解。アルカリ金属は主族元素である。",
      "正解。遷移金属の特徴的性質。"
    ],
    basic_terms: "遷移金属：d軌道に電子を持つ元素、酸化数：原子の見かけの電荷"
  }),
  q({
    domain: "化学",
    subdomain: "物理化学",
    difficulty_initial: 300,
    cognitive_type: "用語・定義",
    question_text: "化学反応で系が周囲から熱を吸収したとき、反応熱 ΔH の符号はどれか。",
    choices: ["ΔH > 0", "ΔH = 0", "ΔH < 0", "ΔH は常に正"],
    correct_choice_index: 0,
    short_explanation: "吸熱反応ではエンタルピーが増加し ΔH > 0 となる。",
    detailed_explanation: "熱を吸収する反応を吸熱反応（ΔH > 0）と呼ぶ。熱を放出する反応は発熱反応（ΔH < 0）である。",
    learning_objective: "反応熱の符号と吸熱・発熱の関係を説明できる",
    common_misconception: "吸熱反応で ΔH が負だと誤る",
    distractor_rationales: [
      "正解。吸熱反応では ΔH > 0。",
      "不正解。熱の出入りがない理想過程の条件。",
      "不正解。発熱反応の条件。",
      "不正解。吸熱・発熱の両方があり得る。"
    ],
    basic_terms: "エンタルピー変化 ΔH：反応熱、吸熱反応：周囲から熱を吸収する反応"
  }),
  q({
    domain: "化学",
    subdomain: "分析化学",
    difficulty_initial: 300,
    cognitive_type: "原理・因果",
    question_text: "酸・塩基滴定の終点を知らせるために添加する物質を何と呼ぶか。",
    choices: ["緩衝剤", "指示薬", "触媒", "電解質"],
    correct_choice_index: 1,
    short_explanation: "指示薬はpHの変化に応じて色が変わり、滴定終点を視覚的に示す。",
    detailed_explanation: "フェノールフタレインやブロモチモールブルーなどが用いられる。緩衝剤はpHを安定化し、触媒は反応速度を変化させる。",
    learning_objective: "滴定における指示薬の役割を説明できる",
    common_misconception: "指示薬と緩衝剤の役割を混同する",
    distractor_rationales: [
      "不正解。pH変化を抑える試薬。",
      "正解。終点で色が変わる試薬。",
      "不正解。反応速度を変える物質。",
      "不正解。水溶液中でイオン化する物質の総称。"
    ],
    basic_terms: "指示薬：pHに応じて色が変わる弱酸・弱塩基、滴定：溶液の濃度を求める操作"
  }),
  q({
    domain: "化学",
    subdomain: "触媒化学",
    difficulty_initial: 300,
    cognitive_type: "基本的な適用",
    question_text: "触媒を添加すると反応速度が増加する主な理由はどれか。",
    choices: ["反応の平衡定数が大きくなるため", "反応物の濃度が増えるため", "活性化エネルギーが低下するため", "反応熱がゼロになるため"],
    correct_choice_index: 2,
    short_explanation: "触媒は反応経路を変えて活性化エネルギーを下げ、速度を増加させる。",
    detailed_explanation: "触媒は平衡位置（平衡定数）を変えず、正・逆反応の活性化エネルギーをともに低下させる。反応熱 ΔH も変わらない。",
    learning_objective: "触媒が反応速度に与える影響を説明できる",
    common_misconception: "触媒が平衡を移動させると誤解する",
    distractor_rationales: [
      "不正解。触媒は平衡定数を変えない。",
      "不正解。触媒添加で反応物濃度は増えない。",
      "正解。活性化エネルギー低下が速度増加の主因。",
      "不正解。反応熱は触媒で変わらない。"
    ],
    basic_terms: "触媒：反応速度を変えるが自身は消費されない物質、活性化エネルギー：反応が進行するのに必要なエネルギー障壁"
  }),

  // L400 ×4
  q({
    domain: "化学",
    subdomain: "元素",
    difficulty_initial: 400,
    cognitive_type: "用語・定義",
    question_text: "原子の種類を決める整数を何と呼ぶか。",
    choices: ["質量数", "同位体比", "価電子数", "原子番号"],
    correct_choice_index: 3,
    short_explanation: "原子番号は陽子数を表し、元素の同一性を決める。",
    detailed_explanation: "原子番号 Z は陽子数に等しい。質量数は陽子数と中性子数の和、同位体は原子番号が同じで質量数が異なる原子である。",
    learning_objective: "原子番号・質量数・同位体の意味を区別できる",
    common_misconception: "質量数と原子番号を混同する",
    distractor_rationales: [
      "不正解。陽子数と中性子数の和。",
      "不正解。同位体の存在比。",
      "不正解。最外殻電子数で、元素の種類は決めない。",
      "正解。陽子数であり元素を規定する。"
    ],
    basic_terms: "原子番号：陽子数、質量数：陽子数と中性子数の和"
  }),
  q({
    domain: "化学",
    subdomain: "結合",
    difficulty_initial: 400,
    cognitive_type: "原理・因果",
    question_text: "2つの原子が共有結合で結ばれたとき、原子核間の平衡距離を何と呼ぶか。",
    choices: ["結合長", "イオン半径", "ファンデルワールス半径", "結晶格子定数"],
    correct_choice_index: 0,
    short_explanation: "結合長は共有結合を形成する原子核間の距離である。",
    detailed_explanation: "結合長は分子の構造を規定する基本量である。イオン半径はイオン結晶中のイオンサイズ、格子定数は結晶全体の周期である。",
    learning_objective: "結合長の定義を説明できる",
    common_misconception: "結合長とイオン半径を同一視する",
    distractor_rationales: [
      "正解。共有結合の原子核間距離。",
      "不正解。イオン結晶中のイオンのサイズ。",
      "不正解。分子間相互作用の距離尺度。",
      "不正解。結晶構造全体の繰り返し距離。"
    ],
    basic_terms: "結合長：結合した原子核間の距離、共有結合：電子対を共有する結合"
  }),
  q({
    domain: "化学",
    subdomain: "酸塩基",
    difficulty_initial: 400,
    cognitive_type: "基本的な適用",
    question_text: "pH = 3 の水溶液は pH = 5 の水溶液と比べて水素イオン濃度 [H⁺] はどうか。",
    choices: ["100倍高い", "2倍高い", "同じ", "100倍低い"],
    correct_choice_index: 0,
    short_explanation: "[H⁺] = 10^(−pH) より、pH が2小さいと濃度は10² = 100倍になる。",
    detailed_explanation: "pH = 3 では [H⁺] = 10⁻³ mol/L、pH = 5 では 10⁻⁵ mol/L。比は 10⁻³/10⁻⁵ = 100 である。",
    learning_objective: "pHと水素イオン濃度の関係を適用できる",
    common_misconception: "pHの差を濃度の差と直線的に対応させる",
    distractor_rationales: [
      "正解。pHが2小さいので10²倍。",
      "不正解。pHは対数尺度である。",
      "不正解。pHが異なれば濃度も異なる。",
      "不正解。pH 3の方が酸性が強く濃度は高い。"
    ],
    basic_terms: "pH：水素イオン濃度の負の常用対数、酸性：pHが小さいほど[H⁺]が大きい"
  }),
  q({
    domain: "化学",
    subdomain: "有機化学",
    difficulty_initial: 400,
    cognitive_type: "比較・分類",
    question_text: "ベンゼン環を持たない飽和環状炭化水素の例はどれか。",
    choices: ["ベンゼン", "フェノール", "シクロヘキサン", "トルエン"],
    correct_choice_index: 2,
    short_explanation: "シクロヘキサン C₆H₁₂ は飽和環状炭化水素（シクロアルカン）である。",
    detailed_explanation: "ベンゼン・トルエンは芳香族、フェノールはヒドロキシ基を持つ芳香族化合物。シクロヘキサンは単結合のみの環状アルカンである。",
    learning_objective: "芳香族とシクロアルカンを区別できる",
    common_misconception: "6員環はすべて芳香族だと考える",
    distractor_rationales: [
      "不正解。芳香族炭化水素。",
      "不正解。ベンゼン環を持つ芳香族化合物。",
      "正解。飽和環状炭化水素。",
      "不正解。メチル基を持つ芳香族化合物。"
    ],
    basic_terms: "シクロアルカン：環状の飽和炭化水素、芳香族：ベンゼン環を含む化合物"
  }),

  // L500 ×3
  q({
    domain: "化学",
    subdomain: "触媒化学",
    difficulty_initial: 500,
    cognitive_type: "基本的な適用",
    question_text: "自動車の排気ガス中の有害物質を無害化するために、セラミック担体に貴金属を担持した装置を何と呼ぶか。",
    choices: ["光触媒", "酵素触媒", "電極触媒", "自動車触媒"],
    correct_choice_index: 3,
    short_explanation: "三元触媒などが CO・HC・NOₓ を無害化する。",
    detailed_explanation: "自動車触媒（触媒コンバータ）は Pt・Pd・Rh 等を担持し、排気中の酸化・還元反応を促進する不均一触媒である。",
    learning_objective: "自動車触媒の役割を説明できる",
    common_misconception: "触媒はすべて溶液中で働くと考える",
    distractor_rationales: [
      "不正解。光エネルギーを利用する触媒。",
      "不正解。生体内のタンパク質触媒。",
      "不正解。電気化学反応の電極表面触媒。",
      "正解。排ガス浄化用の固体触媒装置。"
    ],
    basic_terms: "不均一触媒：反応物と触媒が異相の触媒、三元触媒：CO・HC・NOₓ を同時に処理する触媒"
  }),
  q({
    domain: "化学",
    subdomain: "酸化還元",
    difficulty_initial: 500,
    cognitive_type: "比較・分類",
    question_text: "硫酸（H₂SO₄）中の硫黄の酸化数はどれか。",
    choices: ["+6", "+4", "0", "−2"],
    correct_choice_index: 0,
    short_explanation: "H が +1、O が −2 として S を求めると +6 となる。",
    detailed_explanation: "2(+1) + S + 4(−2) = 0 より S = +6。+4 は亜硫酸、0 は単体硫黄、−2 は硫化物の典型値である。",
    learning_objective: "化合物中の元素の酸化数を求められる",
    common_misconception: "硫黄の酸化数を常に同じ値だと考える",
    distractor_rationales: [
      "正解。硫酸中の硫黄の酸化数。",
      "不正解。亜硫酸 SO₃²⁻ 中の値。",
      "不正解。単体硫黄 S₈ の酸化数。",
      "不正解。硫化物 S²⁻ の酸化数。"
    ],
    basic_terms: "酸化数：原子の見かけの電荷、酸化還元：電子の授受を伴う反応"
  }),
  q({
    domain: "化学",
    subdomain: "状態変化",
    difficulty_initial: 500,
    cognitive_type: "誤解・境界",
    question_text: "液体がその温度で沸騰しているとき、液体の蒸気圧と外圧の関係として正しいものはどれか。",
    choices: ["液体の蒸気圧は外圧より常に小さい", "液体の蒸気圧は外圧と等しい", "気相のみが存在する", "温度は必ず上昇する"],
    correct_choice_index: 1,
    short_explanation: "沸点では液体の飽和蒸気圧が外圧と一致する。",
    detailed_explanation: "沸騰は飽和蒸気圧が外圧に達したとき起こる。それまでは液体表面からの蒸発が主で、温度は沸点で一定に保たれる。",
    learning_objective: "沸点と蒸気圧・外圧の関係を説明できる",
    common_misconception: "沸騰中も温度が上がり続けると考える",
    distractor_rationales: [
      "不正解。沸点では蒸気圧と外圧が等しい。",
      "正解。沸騰の定義的条件。",
      "不正解。沸騰中も液体と気体が共存する。",
      "不正解。純物質の沸騰中は温度は一定。"
    ],
    basic_terms: "飽和蒸気圧：液体と気体が平衡のときの蒸気圧、沸点：飽和蒸気圧が外圧と等しい温度"
  }),

  // L600 ×3
  q({
    domain: "化学",
    subdomain: "酸塩基",
    difficulty_initial: 600,
    cognitive_type: "基本的な適用",
    question_text: "ルイス酸の定義を満たす物种として正しいものはどれか。",
    choices: ["電子対を供与する種", "プロトンを放出する種のみ", "水素イオンを常に含む種のみ", "電子対を受け取る種"],
    correct_choice_index: 3,
    short_explanation: "ルイス酸は電子対を受け取り、ルイス塩基は電子対を供与する。",
    detailed_explanation: "Brønsted 酸はプロトン供与体だが、ルイス酸はより広い定義で BF₃ や AlCl₃ なども含む。電子対供与はルイス塩基の定義である。",
    learning_objective: "ルイス酸・塩基の定義を適用できる",
    common_misconception: "酸はすべてプロトン供与体のみだと考える",
    distractor_rationales: [
      "不正解。ルイス塩基の定義。",
      "不正解。Brønsted 酸の定義に限定しすぎ。",
      "不正解。酸の定義を水素イオンに限定する誤り。",
      "正解。ルイス酸の定義。"
    ],
    basic_terms: "ルイス酸：電子対受容体、ルイス塩基：電子対供与体"
  }),
  q({
    domain: "化学",
    subdomain: "有機化学",
    difficulty_initial: 600,
    cognitive_type: "比較・分類",
    question_text: "キラル中心を1つ持つ化合物について、鏡像が一致しない立体異性体の組合せを何と呼ぶか。",
    choices: ["構造異性体", "ジアステレオマー", "互変異性体", "エナンチオマー"],
    correct_choice_index: 3,
    short_explanation: "鏡像関係で非重合法な立体異性体をエナンチオマーと呼ぶ。",
    detailed_explanation: "1つのキラル中心を持つ化合物は (R)/(S) の一対のエナンチオマーを生成する。ジアステレオマーは鏡像でない立体異性体である。",
    learning_objective: "エナンチオマーとジアステレオマーを区別できる",
    common_misconception: "立体異性体をすべて同じ種類だと考える",
    distractor_rationales: [
      "不正解。結合順序が異なる異性体。",
      "不正解。鏡像でない立体異性体。",
      "不正解。平衡で相互変換する異性体。",
      "正解。鏡像関係の立体異性体対。"
    ],
    basic_terms: "エナンチオマー：鏡像関係の立体異性体、キラル中心：4つの異なる基に置換された炭素"
  }),
  q({
    domain: "化学",
    subdomain: "無機化学",
    difficulty_initial: 600,
    cognitive_type: "誤解・境界",
    question_text: "八面体配位の遷移金属錯体で、ジーン・テラー効果による構造歪みが特に起こりやすい高スピン電子配置はどれか。",
    choices: ["d⁹", "d⁰", "d¹⁰", "d⁵（高スピン）"],
    correct_choice_index: 0,
    short_explanation: "d⁹ 高スピン（t₂g⁶e_g³）は e_g 軌道の不均一占有で歪みが生じやすい。",
    detailed_explanation: "ジーン・テラー活性は e_g 軌道の不均一占有（d⁹、d⁴ 高スピン等）で起こる。d⁰・d¹⁰ は非縮退、d⁵ 高スピンは e_g 半占有で対称的である。",
    learning_objective: "ジーン・テラー効果とd電子配置の関係を説明できる",
    common_misconception: "すべての遷移金属錯体が同程度に歪むと考える",
    distractor_rationales: [
      "正解。d⁹ 高スピンは典型的な JT 活性配置。",
      "不正解。d軌道が空で縮退がない。",
      "不正解。d軌道が満たされ縮退がない。",
      "不正解。d⁵ 高スピンは e_g 半占有で対称的。"
    ],
    basic_terms: "ジーン・テラー効果：縮退軌道の不均一占有による構造歪み、八面体配位：配位子が6方向に配位する構造"
  }),

  // L700 ×1 — 状態変化・誤解・境界
  q({
    domain: "化学",
    subdomain: "状態変化",
    difficulty_initial: 700,
    cognitive_type: "誤解・境界",
    question_text: "液体と気体の区別がなくなる臨界点近傍の流体の状態を何と呼ぶか。",
    choices: ["プラズマ", "超臨界流体", "コロイド", "液晶"],
    correct_choice_index: 1,
    short_explanation: "臨界温度・臨界圧を超えると液体と気体の界面が消失する。",
    detailed_explanation: "超臨界流体は密度や溶解性を圧力で連続的に制御でき、抽出・反応溶媒として利用される。プラズマは気体のイオン化状態である。",
    learning_objective: "超臨界流体の定義と性質を説明できる",
    common_misconception: "高温高圧の流体はすべてプラズマだと考える",
    distractor_rationales: [
      "不正解。気体がイオン化した状態。",
      "正解。臨界点を超えた流体。",
      "不正解。粒子が分散した系。",
      "不正解。流動性と秩序を併せ持つ相。"
    ],
    basic_terms: "臨界点：液体と気体が区別できなくなる点、超臨界流体：臨界点を超えた単一相流体"
  }),

  // L800 ×1 — 無機化学・誤解・境界
  q({
    domain: "化学",
    subdomain: "無機化学",
    difficulty_initial: 800,
    cognitive_type: "誤解・境界",
    question_text: "遷移金属カーボニル錯体 M(CO)₆（八面体）の IR スペクトルで CO 伸縮振動のパターンが単純化する主な理由はどれか。",
    choices: ["CO が金属に結合していないため", "すべての CO が解離しているため", "分子の高い対称性による振動の縮退", "遷移金属が非金属元素であるため"],
    correct_choice_index: 2,
    short_explanation: "Oh 対称性により等価な CO の振動モードが縮退し、観測バンド数が減る。",
    detailed_explanation: "M(CO)₆ では6つの CO が結晶学的に等価であり、群論に基づく振動モード解析で IR 活性モードが限定される。対称性の低い錯体ではより多くのバンドが観測される。",
    learning_objective: "錯体の対称性とIRスペクトルの関係を説明できる",
    common_misconception: "CO 配位数が多いほど IR バンドが必ず増えると考える",
    distractor_rationales: [
      "不正解。カーボニルは金属に配位している。",
      "不正解。安定な錯体では CO は配位状態にある。",
      "正解。高対称性によるモード縮退が主因。",
      "不正解。遷移金属は金属元素である。"
    ],
    basic_terms: "縮退：異なる振動モードが同じエネルギーを持つこと、カーボニル錯体：CO を配位子とする遷移金属錯体"
  })
];
