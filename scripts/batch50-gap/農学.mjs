import { q } from "../lib/batch50-helpers.mjs";

export const agricultureGap = [
  // L100 ×1
  q({
    domain: "農学",
    subdomain: "作物",
    difficulty_initial: 100,
    cognitive_type: "用語・定義",
    question_text: "米の原料となるイネについての説明として正しいものはどれか。",
    choices: [
      "イネは果菜類である",
      "イネは根菜類である",
      "イネは穀物（穀類）である",
      "イネは豆類である"
    ],
    correct_choice_index: 2,
    short_explanation: "イネはイネ科の穀物で、種子（玄米）を食用とする。",
    detailed_explanation: "イネ（Oryza sativa）はイネ科の一年生草本で、穀物に分類される。根菜・豆類・果菜とは異なる作物群である。",
    learning_objective: "主要穀物の分類を説明できる",
    common_misconception: "米を野菜や豆類と混同する",
    distractor_rationales: [
      "不正解。果菜は果実を食用とする野菜群。",
      "不正解。根菜は地下部を食用とする野菜群。",
      "正解。イネは穀物（穀類）に分類される。",
      "不正解。豆類はマメ科などの作物群。"
    ],
    basic_terms: "穀物：穀粒を食用とする作物、イネ：米の作物"
  }),

  // L200 ×5
  q({
    domain: "農学",
    subdomain: "土壌",
    difficulty_initial: 200,
    cognitive_type: "原理・因果",
    question_text: "植物が根から土壌中の水を吸い上げる主な要因として正しいものはどれか。",
    choices: [
      "根の蒸発散",
      "根毛付近の浸透圧勾配",
      "葉の光合成速度",
      "茎の径成長"
    ],
    correct_choice_index: 1,
    short_explanation: "根毛細胞の溶質濃度が高く、浸透圧勾配により水が根に入る。",
    detailed_explanation: "根毛は吸収面積を増やし、細胞内の溶質濃度が高いことで水が低濃度側から移動する。蒸発散は主に葉で起こる。",
    learning_objective: "根の水分吸収の基本原理を説明できる",
    common_misconception: "根が水を押し出す力で吸い上げると考える",
    distractor_rationales: [
      "不正解。蒸発散は主に葉で起こる。",
      "正解。浸透圧勾配により水が根に入る。",
      "不正解。光合成は水吸収の直接要因ではない。",
      "不正解。径成長と水分吸収は別の過程。"
    ],
    basic_terms: "浸透圧：溶質濃度差による水の移動圧、根毛：根の吸収面積を増やす突起"
  }),
  q({
    domain: "農学",
    subdomain: "栽培",
    difficulty_initial: 200,
    cognitive_type: "用語・定義",
    question_text: "「追肥」の意味として正しいものはどれか。",
    choices: [
      "種まき前に土壌全体に施す基肥",
      "生育期の途中で作物に追加する肥料",
      "収穫後に土壌に施す肥料",
      "石灰を混ぜてpHを上げる作業"
    ],
    correct_choice_index: 1,
    short_explanation: "追肥は生育期に追加施用し、必要な時期に養分を補う。",
    detailed_explanation: "基肥は定植前、追肥は生育期（例：トウモロコシの穂肥）に施用する。目的は生育段階に応じた養分供給。",
    learning_objective: "基肥と追肥の違いを説明できる",
    common_misconception: "すべての肥料は定植前にまとめて施すと考える",
    distractor_rationales: [
      "不正解。これは基肥の説明。",
      "正解。生育期の追加施肥。",
      "不正解。収穫後施用は一般に追肥ではない。",
      "不正解。石灰施用はpH改良であり追肥の定義ではない。"
    ],
    basic_terms: "追肥：生育期に追加する肥料、基肥：定植前に土壌全体に施す肥料"
  }),
  q({
    domain: "農学",
    subdomain: "畜産",
    difficulty_initial: 200,
    cognitive_type: "原理・因果",
    question_text: "牛が反芻（もどしぐい）を行う理由として最も適切なものはどれか。",
    choices: [
      "繁殖行動の一部であるため",
      "肉を発達させるため",
      "ルーメン内の食物を再咀嚼し消化を促進するため",
      "水を体内に貯えるため"
    ],
    correct_choice_index: 2,
    short_explanation: "反芻は粗飼料を再咀嚼してルーメン発酵と消化を効率化する行動。",
    detailed_explanation: "反芻動物は一度飲み込んだ食物をルーメンから逆戻し再咀嚼する。繊維素分解と栄養吸収が促進される。",
    learning_objective: "反芻行動の生理的意義を説明できる",
    common_misconception: "反芻を単なる習慣や水貯蔵と考える",
    distractor_rationales: [
      "不正解。繁殖行動とは別の消化行動。",
      "不正解。筋肉発達とは直接の関係がない。",
      "正解。再咀嚼により消化効率が高まる。",
      "不正解。反芻は水貯蔵の行動ではない。"
    ],
    basic_terms: "反芻：食物を再咀嚼する行動、ルーメン：反芻動物の第一胃"
  }),
  q({
    domain: "農学",
    subdomain: "栽培",
    difficulty_initial: 200,
    cognitive_type: "基本的な適用",
    question_text: "同じ畑で同じ作物を毎年続けて作付けすると、土壌病害や害虫が増えやすくなる主な理由として最も適切なものはどれか。",
    choices: [
      "連作により同じ病原体・害虫の宿主が続くから",
      "深耕により病原体が消滅するから",
      "基肥を施さないから",
      "日照時間が短くなるから"
    ],
    correct_choice_index: 0,
    short_explanation: "連作は同じ宿主を与え続け、土壌中の病原体・害虫が蓄積しやすい。",
    detailed_explanation: "連作障害の一因は病原菌・線虫・害虫の増加。輪作は宿主を断ち、土壌・生育環境を改善する。",
    learning_objective: "連作障害と輪作の目的を説明できる",
    common_misconception: "連作でも病害虫は必ず減ると考える",
    distractor_rationales: [
      "正解。連作により同じ宿主が続き病害虫が増えやすい。",
      "不正解。深耕だけでは連作障害は防げない。",
      "不正解。施肥の有無が主因ではない。",
      "不正解。日照は連作障害の主因ではない。"
    ],
    basic_terms: "連作：同じ作物を同じ畑で続けて作付けすること、輪作：異なる作物を順番に作付けること"
  }),
  q({
    domain: "農学",
    subdomain: "土壌",
    difficulty_initial: 200,
    cognitive_type: "比較・分類",
    question_text: "有機物を堆肥化して畑に戻す主な目的として最も適切なものはどれか。",
    choices: [
      "土壌の保水力と微生物活性を高める",
      "土壌pHを必ず酸性にする",
      "土壌中の窒素をすべて除去する",
      "土壌温度を常に下げる"
    ],
    correct_choice_index: 0,
    short_explanation: "堆肥は有機物を分解し、保水・通気・微生物環境を改善する。",
    detailed_explanation: "堆肥化により有機物が腐植質化し、CECや保水性が向上し、緩効性養分も供給される。",
    learning_objective: "堆肥施用の効果を説明できる",
    common_misconception: "堆肥は主にpHを下げるためだと考える",
    distractor_rationales: [
      "正解。保水力・微生物活性の改善が主目的。",
      "不正解。堆肥は一般にpHを酸性に固定しない。",
      "不正解。有機物は窒素源にもなる。",
      "不正解。土壌温度低下が主目的ではない。"
    ],
    basic_terms: "堆肥：有機物を発酵・腐熟させた肥料、保水力：土壌が水を保持する能力"
  }),

  // L300 ×5
  q({
    domain: "農学",
    subdomain: "作物生理学",
    difficulty_initial: 300,
    cognitive_type: "比較・分類",
    question_text: "高温・強光・乾燥条件で光合成効率が高い傾向がある作物群として正しいものはどれか。",
    choices: [
      "C3植物",
      "C4植物",
      "CAM植物のみ",
      "すべての豆類"
    ],
    correct_choice_index: 1,
    short_explanation: "C4植物はCO₂濃縮機構により光呼吸が抑制され、高温強光下で効率が高い。",
    detailed_explanation: "トウモロコシ・サトウキビなどC4作物はメソシル型CO₂ポンプを持ち、C3より高温環境で有利。",
    learning_objective: "C3・C4植物の光合成特性の違いを説明できる",
    common_misconception: "すべての作物が同じ光合成機構を持つと考える",
    distractor_rationales: [
      "不正解。C3は光呼吸の影響を受けやすい。",
      "正解。C4植物は高温・強光で有利。",
      "不正解。CAM植物も特殊だが、一般に高温強光の代表例はC4。",
      "不正解。分類は光合成型で決まり豆類全体ではない。"
    ],
    basic_terms: "C4植物：CO₂濃縮機構を持つ植物、光呼吸：RuBPオキシゲナーゼ反応によるCO₂損失"
  }),
  q({
    domain: "農学",
    subdomain: "植物栄養",
    difficulty_initial: 300,
    cognitive_type: "原理・因果",
    question_text: "窒素肥料を過剰すると、多くの作物で茎葉が細長く弱くなる主な理由はどれか。",
    choices: [
      "光合成が完全に停止する",
      "窒素過剰により徒長（細長い茎葉）が促進される",
      "根の伸長が止まる",
      "リン酸吸収が増加する"
    ],
    correct_choice_index: 1,
    short_explanation: "窒素過剰は細胞分裂・伸長が促進され、徒長や倒伏リスクが増える。",
    detailed_explanation: "窒素は茎葉の伸長に関与し、過剰施用では倒伏しやすくなる。光合成自体は止まらない。",
    learning_objective: "窒素過剰の影響を説明できる",
    common_misconception: "窒素は常に光合成を止めると考える",
    distractor_rationales: [
      "不正解。光合成は一般に継続する。",
      "正解。窒素過剰は徒長を促進する。",
      "不正解。根の伸長が止まるわけではない。",
      "不正解。リン吸収は過剰窒素で必ず増加しない。"
    ],
    basic_terms: "徒長：細長く弱い茎葉の生育、窒素：茎葉伸長に関与する必須元素"
  }),
  q({
    domain: "農学",
    subdomain: "土壌",
    difficulty_initial: 300,
    cognitive_type: "基本的な適用",
    question_text: "酸性土壌でリン酸が作物に利用されにくくなる主な理由はどれか。",
    choices: [
      "リン酸が鉄・アルミニウムと結合して固定化される",
      "リン酸がすべて気化する",
      "根毛が消失する",
      "光合成が停止する"
    ],
    correct_choice_index: 0,
    short_explanation: "酸性土ではAl³⁺・Fe³⁺とリン酸が結合し、可溶性が低下する。",
    detailed_explanation: "pH低いとリン酸はAl-P、Fe-Pなど不溶性形態になり吸収されにくい。石灰施用で改善可能。",
    learning_objective: "土壌pHとリン酸有效性の関係を説明できる",
    common_misconception: "施肥量を増やせば酸性土でも吸収できると単純化する",
    distractor_rationales: [
      "正解。金属イオンによる固定化が主因。",
      "不正解。リン酸は気化しない。",
      "不正解。根毛は直接消失しない。",
      "不正解。光合成停止が主因ではない。"
    ],
    basic_terms: "リン酸固定：不溶性形態への変換、土壌pH：土壌の酸性・アルカリ性"
  }),
  q({
    domain: "農学",
    subdomain: "病害虫",
    difficulty_initial: 300,
    cognitive_type: "用語・定義",
    question_text: "IPM（総合的病害虫管理）の基本方針として最も適切なものはどれか。",
    choices: [
      "化学農薬のみで防除する",
      "天敵・抵抗性品種・栽培管理などを組み合わせる",
      "すべての害虫を完全に根絶する",
      "防除は収穫後のみ行う"
    ],
    correct_choice_index: 1,
    short_explanation: "IPMは化学防除単独ではなく、複数の手法を統合的に用いる。",
    detailed_explanation: "天敵利用、抵抗性品種、輪作、適切な化学防除などを組み合わせ、経済的被害許容水準以下に抑える。",
    learning_objective: "IPMの概念を説明できる",
    common_misconception: "病害虫防除は農薬のみで十分だと考える",
    distractor_rationales: [
      "不正解。化学防除のみはIPMではない。",
      "正解。複数手法の統合がIPM。",
      "不正解。完全根絶が目的ではない。",
      "不正解。生育期の管理が重要。"
    ],
    basic_terms: "IPM：総合的病害虫管理、抵抗性品種：病害虫抵抗性を持つ品種"
  }),
  q({
    domain: "農学",
    subdomain: "作物",
    difficulty_initial: 300,
    cognitive_type: "原理・因果",
    question_text: "種子の発芽に一般に必要な条件の組合せとして正しいものはどれか。",
    choices: [
      "適度な水分と酸素",
      "完全な暗闇のみ",
      "高濃度の二酸化炭素のみ",
      "ゼロ度以下の低温"
    ],
    correct_choice_index: 0,
    short_explanation: "発芽には水分による吸湿膨潤と、呼吸のための酸素が必要。",
    detailed_explanation: "多くの種子は水分・酸素・適温が必要。光は種子によって必要（光発芽）・不要（暗発芽）が分かれる。",
    learning_objective: "種子発芽の基本条件を説明できる",
    common_misconception: "発芽には光が常に必要だと考える",
    distractor_rationales: [
      "正解。水分と酸素が基本要件。",
      "不正解。暗闇のみでは不十分。",
      "不正解。CO₂高濃度は発芽条件ではない。",
      "不正解。低温では発芽しない。"
    ],
    basic_terms: "発芽：種子から幼芽が出ること、呼吸：発芽時のエネルギー供給"
  }),

  // L400 ×3
  q({
    domain: "農学",
    subdomain: "作物生理学",
    difficulty_initial: 400,
    cognitive_type: "原理・因果",
    question_text: "短日植物が長日条件下で開花しにくい主な理由はどれか。",
    choices: [
      "光周期性により長い暗期（短日条件）が開花促進に必要だから",
      "光合成が行われないから",
      "根の伸長が止まるから",
      "窒素が不要になるから"
    ],
    correct_choice_index: 0,
    short_explanation: "短日植物は一定以上の長い暗期（短日）で開花が誘導される。",
    detailed_explanation: "光周期性により開花が制御される。短日植物は暗期が長いと開花し、長日条件では開花が遅れる。",
    learning_objective: "光周期性と短日植物の開花制御を説明できる",
    common_misconception: "すべての植物が同じ光条件で開花すると考える",
    distractor_rationales: [
      "正解。短日植物は長い暗期が開花促進に必要。",
      "不正解。光合成は継続する。",
      "不正解。根の伸長停止が主因ではない。",
      "不正解。窒素は引き続き必要。"
    ],
    basic_terms: "光周期性：日長・暗期長で反応が変わる性質、短日植物：長い暗期で開花する植物"
  }),
  q({
    domain: "農学",
    subdomain: "土壌",
    difficulty_initial: 400,
    cognitive_type: "基本的な適用",
    question_text: "土壌のCEC（カチオン交換容量）が大きいほど、一般に示される効果として正しいものはどれか。",
    choices: [
      "保肥力（陽イオン保持能力）が高い",
      "保肥力が低い",
      "根の数が増える",
      "pHが必ず下がる"
    ],
    correct_choice_index: 0,
    short_explanation: "CECが大きいほど陽イオン（Ca²⁺、K⁺など）を保持し、保肥力が高い。",
    detailed_explanation: "腐植質や粘土含量が高い土壌はCECが大きく、肥料成分の吸着・緩効供給能力が高い。",
    learning_objective: "CECと保肥力の関係を説明できる",
    common_misconception: "CECと保水力を同一視する",
    distractor_rationales: [
      "正解。CEC大→保肥力高。",
      "不正解。CEC低いと保肥力は低い。",
      "不正解。根数とCECは直接関係しない。",
      "不正解。pH低下だけではCEC増加の説明にならない。"
    ],
    basic_terms: "CEC：カチオン交換容量、保肥力：肥料成分を保持し供給する能力"
  }),
  q({
    domain: "農学",
    subdomain: "栽培",
    difficulty_initial: 400,
    cognitive_type: "比較・分類",
    question_text: "マメ科作物を輪作に組み込む主な栽培上の利点として最も適切なものはどれか。",
    choices: [
      "根粒菌による生物的窒素固定で土壌窒素が補われる",
      "土壌の塩分が必ず増える",
      "すべての病害虫が根絶される",
      "光合成型がC4に変わる"
    ],
    correct_choice_index: 0,
    short_explanation: "マメ科は根粒菌と共生し、大気中窒素を固定して後続作物の窒素源になる。",
    detailed_explanation: "根粒菌共生によりN固定。輪作で土壌窒素・有機物・病害虫管理にも寄与。",
    learning_objective: "マメ科輪作の利点を説明できる",
    common_misconception: "輪作は病害虫だけの問題だと考える",
    distractor_rationales: [
      "正解。生物的窒素固定が主要利点。",
      "不正解。塩分増加は利点ではない。",
      "不正解。完全根絶は期待できない。",
      "不正解。光合成型は変わらない。"
    ],
    basic_terms: "根粒：根粒菌と共生する根の隆起、生物的窒素固定：大気窒素をアンモニア等に変換"
  }),

  // L500 ×2
  q({
    domain: "農学",
    subdomain: "育種",
    difficulty_initial: 500,
    cognitive_type: "原理・因果",
    question_text: "F₁雑種の強い雑種優勢（ヘテロシス）を利用する際、毎年F₁種子を作る必要がある主な理由はどれか。",
    choices: [
      "F₂以降で優勢が分離し表型がばらつくから",
      "F₁は無性生殖しか行わないから",
      "F₁は種子を形成できないから",
      "F₂は必ず不育になるから"
    ],
    correct_choice_index: 0,
    short_explanation: "減数分裂で遺伝子が分離し、F₂以降は雑種優勢が弱まる表型が現れる。",
    detailed_explanation: "F₁は遺伝的に均一で雑種優勢を示すが、F₂は分離・組換えにより表型分散。毎年親本交配でF₁を生産。",
    learning_objective: "雑種優勢とF₁種子生産の必要性を説明できる",
    common_misconception: "F₁の優勢性が永久に固定されると考える",
    distractor_rationales: [
      "正解。F₂以降の分離が主因。",
      "不正解。有性生殖を行う。",
      "不正解。F₁は種子を形成できる。",
      "不正解。F₂不育は一般化できない。"
    ],
    basic_terms: "雑種優勢：F₁で示される表現型の優越性、F₁：初代雑種"
  }),
  q({
    domain: "農学",
    subdomain: "作物生理学",
    difficulty_initial: 500,
    cognitive_type: "基本的な適用",
    question_text: "イネの抽穂期（出穂期）前後で最も重要視される養分として一般的に正しいものはどれか。",
    choices: [
      "ケイ酸",
      "窒素とリン酸",
      "ナトリウムのみ",
      "クロールのみ"
    ],
    correct_choice_index: 1,
    short_explanation: "出穂・登熟期は窒素・リン酸需要がピークに達し、穂数・粒数・充実に影響。",
    detailed_explanation: "減数分裂期・出穂期の窒素・リン酸管理が収量・品質に直結。時期別施肥設計が重要。",
    learning_objective: "イネの生育ステージ別養分管理を説明できる",
    common_misconception: "全生育期で同じ養分需要だと考える",
    distractor_rationales: [
      "不正解。ケイ酸も重要だが出穂期の最重要はN・P。",
      "正解。出穂前後のN・P需要が特に重要。",
      "不正解。Naは必須元素ではない。",
      "不正解。Clのみでは不十分。"
    ],
    basic_terms: "抽穂期：穂が出る時期、登熟期：穀粒が充実する時期"
  }),

  // L600 ×3
  q({
    domain: "農学",
    subdomain: "植物栄養",
    difficulty_initial: 600,
    cognitive_type: "原理・因果",
    question_text: "根粒菌がマメ科植物の根に根粒を形成し窒素固定を行う際、宿主側が提供する主な代謝産物として最も適切なものはどれか。",
    choices: [
      "光合成由来の炭水化物（例：スクロース）",
      "大気中の分子状窒素",
      "ルーメン発酵産物",
      "土壌中の硝酸態窒素"
    ],
    correct_choice_index: 0,
    short_explanation: "根粒菌は宿主から炭水化物を受け取り、固定窒素をアンモニア等で宿主へ供給。",
    detailed_explanation: "マメ科-根粒菌共生は炭水化物と固定Nの交換。Nif遺伝子群により大気N₂を固定。",
    learning_objective: "根粒菌共生の代謝交換を説明できる",
    common_misconception: "根粒菌が光合成で炭水化物を作ると考える",
    distractor_rationales: [
      "正解。宿主の光合成産物を根粒菌が利用。",
      "不正解。N₂は根粒菌が固定するが宿主供給ではない。",
      "不正解。反芻動物のルーメンとは無関係。",
      "不正解。硝酸態Nは根粒菌固定の代替源ではない。"
    ],
    basic_terms: "根粒菌：マメ科根粒内で窒素固定する細菌、Nif：窒素固定酵素遺伝子"
  }),
  q({
    domain: "農学",
    subdomain: "作物生理学",
    difficulty_initial: 600,
    cognitive_type: "原理・因果",
    question_text: "頂芽優勢（アピカルドミナンス）が側芽の伸長を抑制する主な機構として最も支持されるものはどれか。",
    choices: [
      "頂芽由来のオーキシンが側芽へ移行し抑制する",
      "頂芽が側芽の光合成を完全に停止する",
      "側芽は遺伝的に伸長できない",
      "根が側芽を物理的に圧迫する"
    ],
    correct_choice_index: 0,
    short_explanation: "頂芽からのオーキシン（IAA）が側芽抑制に関与。摘心で側芽が伸長。",
    detailed_explanation: "極性輸送するオーキシンとサイトカイニン等のバランスが側芽活性を制御。摘心・剪定で利用。",
    learning_objective: "頂芽優勢のホルモン機構を説明できる",
    common_misconception: "頂芽優勢は養分奪いだけで説明できると考える",
    distractor_rationales: [
      "正解。オーキシンによる側芽抑制が主機構。",
      "不正解。光合成停止が主因ではない。",
      "不正解。側芽は条件次第で伸長可能。",
      "不正解。物理圧迫が主因ではない。"
    ],
    basic_terms: "頂芽優勢：頂芽が側芽伸長を抑制、オーキシン：植物ホルモンの一つ"
  }),
  q({
    domain: "農学",
    subdomain: "土壌",
    difficulty_initial: 600,
    cognitive_type: "基本的な適用",
    question_text: "有機物のミネラル化（無機化）が土壌中の植物利用可能態窒素を増やす主な化学過程として正しいものはどれか。",
    choices: [
      "有機態窒素が微生物によりアンモニア等に分解される",
      "硝酸態窒素がすべて大気中へ脱窒される",
      "リン酸がすべて固定化される",
      "有機物が燃焼して窒素が消える"
    ],
    correct_choice_index: 0,
    short_explanation: "微生物による有機態Nの分解（ミネラル化）でNH₄⁺等が生成される。",
    detailed_explanation: "アンモニウム態→硝酸化→NO₃⁻。C/N比が高い有機物は一時的に窒素固定化も起こす。",
    learning_objective: "土壌窒素の無機化過程を説明できる",
    common_misconception: "有機肥料の窒素はすぐ全部が硝酸態になると考える",
    distractor_rationales: [
      "正解。微生物分解による無機化。",
      "不正解。脱窒はN損失過程。",
      "不正解。リン固定化は別過程。",
      "不正解。燃焼は堆肥化とは異なる。"
    ],
    basic_terms: "ミネラル化：有機態養分の無機化、C/N比：有機物の炭素と窒素の比"
  }),

  // L700 ×2
  q({
    domain: "農学",
    subdomain: "育種",
    difficulty_initial: 700,
    cognitive_type: "基本的な適用",
    question_text: "数量形質のQTL解析で、表現型の連続的変異に寄与するゲノム領域を同定する際の基本的手順として最も適切なものはどれか。",
    choices: [
      "集団交配・表現型測定・分子マーカーとの連鎖解析",
      "DNA配列を1塩基だけ変える",
      "すべての個体を同一クローンにする",
      "光合成速度のみを測定する"
    ],
    correct_choice_index: 0,
    short_explanation: "分離集団とマーカーの連鎖解析でQTLを同定。",
    detailed_explanation: "親本間の交配集団で表現型分散とマーカー型の統計的関連を解析。GWASも発展。",
    learning_objective: "QTL解析の基本手順を説明できる",
    common_misconception: "QTLは単一遺伝子だけで決まると考える",
    distractor_rationales: [
      "正解。交配集団と連鎖解析が基本。",
      "不正解。1塩基変換だけではQTL同定にならない。",
      "不正解。遺伝的変異が必要。",
      "不正解。表現型は形質により多様。"
    ],
    basic_terms: "QTL：数量形質遺伝子座、連鎖解析：マーカーと形質の遺伝的関連解析"
  }),
  q({
    domain: "農学",
    subdomain: "分子育種",
    difficulty_initial: 700,
    cognitive_type: "誤解・境界",
    question_text: "遺伝子組換え作物の栽培において、近隣の非GM作物への遺伝子流動（gene flow）リスク評価で最も重要視される要因の一つはどれか。",
    choices: [
      "花粉媒介による交配距離と受粉親の近縁性",
      "収穫後の乾燥温度のみ",
      "追肥の回数のみ",
      "根の深さのみ"
    ],
    correct_choice_index: 0,
    short_explanation: "風媒・虫媒花粉の飛散距離と種間・品種間交配可能性が遺伝子流動リスクを決める。",
    detailed_explanation: "隔离距離・開花期調整・バッファー設置等で管理。近縁種では種間雑交も考慮。",
    learning_objective: "GM作物の遺伝子流動リスク要因を説明できる",
    common_misconception: "GM遺伝子は収穫後すぐ消滅すると考える",
    distractor_rationales: [
      "正解。花粉媒介と近縁性が主要因子。",
      "不正解。乾燥温度だけでは評価できない。",
      "不正解。追肥回数は無関係。",
      "不正解。根の深さは直接因子ではない。"
    ],
    basic_terms: "遺伝子流動：遺伝子が個体群間で移動すること、隔离距離：GMと非GMの物理的分離"
  })
];
