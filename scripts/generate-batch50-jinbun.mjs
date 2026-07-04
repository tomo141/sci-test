#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "scripts/batch50-generated/人文社会科学.json");
const SOURCE = "全分野科学検定 バッチ50（レベル均等）";

function q(fields) {
  return {
    currentness_type: "evergreen",
    expires_at: null,
    source_url: "",
    source_note: SOURCE,
    difficulty_continuous: fields.difficulty_initial,
    tags: ["人文社会科学", fields.subdomain, "batch50", `L${fields.difficulty_initial}`],
    domain: "人文社会科学",
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

const raw = [
  q({
    subdomain: "経済学",
    difficulty_initial: 100,
    cognitive_type: "用語・定義",
    question_text: "経済学で「需要」とは、一般にどのような状態を指すか。",
    choices: [
      "欲しいと思うだけでよい",
      "欲しいと思い、かつ購入する能力がある状態",
      "店に並んでいる商品の量",
      "政府が決めた価格"
    ],
    correct_choice_index: 1,
    short_explanation: "需要は購買意欲と購買能力の両方を伴う概念である。",
    detailed_explanation:
      "経済学の需要は、一定の価格水準で消費者が購入しようとする量を指す。単に欲しいだけでは需要とは言わない。",
    learning_objective: "経済学における需要の基本的定義を理解する",
    common_misconception: "欲しいという気持ちだけを需要と混同する",
    distractor_rationales: [
      "不正解。購買能力が伴わない欲求は需要ではない。",
      "正解。需要は購買意欲と購買能力の両方を要する。",
      "不正解。これは供給量や在庫の話に近い。",
      "不正解。価格決定の話であり需要の定義ではない。"
    ],
    basic_terms: "需要：一定価格で購入しようとする量、購買能力：実際に買うための所得や資金"
  }),
  q({
    subdomain: "心理学",
    difficulty_initial: 100,
    cognitive_type: "原理・因果",
    question_text: "パブロフの犬の実験で、ベルという音を聞かせると唾液が分泌されるようになったのは、どのような学習によるか。",
    choices: ["操作条件づけ", "観察学習", "古典的条件づけ", "潜在学習"],
    correct_choice_index: 2,
    short_explanation: "中性刺激（ベル）と無条件刺激（餌）の繰り返し結合が古典的条件づけである。",
    detailed_explanation:
      "パブロフは餌（無条件刺激）とベル（中性刺激）を同時提示し、ベルだけで唾液分泌（条件反応）が起こるようになった。",
    learning_objective: "古典的条件づけの基本的仕組みを説明できる",
    common_misconception: "スキナーの操作条件づけと混同する",
    distractor_rationales: [
      "不正解。強化による行動変化の学習方式。",
      "不正解。他者の行動を見て学ぶ方式。",
      "正解。刺激の結合による反射的学習。",
      "不正解。報酬なしでも地図を学ぶ学習。"
    ],
    basic_terms: "古典的条件づけ：刺激の結合による学習、無条件刺激：もともと反応を引き起こす刺激"
  }),
  q({
    subdomain: "社会学",
    difficulty_initial: 100,
    cognitive_type: "基本的な適用",
    question_text: "子どもが言葉や礼儀を身につけるうえで、最初に強い影響を与える社会集団として最も適切なものはどれか。",
    choices: ["家族", "企業", "国会", "国際連合"],
    correct_choice_index: 0,
    short_explanation: "家族は初次的集団として社会化の出発点となる。",
    detailed_explanation:
      "社会化は他者から規範や価値を学ぶ過程で、幼少期には家族が最も身近な学習場となる。",
    learning_objective: "社会化と初次的集団の関係を理解する",
    common_misconception: "学校だけが社会化の場だと考える",
    distractor_rationales: [
      "正解。幼少期の規範学習の中心。",
      "不正解。職業社会化の場。",
      "不正解。政治制度の機関。",
      "不正解。国際政治の枠組み。"
    ],
    basic_terms: "社会化：社会の規範や価値を身につける過程、初次的集団：密接な関係をもつ小集団"
  }),
  q({
    subdomain: "哲学",
    difficulty_initial: 100,
    cognitive_type: "比較・分類",
    question_text: "「道徳」と「マナー（礼儀）」の違いとして最も適切な説明はどれか。",
    choices: [
      "どちらも法律と同じ強制力をもつ",
      "道徳は善悪の基準、マナーは社会生活の作法",
      "マナーは宗教だけが決める",
      "道徳は国ごとに法律化されている"
    ],
    correct_choice_index: 1,
    short_explanation: "道徳はより広い善悪判断、マナーは社会的作法の規範。",
    detailed_explanation:
      "道徳は行為の善悪を問う規範体系、マナーは場面に応じた礼儀・作法であり、必ずしも善悪の核心ではない。",
    learning_objective: "道徳と社会規範の種類を区別できる",
    common_misconception: "礼儀違反を必ず道徳的悪とみなす",
    distractor_rationales: [
      "不正解。法律とは強制力が異なる。",
      "正解。善悪基準と社会生活作法の区別。",
      "不正解。マナーは宗教だけで決まるわけではない。",
      "不正解。道徳全体が法律化されるわけではない。"
    ],
    basic_terms: "道徳：善悪を判断する規範、マナー：社会生活における礼儀・作法"
  }),
  q({
    subdomain: "法学",
    difficulty_initial: 100,
    cognitive_type: "誤解・境界",
    question_text: "「ルール」と「法律」の関係について、最も適切な説明はどれか。",
    choices: [
      "すべてのルールが法律である",
      "法律はルールの一種だが、国家の強制力を伴う",
      "法律はルールより弱い規範である",
      "ルールは法律だけが作れる"
    ],
    correct_choice_index: 1,
    short_explanation: "法律は国家が定める強制力をもつ社会規範の一種。",
    detailed_explanation:
      "校則やクラブ規約もルールだが、法律は国会等が定め裁判所が関与する実定法として強制力が高い。",
    learning_objective: "法律とその他の社会規範の違いを理解する",
    common_misconception: "あらゆる規則を法律と呼ぶ",
    distractor_rationales: [
      "不正解。校則などは法律ではない。",
      "正解。法律は国家強制力を伴うルール。",
      "不正解。法律は通常より強い規範。",
      "不正解。私的団体もルールを定められる。"
    ],
    basic_terms: "法律：国家が定める強制力をもつ規範、社会規範：社会で共有される行動基準"
  }),
  q({
    subdomain: "政治学",
    difficulty_initial: 100,
    cognitive_type: "用語・定義",
    question_text: "「民主主義」のもっとも基本的な意味として適切なものはどれか。",
    choices: [
      "国民が政治に参加し、意思を反映する政治のあり方",
      "一人の指導者がすべてを決める政治",
      "軍隊が政治を支配する政治",
      "選挙を行わない政治"
    ],
    correct_choice_index: 0,
    short_explanation: "民主主義は国民の政治参加と意思反映を重視する。",
    detailed_explanation:
      "民主主義には直接民主制・間接民主制など様式があるが、国民主権と政治参加が基本理念である。",
    learning_objective: "民主主義の基本的意味を説明できる",
    common_misconception: "選挙があれば十分な民主主義だと単純化する",
    distractor_rationales: [
      "正解。国民の意思反映が核心。",
      "不正解。独裁的支配の説明。",
      "不正解。軍事政権の説明。",
      "不正解。選挙不在は民主主義の対極に近い。"
    ],
    basic_terms: "民主主義：国民の政治参加と意思反映を重視する政治体制、国民主権：国家の最高決定権が国民にあること"
  }),
  q({
    subdomain: "歴史",
    difficulty_initial: 200,
    cognitive_type: "原理・因果",
    question_text: "古代から中世にかけてシルクロードが発展した主な理由として最も適切なものはどれか。",
    choices: [
      "東西間の交易需要と陸路交通の発達",
      "印刷技術の普及",
      "大西洋貿易の拡大",
      "産業革命の開始"
    ],
    correct_choice_index: 0,
    short_explanation: "東西の物資・文化交換需要が陸路ネットワークを発展させた。",
    detailed_explanation:
      "シルクや香料などの交易、オアシス都市の発達、帝国の保護が陸上交易路を支えた。",
    learning_objective: "シルクロード発展の歴史的背景を説明できる",
    common_misconception: "大航海時代の貿易と混同する",
    distractor_rationales: [
      "正解。東西交易と陸路交通が主因。",
      "不正解。印刷は近世以降の技術。",
      "不正解。大西洋貿易は大航海時代以降。",
      "不正解。産業革命は近世末期以降。"
    ],
    basic_terms: "シルクロード：ユーラシア大陸を横断する交易路網、交易：地域間の物資・文化交換"
  }),
  q({
    subdomain: "地理",
    difficulty_initial: 200,
    cognitive_type: "基本的な適用",
    question_text: "日本で地震が多い主な地質的理由として最も適切なものはどれか。",
    choices: [
      "プレートの境界付近に位置している",
      "火山がないため地殻が安定している",
      "大陸の中心部にある",
      "海流の影響で地殻が動く"
    ],
    correct_choice_index: 0,
    short_explanation: "日本は複数のプレートが接する境界域にある。",
    detailed_explanation:
      "太平洋プレート・フィリピン海プレート・ユーラシアプレートなどの境界で断層運動や沈み込みが起こりやすい。",
    learning_objective: "プレート構造と地震の関係を説明できる",
    common_misconception: "火山活動だけが地震の原因だと考える",
    distractor_rationales: [
      "正解。プレート境界が地震の主因。",
      "不正解。日本は火山帯でもある。",
      "不正解。日本は島弧で周辺部にある。",
      "不正解。海流は地殻変動の原因ではない。"
    ],
    basic_terms: "プレート：地球表面を覆う岩石の大きな板、プレート境界：プレート同士が接する地域"
  }),
  q({
    subdomain: "統計学",
    difficulty_initial: 200,
    cognitive_type: "比較・分類",
    question_text: "データの「平均値」と「中央値」の違いとして最も適切なものはどれか。",
    choices: [
      "平均値は外れ値の影響を受けにくい",
      "中央値はデータを大小順に並べたときの中央の値",
      "両者は常に同じ値になる",
      "中央値は足し算して個数で割った値"
    ],
    correct_choice_index: 1,
    short_explanation: "中央値は順位の中央、平均値は算術平均。",
    detailed_explanation:
      "外れ値があると平均値は大きく動くが、中央値は比較的安定する。所得分布などで区別が重要。",
    learning_objective: "代表値の種類と特徴を区別できる",
    common_misconception: "平均値だけで分布の中心を把握できると考える",
    distractor_rationales: [
      "不正解。平均値の方が外れ値の影響を受けやすい。",
      "正解。中央値の定義。",
      "不正解。分布によって異なる。",
      "不正解。それは平均値の定義。"
    ],
    basic_terms: "平均値：データの算術平均、中央値：順位中央の値"
  }),
  q({
    subdomain: "科学哲学",
    difficulty_initial: 200,
    cognitive_type: "誤解・境界",
    question_text: "科学と非科学を区別する際に重視される基準の一例として最も適切なものはどれか。",
    choices: [
      "研究費の多さ",
      "観察や実験によって検証可能であること",
      "研究者の人数",
      "研究結果が常に正しいこと"
    ],
    correct_choice_index: 1,
    short_explanation: "科学は経験的検証可能性が重要な基準の一つ。",
    detailed_explanation:
      "ポパーは反証可能性を、他の立場は再現性や理論的整合性を重視する。いずれも経験的検討可能性に関わる。",
    learning_objective: "科学の特徴を非科学と区別して説明できる",
    common_misconception: "科学は一度証明されれば絶対に正しいと考える",
    distractor_rationales: [
      "不正解。資金規模は区別基準ではない。",
      "正解。経験的検証可能性。",
      "不正解。研究者数は無関係。",
      "不正解。科学も仮説の暫定性をもつ。"
    ],
    basic_terms: "経験的検証：観察・実験による確かめ、反証可能性：観察で反証されうる性質"
  }),
  q({
    subdomain: "経済学",
    difficulty_initial: 200,
    cognitive_type: "用語・定義",
    question_text: "「インフレ（インフレーション）」の意味として最も適切なものはどれか。",
    choices: [
      "物価水準が継続的に上昇する状態",
      "失業率が上昇する状態",
      "輸出が減少する状態",
      "通貨の価値が上昇する状態"
    ],
    correct_choice_index: 0,
    short_explanation: "インフレは物価水準の持続的上昇。",
    detailed_explanation:
      "インフレは貨幣の購買力低下を意味し、デフレは物価水準の持続的低下である。",
    learning_objective: "インフレの基本的定義を理解する",
    common_misconception: "物価が一時的に上がるだけをインフレと呼ぶ",
    distractor_rationales: [
      "正解。物価水準の継続的上昇。",
      "不正解。失業の話。",
      "不正解。貿易の話。",
      "不正解。通貨価値上昇はインフレと逆方向。"
    ],
    basic_terms: "インフレ：物価水準の持続的上昇、物価水準：経済全体の価格の平均的水準"
  }),
  q({
    subdomain: "心理学",
    difficulty_initial: 200,
    cognitive_type: "原理・因果",
    question_text: "スキナーの操作条件づけで、行動の頻度を増やすために与える結果を何と呼ぶか。",
    choices: ["罰", "消去", "強化", "抑制"],
    correct_choice_index: 2,
    short_explanation: "行動の後に与えられる結果で行動頻度を増やすのが強化。",
    detailed_explanation:
      "正の強化は望ましい刺激の付与、負の強化は嫌な刺激の除去により行動を増やす。",
    learning_objective: "操作条件づけにおける強化の概念を理解する",
    common_misconception: "強化と報酬だけを同一視し、負の強化を罰と混同する",
    distractor_rationales: [
      "不正解。行動頻度を減らす結果。",
      "不正解。強化の中止。",
      "正解。行動頻度を増やす結果。",
      "不正解。一般的な抑制用語。"
    ],
    basic_terms: "操作条件づけ：行動と結果の結合による学習、強化：行動頻度を増やす結果"
  }),
  q({
    subdomain: "社会学",
    difficulty_initial: 300,
    cognitive_type: "基本的な適用",
    question_text: "家族のような密接で長期的な関係をもつ集団を、社会学では一般に何と呼ぶか。",
    choices: ["二次的集団", "初次的集団", "形式組織", "大衆社会"],
    correct_choice_index: 1,
    short_explanation: "初次的集団は面对面的で感情的結合が強い。",
    detailed_explanation:
      "クーリーは初次的集団を自己形成の基盤とし、会社や学校などの二次的集団は目的志向的・非人格的関係が特徴。",
    learning_objective: "初次的集団と二次的集団を区別できる",
    common_misconception: "すべての集団を同じ種類だと考える",
    distractor_rationales: [
      "不正解。目的志向で非人格的な集団。",
      "正解。密接で長期的な面对面的集団。",
      "不正解。明確な役割分担をもつ組織。",
      "不正解。匿名性の高い社会の概念。"
    ],
    basic_terms: "初次的集団：密接で感情的結合の強い小集団、二次的集団：目的達成のための集団"
  }),
  q({
    subdomain: "哲学",
    difficulty_initial: 300,
    cognitive_type: "比較・分類",
    question_text: "「合理主義」と「経験主義」の対比として最も適切なものはどれか。",
    choices: [
      "合理主義は理性・演繹を重視し、経験主義は感覚経験・帰納を重視する",
      "合理主義は宗教のみを研究し、経験主義は科学を否定する",
      "両者は同じ立場である",
      "経験主義は数学を重視し、合理主義は観察を重視する"
    ],
    correct_choice_index: 0,
    short_explanation: "合理主義は先天的理性、経験主義は感覚経験を知識の源泉とする。",
    detailed_explanation:
      "デカルトやライプニッツは合理主義、ロックやヒュームは経験主義の代表である。",
    learning_objective: "近世哲学の主要立場を比較できる",
    common_misconception: "合理主義を「理性的でない人の立場」と誤解する",
    distractor_rationales: [
      "正解。知識の源泉に関する対比。",
      "不正解。双方とも哲学の認識論的立場。",
      "不正解。明確に区別される立場。",
      "不正解。重視する方法が逆。"
    ],
    basic_terms: "合理主義：理性を知識の主要源泉とする立場、経験主義：感覚経験を重視する立場"
  }),
  q({
    subdomain: "法学",
    difficulty_initial: 300,
    cognitive_type: "誤解・境界",
    question_text: "「民法上の不法行為」と「刑法上の犯罪」の違いとして最も適切なものはどれか。",
    choices: [
      "どちらも国だけが被害者になる",
      "不法行為は私人間の損害賠償、犯罪は国家による刑罰の対象",
      "犯罪は民事裁判のみで審理される",
      "不法行為は刑罰の対象である"
    ],
    correct_choice_index: 1,
    short_explanation: "民事は私人間の権利救済、刑事は国家による犯罪処罰。",
    detailed_explanation:
      "不法行為は損害賠償請求の問題、犯罪は訴追・有罪・刑罰という刑事手続の問題である。",
    learning_objective: "民事責任と刑事責任の違いを理解する",
    common_misconception: "違法行為はすべて刑事犯罪だと考える",
    distractor_rationales: [
      "不正解。民事では私人が当事者。",
      "正解。民事と刑事の目的の違い。",
      "不正解。犯罪は刑事裁判。",
      "不正解。不法行為は原則として刑罰対象ではない。"
    ],
    basic_terms: "不法行為：権利侵害に対する損害賠償責任、犯罪：刑法で禁止され刑罰の対象となる行為"
  }),
  q({
    subdomain: "政治学",
    difficulty_initial: 300,
    cognitive_type: "用語・定義",
    question_text: "モンテスキューが提唱した「三権分立」の三権として正しい組み合わせはどれか。",
    choices: [
      "立法・行政・司法",
      "軍事・経済・文化",
      "中央・地方・国際",
      "国王・貴族・平民"
    ],
    correct_choice_index: 0,
    short_explanation: "三権分立は立法・行政・司法の権力分立。",
    detailed_explanation:
      "モンテスキューは『法の精神』で権力の集中を抑えるための分立を論じ、近代立憲主義に影響した。",
    learning_objective: "三権分立の基本内容を説明できる",
    common_misconception: "三権を中央・地方・国際と混同する",
    distractor_rationales: [
      "正解。近代立憲国家の基本的分権。",
      "不正解。国家機能の一般的区分ではない。",
      "不正解。統治レベルの区分。",
      "不正解。身分制の区分。"
    ],
    basic_terms: "三権分立：立法・行政・司法の権力分立、立法：法律を制定する権力"
  }),
  q({
    subdomain: "歴史",
    difficulty_initial: 300,
    cognitive_type: "原理・因果",
    question_text: "1789年フランス革命の背景として最も重要な要因の一つはどれか。",
    choices: [
      "旧制度下の身分不平等と財政危機",
      "産業革命の完了",
      "植民地独立の失敗",
      "宗教戦争の再開"
    ],
    correct_choice_index: 0,
    short_explanation: "第三階級の不満と国家財政破綻が革命を促した。",
    detailed_explanation:
      "貴族・聖職者の特権、重税、食糧高騰、啓蒙思想の広がりが複合して革命へ至った。",
    learning_objective: "フランス革命の主要背景を説明できる",
    common_misconception: "革命を単一原因で説明する",
    distractor_rationales: [
      "正解。身分制と財政危機が核心要因。",
      "不正解。フランスの産業革命は革命後に進展。",
      "不正解。北米独立は影響したが直接原因ではない。",
      "不正解。宗教戦争再開ではない。"
    ],
    basic_terms: "旧制度：革命前フランスの身分制秩序、第三階級：平民・ブルジョワ階級"
  }),
  q({
    subdomain: "地理",
    difficulty_initial: 300,
    cognitive_type: "基本的な適用",
    question_text: "モンスーン気候の特徴として、農業に与える影響の説明として最も適切なものはどれか。",
    choices: [
      "一年中降水がほぼ一定で作物の区別がない",
      "季節風により雨季と乾季が分かれ、稲作などが発達しやすい",
      "永久凍土により農業が不可能",
      "砂漠化のみが進行する"
    ],
    correct_choice_index: 1,
    short_explanation: "季節風による雨季が水田農業を支える。",
    detailed_explanation:
      "南アジアや東南アジアでは夏季モンスーン降雨が稲作の基盤となり、乾季との対比が農業暦を形作る。",
    learning_objective: "モンスーン気候と農業の関係を説明できる",
    common_misconception: "モンスーンを単なる台風と混同する",
    distractor_rationales: [
      "不正解。季節変動が大きい。",
      "正解。雨季・乾季と稲作の関係。",
      "不正解。モンスーン気候帯の特徴ではない。",
      "不正解。砂漠化だけでは説明できない。"
    ],
    basic_terms: "モンスーン：季節風による気象現象、雨季：降水量が多い季節"
  }),
  q({
    subdomain: "統計学",
    difficulty_initial: 400,
    cognitive_type: "比較・分類",
    question_text: "「相関がある」と「因果関係がある」の関係として最も適切なものはどれか。",
    choices: [
      "相関があれば必ず因果関係がある",
      "因果関係があれば相関がみられることが多いが、相関だけでは因果とは限らない",
      "両者は無関係である",
      "因果関係があっても相関は現れない"
    ],
    correct_choice_index: 1,
    short_explanation: "相関は共変動、因果は原因と結果の関係であり同一ではない。",
    detailed_explanation:
      "疑似相関や第三変数により、相関だけから因果を断定できない。ランダム化実験などで因果推論を補強する。",
    learning_objective: "相関と因果の違いを説明できる",
    common_misconception: "相関係数の高さを因果の証拠とみなす",
    distractor_rationales: [
      "不正解。疑似相関の可能性がある。",
      "正解。相関は因果の必要条件ではない。",
      "不正解。因果はしばしば相関を伴う。",
      "不正解。因果があれば通常何らかの共変動がみられる。"
    ],
    basic_terms: "相関：二変数の共変動、因果関係：一方が他方の原因となる関係"
  }),
  q({
    subdomain: "科学哲学",
    difficulty_initial: 400,
    cognitive_type: "誤解・境界",
    question_text: "帰納法の問題点として、科学哲学でよく指摘されるものはどれか。",
    choices: [
      "観察回数を増やしても、一般化の論理的必然性は保証されない",
      "帰納法は数学で証明済みである",
      "観察は理論に影響されない",
      "帰納は常に誤りである"
    ],
    correct_choice_index: 0,
    short_explanation: "ヒュームの帰納問題：過去の反復から未来を必然的に推論できない。",
    detailed_explanation:
      "何度観察しても次の事例まで含めた普遍命題の論理的保証にはならない。科学は帰納に依拠しつつ仮説演繹法などで補強する。",
    learning_objective: "帰納法の論理的限界を理解する",
    common_misconception: "観察が増えれば科学的真理が完全に証明されると考える",
    distractor_rationales: [
      "正解。帰納の論理的飛躍の問題。",
      "不正解。論理的必然性は保証されない。",
      "不正解。観察は理論負荷的である。",
      "不正解。帰納は有用だが保証が弱い。"
    ],
    basic_terms: "帰納法：個別事例から一般法則を導く推論、帰納問題：帰納の論理的正当化の難しさ"
  }),
  q({
    subdomain: "経済学",
    difficulty_initial: 400,
    cognitive_type: "用語・定義",
    question_text: "経済学における「機会費用」の意味として最も適切なものはどれか。",
    choices: [
      "商品の市場価格",
      "ある選択をしたことで諦めた最大の価値",
      "生産に要した実際の支出",
      "政府が補助した金額"
    ],
    correct_choice_index: 1,
    short_explanation: "機会費用は最良の代替案の価値。",
    detailed_explanation:
      "資源は希少なので、一つの用途を選ぶと他の最良の用途を諦める。その価値が機会費用である。",
    learning_objective: "機会費用の概念を説明できる",
    common_misconception: "会計上の費用と機会費用を同一視する",
    distractor_rationales: [
      "不正解。市場価格は異なる概念。",
      "正解。諦めた最良代替の価値。",
      "不正解。それは顕在費用。",
      "不正解。補助金は機会費用の定義ではない。"
    ],
    basic_terms: "機会費用：選択により諦める最良代替の価値、希少性：資源が限られていること"
  }),
  q({
    subdomain: "心理学",
    difficulty_initial: 400,
    cognitive_type: "原理・因果",
    question_text: "フェスティンガーの認知的不協和理論が説明するのはどのような心理状態か。",
    choices: [
      "矛盾する信念や行動が同時に存在することによる不快",
      "記憶の完全な喪失",
      "睡眠中の学習",
      "集団内の同調圧力の消失"
    ],
    correct_choice_index: 0,
    short_explanation: "不協和は認知的緊張を生み、解消の動機づけとなる。",
    detailed_explanation:
      "態度と行動の不一致などで不協和が生じ、態度変更や正当化によって緊張を減らそうとする。",
    learning_objective: "認知的不協和の基本的メカニズムを説明できる",
    common_misconception: "不協和を単なる論理矛盾と同一視する",
    distractor_rationales: [
      "正解。不協和とその不快・解消動機。",
      "不正解。記憶障害の話。",
      "不正解。潜在学習の話。",
      "不正解。同調圧力の消失ではない。"
    ],
    basic_terms: "認知的不協和：矛盾する認知の共存による緊張、態度変更：信念や態度の変化"
  }),
  q({
    subdomain: "社会学",
    difficulty_initial: 400,
    cognitive_type: "基本的な適用",
    question_text: "ロバート・マートンの「アノミー理論」が説明しようとするのはどのような社会現象か。",
    choices: [
      "文化的目的と制度的手段の乖離による逸脱行動",
      "家族の機能の完全な喪失",
      "人口増加のみ",
      "技術革新の速度低下"
    ],
    correct_choice_index: 0,
    short_explanation: "成功目的は共有されるが正当手段へのアクセスが不均等なとき逸脱が生じる。",
    detailed_explanation:
      "マートンは適応型（革新・儀礼主義・退却主義・反逆）を提示し、社会構造と逸脱の関係を論じた。",
    learning_objective: "マートンのアノミー理論の要点を説明できる",
    common_misconception: "アノミーを単なる無法状態と理解する",
    distractor_rationales: [
      "正解。目的と手段の乖離。",
      "不正解。家族機能喪失は別理論。",
      "不正解。人口増加は直接の説明変数ではない。",
      "不正解。技術速度低下とは無関係。"
    ],
    basic_terms: "アノミー：規範の混乱・希薄化、逸脱行動：社会規範から外れた行動"
  }),
  q({
    subdomain: "哲学",
    difficulty_initial: 400,
    cognitive_type: "比較・分類",
    question_text: "義務論的倫理学と結果主義的倫理学の対比として最も適切なものはどれか。",
    choices: [
      "義務論は行為の動機や義務を重視し、結果主義は行為の結果の善さを重視する",
      "義務論は快楽のみを重視する",
      "結果主義は規則を完全に無視する",
      "両者は区別できない"
    ],
    correct_choice_index: 0,
    short_explanation: "カント的義務論と功利主義は倫理判断の基準が異なる。",
    detailed_explanation:
      "義務論は普遍化可能な格率や義務を問い、功利主義は最大多数の最大幸福など結果の善を基準とする。",
    learning_objective: "主要な倫理学立場を比較できる",
    common_misconception: "功利主義を「利己主義」と混同する",
    distractor_rationales: [
      "正解。判断基準の対比。",
      "不正解。快楽重視は功利主義の側。",
      "不正解。規則功利主義などもある。",
      "不正解。明確に区別される。"
    ],
    basic_terms: "義務論：義務や動機を重視する倫理学、結果主義：行為結果の善を重視する倫理学"
  }),
  q({
    subdomain: "法学",
    difficulty_initial: 500,
    cognitive_type: "誤解・境界",
    question_text: "実定法と自然法の対立について、最も適切な説明はどれか。",
    choices: [
      "実定法は実際に制定・適用される法、自然法は理性や正義に基づく超実定的法理念",
      "実定法は宗教法のみを指す",
      "自然法は成文法の別名である",
      "両者は常に同一の内容である"
    ],
    correct_choice_index: 0,
    short_explanation: "実定法は人為的実在、自然法は正義の理想的基準。",
    detailed_explanation:
      "実定法学は法の実効性と体系性を重視し、自然法学は不正な実定法にも批判基準を与える。",
    learning_objective: "実定法と自然法の基本的対比を理解する",
    common_misconception: "自然法を現行法令の別称と考える",
    distractor_rationales: [
      "正解。実在の法と理念的法の対比。",
      "不正解。実定法は国家法全般。",
      "不正解。自然法は超実定的理念。",
      "不正解。対立・区別される概念。"
    ],
    basic_terms: "実定法：実際に存在し適用される法、自然法：理性・正義に基づく法理念"
  }),
  q({
    subdomain: "政治学",
    difficulty_initial: 500,
    cognitive_type: "用語・定義",
    question_text: "近代国家論における「主権」の概念として最も適切なものはどれか。",
    choices: [
      "国家の最高の決定権",
      "個人の財産権",
      "地方自治体の財政権のみ",
      "国際機関の命令権"
    ],
    correct_choice_index: 0,
    short_explanation: "主権は国家の最高決定権・最終権力。",
    detailed_explanation:
      "ボダン以来、主権は国内最高権と対外的独立を含む概念として発展し、立憲主義では国民主権へと転化した。",
    learning_objective: "主権概念の基本的意味を説明できる",
    common_misconception: "主権を領土だけと同一視する",
    distractor_rationales: [
      "正解。国家の最高決定権。",
      "不正解。個人の権利。",
      "不正解。地方権限の一部。",
      "不正解。国際機関の権限。"
    ],
    basic_terms: "主権：国家の最高決定権、国民主権：主権が国民にあるという原理"
  }),
  q({
    subdomain: "歴史",
    difficulty_initial: 500,
    cognitive_type: "原理・因果",
    question_text: "イギリス産業革命の発生要因として最も重要な組み合わせはどれか。",
    choices: [
      "技術革新・資本蓄積・市場拡大・労働力供給",
      "封建領主の軍事力のみ",
      "植民地の完全放棄",
      "農業の完全停止"
    ],
    correct_choice_index: 0,
    short_explanation: "蒸気機関などの技術と資本・市場・労働が複合した。",
    detailed_explanation:
      "綿業機械、鉄道、石炭採掘、商業資本、海外市場、農業革命による余剰労働などが相互に作用した。",
    learning_objective: "産業革命の多面的要因を説明できる",
    common_misconception: "技術革新だけが原因だと単純化する",
    distractor_rationales: [
      "正解。技術・資本・市場・労働の複合。",
      "不正解。軍事力だけでは説明不足。",
      "不正解。植民地は市場・資源に関与。",
      "不正解。農業革命は前提となった。"
    ],
    basic_terms: "産業革命：機械化による生産方式の変革、資本蓄積：生産手段への投資の増大"
  }),
  q({
    subdomain: "地理",
    difficulty_initial: 500,
    cognitive_type: "基本的な適用",
    question_text: "クリストアラーの「中心地理論」が説明しようとするのはどれか。",
    choices: [
      "都市の階層と商業・サービスの供給範囲",
      "プレートの沈み込み",
      "大気循環の季節変化",
      "人口の自然増のみ"
    ],
    correct_choice_index: 0,
    short_explanation: "中心地は階層的に配置され、各レベルが異なる供給範囲をもつ。",
    detailed_explanation:
      "下限・上限の商圏、K=3,4,7などのモデルにより、都市体系の空間配置を説明する。",
    learning_objective: "中心地理論の基本的枠組みを説明できる",
    common_misconception: "すべての都市が同じ機能だと考える",
    distractor_rationales: [
      "正解。都市階層と商圏。",
      "不正解。地質学の話。",
      "不正解。気象学の話。",
      "不正解。人口動態だけではない。"
    ],
    basic_terms: "中心地理論：都市の階層的配置を説明する理論、商圏：商業・サービスの供給範囲"
  }),
  q({
    subdomain: "統計学",
    difficulty_initial: 500,
    cognitive_type: "比較・分類",
    question_text: "仮説検定における「第一種の過誤」と「第二種の過誤」の対比として正しいものはどれか。",
    choices: [
      "第一種：帰無仮説が真なのに棄却する、第二種：帰無仮説が偽なのに棄却しない",
      "第一種：帰無仮説が偽なのに棄却しない",
      "第二種：帰無仮説が真なのに棄却する",
      "両者は同じ意味である"
    ],
    correct_choice_index: 0,
    short_explanation: "第一種はα、第二種はβに対応する。",
    detailed_explanation:
      "第一種の過誤は偽陽性、第二種は偽陰性。検出力は1-βである。",
    learning_objective: "仮説検定の二種類の過誤を区別できる",
    common_misconception: "p値を第二種の過誤と混同する",
    distractor_rationales: [
      "正解。第一種・第二種の定義。",
      "不正解。それは第二種の過誤。",
      "不正解。それは第一種の過誤。",
      "不正解。明確に区別される。"
    ],
    basic_terms: "第一種の過誤：帰無が真で棄却する誤り、第二種の過誤：帰無が偽で棄却しない誤り"
  }),
  q({
    subdomain: "科学哲学",
    difficulty_initial: 500,
    cognitive_type: "誤解・境界",
    question_text: "トーマス・クーンの「通常科学」と「科学革命」の関係として最も適切なものはどれか。",
    choices: [
      "通常科学はパラダイム内の解題、科学革命はパラダイムの転換",
      "通常科学は非科学的活動である",
      "科学革命はデータの蓄積だけで起こる",
      "パラダイムは個人の好みにすぎない"
    ],
    correct_choice_index: 0,
    short_explanation: "通常科学は共有パラダイム下の研究、異常の蓄積が革命をもたらす。",
    detailed_explanation:
      "クーンは科学を単純な累積ではなく、パラダイム支配と革命的転換の交替として描いた。",
    learning_objective: "クーンの通常科学・科学革命の区別を説明できる",
    common_misconception: "科学革命を毎年の小さな発見と混同する",
    distractor_rationales: [
      "正解。パラダイム内研究と転換。",
      "不正解。通常科学は科学の主要段階。",
      "不正解。単純蓄積ではない。",
      "不正解。パラダイムは共同体の共有枠組み。"
    ],
    basic_terms: "通常科学：パラダイム内の解題活動、科学革命：パラダイムの全面的転換"
  }),
  q({
    subdomain: "経済学",
    difficulty_initial: 600,
    cognitive_type: "用語・定義",
    question_text: "消費者理論における「限界代替率（MRS）」の意味として最も適切なものはどれか。",
    choices: [
      "ある財を1単位増やすために諦める他財の量（効用一定）",
      "総所得の増分",
      "市場価格の比率のみ",
      "固定費の増加率"
    ],
    correct_choice_index: 0,
    short_explanation: "MRSは無差別曲線の傾きで、効用水準一定での交換率。",
    detailed_explanation:
      "最適消費ではMRSが価格比と等しくなる。代替の限界量を示す。",
    learning_objective: "限界代替率の定義を説明できる",
    common_misconception: "MRSを価格比と常に同一と考える",
    distractor_rationales: [
      "正解。効用一定での代替率。",
      "不正解。所得の概念。",
      "不正解。価格比は均衡条件。",
      "不正解。固定費とは無関係。"
    ],
    basic_terms: "限界代替率：効用一定で財を代替する比率、無差別曲線：同一効用の消費組合せ"
  }),
  q({
    subdomain: "心理学",
    difficulty_initial: 600,
    cognitive_type: "原理・因果",
    question_text: "バッドレーのワーキングメモリモデルにおいて、音韻ループが担う処理はどれか。",
    choices: [
      "長期記憶の永久保存",
      "小脳による運動学習",
      "音声・言語情報の一時保持",
      "視覚空間スケッチパッドの制御"
    ],
    correct_choice_index: 2,
    short_explanation: "音韻ループは音声コードによる短期保持と発音リハーサルを担う。",
    detailed_explanation:
      "ワーキングメモリは中央実行系・音韻ループ・視覚空間スケッチパッド・エピソードバッファから構成される。",
    learning_objective: "ワーキングメモリのサブシステムを区別できる",
    common_misconception: "ワーキングメモリを長期記憶と同一視する",
    distractor_rationales: [
      "不正解。長期記憶の機能。",
      "不正解。運動制御の領域。",
      "正解。音韻ループの機能。",
      "不正解。視覚空間スケッチパッドの領域。"
    ],
    basic_terms: "ワーキングメモリ：作業中の情報を保持する短期記憶系、音韻ループ：音声情報の一時保持"
  }),
  q({
    subdomain: "社会学",
    difficulty_initial: 600,
    cognitive_type: "基本的な適用",
    question_text: "ピエール・ブルデューの「文化資本」が社会的不平等の再生産に関わる仕組みとして最も適切なものはどれか。",
    choices: [
      "経済資本のみが教育成果を決定する",
      "家族から受け継ぐ文化的資源が教育・地位獲得に影響する",
      "文化資本は所得に無関係である",
      "すべての階層で同一の文化資本が配分される"
    ],
    correct_choice_index: 1,
    short_explanation: "文化資本は学校教育で正当化され階層再生産に寄与する。",
    detailed_explanation:
      "具身的・客体的・制度化的文化資本が、学業成就や趣味・態度を通じて社会的位置を再生産する。",
    learning_objective: "ブルデューの文化資本概念を説明できる",
    common_misconception: "文化資本を単なる教養趣味と軽視する",
    distractor_rationales: [
      "不正解。ブルデューは多様な資本を論じる。",
      "正解。文化資本の再生産メカニズム。",
      "不正解。教育・地位と関連する。",
      "不正解。階層により配分は異なる。"
    ],
    basic_terms: "文化資本：文化的資源・能力の蓄積、階層再生産：社会的不平等の世代間継承"
  }),
  q({
    subdomain: "哲学",
    difficulty_initial: 600,
    cognitive_type: "比較・分類",
    question_text: "「分析哲学」と「大陸哲学」の対比として、一般に重視される点の違いとして最も適切なものはどれか。",
    choices: [
      "分析哲学は論理分析・言語の明確化を、大陸哲学は歴史性・存在・解釈を重視する傾向",
      "分析哲学はヨーロッパ大陸のみで行われる",
      "大陸哲学は数学を唯一の方法とする",
      "両者は方法論的に区別できない"
    ],
    correct_choice_index: 0,
    short_explanation: "地理的ラベルだが、方法・問題意識の違いを示す。",
    detailed_explanation:
      "分析哲学はフレーゲ・ラッセル以来論理・言語分析を重視し、大陸側はフッサール・ハイデガー以来現象学・解釈学などを展開した。",
    learning_objective: "近現代哲学の主要潮流を比較できる",
    common_misconception: "分析哲学を「論理的でない哲学」と誤解する",
    distractor_rationales: [
      "正解。方法・問題意識の対比。",
      "不正解。分析哲学は英米でも発展。",
      "不正解。大陸哲学は数学唯一ではない。",
      "不正解。方法論的差異が指摘される。"
    ],
    basic_terms: "分析哲学：論理・言語分析を重視する哲学、大陸哲学：大陸欧州由来の哲学潮流"
  }),
  q({
    subdomain: "法学",
    difficulty_initial: 600,
    cognitive_type: "誤解・境界",
    question_text: "H.L.A.ハートの法概念論における「一次規則」と「二次規則」の区別として最も適切なものはどれか。",
    choices: [
      "一次規則は義務を定め、二次規則は法の創設・変更・適用の方法を定める",
      "一次規則は憲法のみ、二次規則は刑法のみ",
      "二次規則は道徳規範の別名である",
      "両者の区別はハートに存在しない"
    ],
    correct_choice_index: 0,
    short_explanation: "二次規則（承認・変更・裁判の規則）が法体系を可能にする。",
    detailed_explanation:
      "ハートは承認の規則を含む二次規則が、単なる一次規則の集合を法体系へと転換すると論じた。",
    learning_objective: "ハートの一次・二次規則の区別を説明できる",
    common_misconception: "承認の規則をケルゼンの根本規範と同一視する",
    distractor_rationales: [
      "正解。義務規定とメタ規則の区別。",
      "不正解。部門法の区分ではない。",
      "不正解。法の二次規則は法制度の規則。",
      "不正解。ハートの核心概念。"
    ],
    basic_terms: "一次規則：義務を内容とする規則、二次規則：法の創設・適用を可能にする規則"
  }),
  q({
    subdomain: "政治学",
    difficulty_initial: 700,
    cognitive_type: "用語・定義",
    question_text: "ロバート・ダールが「ポリアルキー（複多元主義）」で描いた政治体制の特徴として最も適切なものはどれか。",
    choices: [
      "競合する複数の政治集団が公開的に競争し、参政が広く認められる",
      "一人の独裁者が永続的に統治する",
      "選挙が完全に禁止されている",
      "すべての意思決定が直接民主制のみで行われる"
    ],
    correct_choice_index: 0,
    short_explanation: "ポリアルキーは現実的な多元的政治競争のモデル。",
    detailed_explanation:
      "ダールは理想的な多元主義と現実のポリアルキーを区別し、競合・参政・表現の公開性などを指標とした。",
    learning_objective: "ダールのポリアルキー概念を説明できる",
    common_misconception: "民主主義を完全な人民統治と理想化する",
    distractor_rationales: [
      "正解。複数集団の公開的競争。",
      "不正解。独裁の説明。",
      "不正解。選挙禁止は対極。",
      "不正解。直接民主制のみではない。"
    ],
    basic_terms: "ポリアルキー：複数政治集団が競合する現実的政治体制、多元主義：複数の利益・価値の共存"
  }),
  q({
    subdomain: "歴史",
    difficulty_initial: 700,
    cognitive_type: "原理・因果",
    question_text: "アナール学派が歴史研究で重視した「長期（ロンク・デュレエ）」の意味として最も適切なものはどれか。",
    choices: [
      "事件史のみを詳述する",
      "長期にわたる構造・潮流を分析の中心に置く",
      "個人の日記だけを史料とする",
      "政治史を完全に排除する"
    ],
    correct_choice_index: 1,
    short_explanation: "ブローデルらは地理・経済・社会の長期構造を重視した。",
    detailed_explanation:
      "『地中海』の三層時間論など、事件の背後にある長期構造と中期周期を分析対象とした。",
    learning_objective: "アナール学派の方法論的特徴を説明できる",
    common_misconception: "長期史を単なる年表の延長と考える",
    distractor_rationales: [
      "不正解。事件史偏重は批判対象。",
      "正解。長期構造分析。",
      "不正解。史料は多様。",
      "不正解。政治を完全排除したわけではない。"
    ],
    basic_terms: "アナール学派：フランスの歴史学派、長期（ロンク・デュレエ）：長期にわたる歴史構造"
  }),
  q({
    subdomain: "地理",
    difficulty_initial: 700,
    cognitive_type: "基本的な適用",
    question_text: "デイヴィッド・ハーヴェイが資本主義と空間の関係で論じた「時間－空間の圧縮」の意味として最も適切なものはどれか。",
    choices: [
      "交通・通信の発達により移動・情報伝達に要する時間が短縮され空間的距離感が変化する",
      "地球の物理的サイズが縮小する",
      "すべての地域が同一の文化になる",
      "資本主義が消滅する"
    ],
    correct_choice_index: 0,
    short_explanation: "資本は空間修復と時間短縮によって危機を乗り越えようとする。",
    detailed_explanation:
      "ハーヴェイは近代以降の交通・通信革命が資本蓄積と結びつき、グローバルな空間再編をもたらすと分析した。",
    learning_objective: "ハーヴェイの時間－空間圧縮概念を説明できる",
    common_misconception: "圧縮を物理的に地球が小さくなることと混同する",
    distractor_rationales: [
      "正解。移動・通信の時間短縮による空間感覚の変化。",
      "不正解。物理サイズの変化ではない。",
      "不正解。文化の均質化だけではない。",
      "不正解。資本主義消滅の話ではない。"
    ],
    basic_terms: "時間－空間の圧縮：移動・通信短縮による空間感覚の変化、空間修復：資本の空間的危機対応"
  }),
  q({
    subdomain: "統計学",
    difficulty_initial: 700,
    cognitive_type: "比較・分類",
    question_text: "p値の解釈について、統計教育で注意される点として最も適切なものはどれか。",
    choices: [
      "p値は帰無仮説が真である確率そのものである",
      "p値はデータが帰無仮説の下で観察される確率の指標であり、仮説の真偽の直接確率ではない",
      "p値が小さいほど効果量が必ず大きい",
      "p値は実験の倫理的妥当性を示す"
    ],
    correct_choice_index: 1,
    short_explanation: "p値は帰無仮説下でのデータの極端さの指標。",
    detailed_explanation:
      "Neyman-Pearsonの棄却基準と混同されやすい。効果量・信頼区間・再現性と併せて解釈すべきである。",
    learning_objective: "p値の正しい解釈を説明できる",
    common_misconception: "p値を帰無仮説の真である確率と誤解する",
    distractor_rationales: [
      "不正解。よくある誤解。",
      "正解。帰無仮説下での確率指標。",
      "不正解。効果量とは別。",
      "不正解。倫理指標ではない。"
    ],
    basic_terms: "p値：帰無仮説下で観察値以上に極端な結果が得られる確率、効果量：差の大きさの指標"
  }),
  q({
    subdomain: "科学哲学",
    difficulty_initial: 700,
    cognitive_type: "誤解・境界",
    question_text: "イムレ・ラカトスが提唱した「研究プログラム」の評価基準として最も適切なものはどれか。",
    choices: [
      "単一仮説の確認事例の数だけ",
      "硬核を保ちつつ保護帯で予測を修正し、進歩的か退化かを見る",
      "パラダイムの完全な即時転換",
      "反証された理論を常に即座に放棄する"
    ],
    correct_choice_index: 1,
    short_explanation: "ラカトスは理論の連続性と進歩性を研究プログラム単位で評価した。",
    detailed_explanation:
      "硬核・保護帯・ヒューリスティックの区別により、クーンとポパーの中間的立場を提示した。",
    learning_objective: "ラカトスの研究プログラム概念を説明できる",
    common_misconception: "ラカトスを単純なポパー主義と同一視する",
    distractor_rationales: [
      "不正解。確認主義的単純基準。",
      "正解。進歩的・退化的研究プログラム。",
      "不正解。即時転換ではない。",
      "不正解。ポパー的即時放棄ではない。"
    ],
    basic_terms: "研究プログラム：理論の連続的発展単位、硬核：プログラムの不可侵的核心"
  }),
  q({
    subdomain: "経済学",
    difficulty_initial: 800,
    cognitive_type: "用語・定義",
    question_text: "アローの不可能性定理が示す内容として最も適切なものはどれか。",
    choices: [
      "すべての個人の完全な選好順序を満たす合理的な社会福祉関数は、一定の条件の下では存在しない",
      "市場は常に完全競争均衡に収束する",
      "投票は常に単一の勝者を決定できる",
      "効用は常にカーディナルに測定できる"
    ],
    correct_choice_index: 0,
    short_explanation: "無限定域・パレート・独立性・非独裁の条件下で社会選択関数は存在しない。",
    detailed_explanation:
      "アローは合理的な社会意思決定の限界を示し、社会選択理論の基礎となった。",
    learning_objective: "アローの不可能性定理の要点を説明できる",
    common_misconception: "民主的投票が常に一貫した社会選好を生むと考える",
    distractor_rationales: [
      "正解。社会福祉関数の不可能性。",
      "不正解。一般均衡の話。",
      "不正解。投票悖论の可能性がある。",
      "不正解。序数効用が基本。"
    ],
    basic_terms: "不可能性定理：合理的社会選択の限界、パレート効率：誰かを悪化させずに改善できない状態"
  }),
  q({
    subdomain: "心理学",
    difficulty_initial: 800,
    cognitive_type: "原理・因果",
    question_text: "強化学習における時間差分（TD）誤差が神経科学的にドーパミン放出と対応づけられる根拠として最も適切なものはどれか。",
    choices: [
      "報酬予測誤差を符号づけした信号として機能する",
      "ドーパミンは記憶形成と無関係である",
      "TD誤差は感覚閾値のみを表す",
      "強化学習は行動心理学と無関係である"
    ],
    correct_choice_index: 0,
    short_explanation: "シュルツらはドーパミンが報酬予測誤差を符号化すると示した。",
    detailed_explanation:
      "TD学習の誤差信号とミッドブレイン・ドーパミン神経の活動パターンが対応し、学習理論と神経科学が接続された。",
    learning_objective: "強化学習とドーパミン信号の対応を説明できる",
    common_misconception: "ドーパミンを快楽物質だけと理解する",
    distractor_rationales: [
      "正解。報酬予測誤差の符号づけ。",
      "不正解。学習・動機づけと関連。",
      "不正解。予測誤差の話。",
      "不正解。行動心理学の発展系。"
    ],
    basic_terms: "時間差分学習：将来報酬の予測誤差で学習する手法、報酬予測誤差：予測と実際の報酬の差"
  }),
  q({
    subdomain: "社会学",
    difficulty_initial: 800,
    cognitive_type: "基本的な適用",
    question_text: "ニクラス・ルーマンの社会システム論における「オートポイエーシス（自己創出）」の意味として最も適切なものはどれか。",
    choices: [
      "システムが環境から完全に独立して存在する",
      "システムが自らの要素と操作によって自らを再生産する",
      "社会は単一の中心権力によって統制される",
      "システムは閉じており外界との区別がない"
    ],
    correct_choice_index: 1,
    short_explanation: "社会システムはコミュニケーションによって自らを再生産する。",
    detailed_explanation:
      "ルーマンは社会をコミュニケーションの自己言及的ネットワークとみなし、機能分化した自己参照的システムとして分析した。",
    learning_objective: "ルーマンのオートポイエーシス概念を説明できる",
    common_misconception: "オートポイエーシスを完全な孤立と混同する",
    distractor_rationales: [
      "不正解。環境との区別は重要。",
      "正解。自己再生産の定義。",
      "不正解。中心統制モデルではない。",
      "不正解。システム/環境の区別を前提とする。"
    ],
    basic_terms: "オートポイエーシス：自己創出・自己再生産、社会システム：コミュニケーションによる自己参照的システム"
  }),
  q({
    subdomain: "哲学",
    difficulty_initial: 800,
    cognitive_type: "比較・分類",
    question_text: "デュヘム＝クワイン論題が主張する内容として最も適切なものはどれか。",
    choices: [
      "単一の仮説は孤立して検証できず、補助仮説とまとめて検証される",
      "すべての理論は即座に決定的に反証される",
      "観察は理論に一切影響されない",
      "科学は完全な確実性を達成する"
    ],
    correct_choice_index: 0,
    short_explanation: "仮説の検証は理論全体のネットワークに依存する。",
    detailed_explanation:
      "異常が生じても補助仮説を修正して理論核を保護できるため、反証は単純ではない。",
    learning_objective: "デュヘム＝クワイン論題の要点を説明できる",
    common_misconception: "反証があれば必ず中核仮説が棄却されると考える",
    distractor_rationales: [
      "正解。仮説の孤立検証の不可能性。",
      "不正解。ポパー的単純反証主義とは異なる。",
      "不正解。観察の理論負荷性を否定する。",
      "不正解。確実性の達成を主張しない。"
    ],
    basic_terms: "デュヘム＝クワイン論題：仮説の孤立検証の不可能性、補助仮説：検証に必要な背景前提"
  }),
  q({
    subdomain: "法学",
    difficulty_initial: 800,
    cognitive_type: "誤解・境界",
    question_text: "ハンス・ケルゼンの純粋法学において、法秩序全体の最終的な妥当根拠として想定される仮設的規範を何と呼ぶか。",
    choices: [
      "根本規範（グルントノルム）",
      "自然法",
      "主権",
      "承認の規則"
    ],
    correct_choice_index: 0,
    short_explanation: "ケルゼンは法の段階構造の頂点に根本規範を置く。",
    detailed_explanation:
      "個別規範→法律→憲法→根本規範という段階構造の終点として、実定法外部の思考上の仮設を想定した。",
    learning_objective: "ケルゼンの根本規範概念を類似概念と区別できる",
    common_misconception: "根本規範を憲法そのものと混同する",
    distractor_rationales: [
      "正解。ケルゼンの根本規範。",
      "不正解。超実定的自然法概念。",
      "不正解。国家学の主権概念。",
      "不正解。ハートの承認の規則。"
    ],
    basic_terms: "純粋法学：規範の形式的分析に純化する法学、根本規範：法秩序の最終的妥当根拠の仮設"
  }),
  q({
    subdomain: "政治学",
    difficulty_initial: 900,
    cognitive_type: "用語・定義",
    question_text: "カール・シュミットが「制憲権力（ポテスタス・コンスティトゥエンダ）」と区別して論じた概念として最も適切なものはどれか。",
    choices: [
      "既存憲法の範囲内で統治する「憲法実現権力（ポテスタス・コンスティトゥータ）」",
      "国際連合の立法権",
      "地方自治体の財政権",
      "裁判所の違憲審査権のみ"
    ],
    correct_choice_index: 0,
    short_explanation: "制憲権力は新たな政治秩序を創出する力、憲法実現権力は既存憲法下の統治。",
    detailed_explanation:
      "シュミットは例外状態と制憲権力を論じ、憲法秩序の創出と運用の区別を重視した。",
    learning_objective: "シュミットの制憲権力概念を説明できる",
    common_misconception: "制憲権力を通常の憲法改正手続と同一視する",
    distractor_rationales: [
      "正解。創出と実現の区別。",
      "不正解。国際機関の権限。",
      "不正解。地方財政権。",
      "不正解。司法権のみではない。"
    ],
    basic_terms: "制憲権力：新たな憲法秩序を創出する権力、憲法実現権力：既存憲法下の統治権力"
  }),
  q({
    subdomain: "歴史",
    difficulty_initial: 900,
    cognitive_type: "原理・因果",
    question_text: "サブアルタン研究（従属史研究）が歴史学に与えた主な問いかけとして最も適切なものはどれか。",
    choices: [
      "植民地支配下の下層民・抑圧された声の歴史をどう記述・回復するか",
      "すべての歴史を欧米中心の進歩史のみで説明する",
      "史料を不要とする",
      "経済史のみが正当な歴史である"
    ],
    correct_choice_index: 0,
    short_explanation: "ガヤトリ・スピヴァクらは従属者の表象の政治を問った。",
    detailed_explanation:
      "インドのサブアルタン・スタディーズ・グループは、ナショナリズム史の公式叙事から逸脱する下層の政治を探究した。",
    learning_objective: "サブアルタン研究の方法論的意義を説明できる",
    common_misconception: "後期植民地主義研究を単なる政治宣伝とみなす",
    distractor_rationales: [
      "正解。下層・抑圧された声の歴史。",
      "不正解。欧米中心主義を批判。",
      "不正解。史料解釈を重視。",
      "不正解。経済史のみではない。"
    ],
    basic_terms: "サブアルタン研究：従属者・下層の歴史を探究する史学潮流、後期植民地主義：植民地主義の文化的遺産の分析"
  }),
  q({
    subdomain: "地理",
    difficulty_initial: 900,
    cognitive_type: "基本的な適用",
    question_text: "人文地理学における「アセンブラージ（集合体）」理論が空間を捉える方式として最も適切なものはどれか。",
    choices: [
      "空間を固定された容器としてのみ理解する",
      "人・物・表象・実践が関係的に結びつき動的に生成する過程として捉える",
      "国家境界のみが空間を決定する",
      "自然環境が文化を完全に決定する"
    ],
    correct_choice_index: 1,
    short_explanation: "デリューズ/ガタリ由来の概念が人文地理で関係的・生成的空間理解に用いられる。",
    detailed_explanation:
      "都市・ネットワーク・インフラなどが固定的実体ではなく、要素の接続と切断によって生じると理解される。",
    learning_objective: "アセンブラージ理論の空間観を説明できる",
    common_misconception: "アセンブラージを単なる物体の集まりと理解する",
    distractor_rationales: [
      "不正解。容器論的空間観を超える。",
      "正解。関係的・生成的理解。",
      "不正解。国家境界だけではない。",
      "不正解。環境決定論ではない。"
    ],
    basic_terms: "アセンブラージ：要素が関係的に結合した集合体、関係的空間：要素の関係から生じる空間"
  }),
  q({
    subdomain: "統計学",
    difficulty_initial: 900,
    cognitive_type: "比較・分類",
    question_text: "因果推論における「ポテンシャルアウトカム枠組み（ルビン因果モデル）」の基本的考え方として最も適切なものはどれか。",
    choices: [
      "個人ごとに処置を受けた場合と受けなかった場合の両方の結果を比較する反実仮想",
      "相関係数だけで因果を証明する",
      "因果は観察不可能なので研究不要である",
      "ランダム化は因果推論に無関係である"
    ],
    correct_choice_index: 0,
    short_explanation: "個人レベルの処置効果は反実仮想の差として定義される。",
    detailed_explanation:
      "同時に処置・非処置の両結果は観察できない（根本的問題）。ランダム化や識別戦略で平均処置効果を推定する。",
    learning_objective: "ポテンシャルアウトカム枠組みの基本を説明できる",
    common_misconception: "観察データの相関を因果と同一視する",
    distractor_rationales: [
      "正解。反実仮想による因果定義。",
      "不正解。相関だけでは不十分。",
      "不正解。識別戦略が発展している。",
      "不正解。ランダム化は重要な識別手段。"
    ],
    basic_terms: "ポテンシャルアウトカム：処置の有無による結果の反実仮想、識別：因果効果を推定可能にする条件"
  }),
  q({
    subdomain: "科学哲学",
    difficulty_initial: 900,
    cognitive_type: "誤解・境界",
    question_text: "「経験データによる理論の決定不足（アンダーディターミネーション）」が意味することとして最も適切なものはどれか。",
    choices: [
      "観察データと矛盾しない複数の理論が競合しうる",
      "すべての理論が常に観察と矛盾する",
      "理論は観察に一切依存しない",
      "データが増えれば常に単一理論に収束する"
    ],
    correct_choice_index: 0,
    short_explanation: "同じ観察に適合する理論が複数存在しうる。",
    detailed_explanation:
      "クワインは経験主義の二つのドグマを批判し、理論全体のホーリズムと決定不足を論じた。",
    learning_objective: "決定不足問題の意味を説明できる",
    common_misconception: "一度の実験で理論が唯一に決まると考える",
    distractor_rationales: [
      "正解。複数理論の競合可能性。",
      "不正解。適合理論が存在しうる。",
      "不正解。観察との関係を重視する。",
      "不正解。単一収束は保証されない。"
    ],
    basic_terms: "決定不足：データだけでは理論が一意に決まらないこと、理論のホーリズム：理論は全体として観察と関係する"
  })
];

const balanced = raw.map((item, i) => balance(item, i % 4));
writeFileSync(OUT, JSON.stringify(balanced, null, 2) + "\n", "utf8");
console.log(`Wrote ${balanced.length} questions to ${OUT}`);
