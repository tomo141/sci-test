import type { BankQuestion } from "./questions";

type Spec = {
  domain: BankQuestion["domain"];
  subdomain: string;
  question: string;
  choices: [string, string, string, string];
  correct: number;
  note: string;
  terms: string;
};

const difficulties = [140, 220, 300, 380, 460, 540, 620, 700, 780, 860];

const specs: Spec[] = [
  { domain: "数学", subdomain: "単位・記号", question: "階乗を表す記号として正しいものはどれ？", choices: ["n!", "n?", "n#", "n$"], correct: 0, note: "n!は1からnまでの自然数の積を表す記号です。", terms: "階乗：n!。例：5!=5×4×3×2×1。" },
  { domain: "数学", subdomain: "数と式", question: "虚数単位iが満たす式はどれ？", choices: ["i^2=-1", "i^2=0", "i^2=1", "i^2=2"], correct: 0, note: "虚数単位iは2乗すると-1になる数として定義されます。", terms: "虚数単位：i。複素数：実部と虚部をもつ数。" },
  { domain: "数学", subdomain: "図形", question: "円の面積を表す式はどれ？", choices: ["πr^2", "2πr", "4πr^2", "r^3"], correct: 0, note: "半径rの円の面積はπr^2です。", terms: "円の面積：πr^2。円周：2πr。" },
  { domain: "数学", subdomain: "統計", question: "最も多く現れる値を何という？", choices: ["平均値", "中央値", "最頻値", "標準偏差"], correct: 2, note: "最頻値はデータの中で最も頻繁に現れる値です。", terms: "最頻値：最多の値。中央値：中央の値。平均値：合計÷個数。" },
  { domain: "数学", subdomain: "集合", question: "A∩Bが表す集合はどれ？", choices: ["和集合", "共通部分", "空集合", "補集合"], correct: 1, note: "A∩BはAにもBにも含まれる要素の集合です。", terms: "∩：共通部分。∪：和集合。" },
  { domain: "数学", subdomain: "関数", question: "y=ax+bで表される代表的な関数はどれ？", choices: ["一次関数", "二次関数", "指数関数", "三角関数"], correct: 0, note: "y=ax+bは一次関数の標準的な形です。", terms: "一次関数：グラフが直線。二次関数：x^2を含む。" },
  { domain: "数学", subdomain: "確率", question: "確率の値として取り得る範囲はどれ？", choices: ["0以上1以下", "1以上2以下", "-1以上1以下", "0以上100以下だけ"], correct: 0, note: "確率は0から1までの値で表します。", terms: "確率0：起こらない。確率1：必ず起こる。" },
  { domain: "数学", subdomain: "微分積分", question: "曲線とx軸で囲まれた面積と関係が深い操作はどれ？", choices: ["微分", "積分", "対数化", "因数分解"], correct: 1, note: "積分は面積や蓄積量を求める操作です。", terms: "積分：面積・蓄積。微分：変化率。" },
  { domain: "数学", subdomain: "論理", question: "命題PならばQを記号で表すとどれ？", choices: ["P→Q", "P∩Q", "P+Q", "P/Q"], correct: 0, note: "P→Qは『PならばQ』を表します。", terms: "→：ならば。∧：かつ。∨：または。" },
  { domain: "数学", subdomain: "線形代数", question: "ベクトルの大きさを表す語はどれ？", choices: ["ノルム", "モード", "メディアン", "サンプル"], correct: 0, note: "ノルムはベクトルの長さや大きさを表す量です。", terms: "ノルム：ベクトルの大きさ。内積：ベクトル間の積の一種。" },

  { domain: "物理", subdomain: "法則", question: "オームの法則を表す式はどれ？", choices: ["V=IR", "F=ma", "E=mc^2", "pV=nRT"], correct: 0, note: "オームの法則は電圧V、電流I、抵抗Rの関係です。", terms: "V：電圧。I：電流。R：抵抗。" },
  { domain: "物理", subdomain: "単位", question: "ジーベルト（Sv）が主に表すものはどれ？", choices: ["放射能の強さ", "人体影響を考慮した放射線量", "吸収された熱量", "電流の強さ"], correct: 1, note: "Svは人体への影響を考慮した放射線量の単位です。", terms: "Sv：線量当量など。Bq：放射能。Gy：吸収線量。" },
  { domain: "物理", subdomain: "単位", question: "ルーメン（lm）が表すものはどれ？", choices: ["光束", "照度", "光度", "電力"], correct: 0, note: "lmは光源から出る光の量である光束を表します。", terms: "lm：光束。lx：照度。cd：光度。W：電力。" },
  { domain: "物理", subdomain: "波", question: "光が異なる媒質の境界で進行方向を変える現象はどれ？", choices: ["回折", "干渉", "屈折", "偏光"], correct: 2, note: "屈折は媒質が変わる境界で光の進む向きが変わる現象です。", terms: "屈折：進行方向の変化。回折：波の回り込み。" },
  { domain: "物理", subdomain: "熱", question: "絶対零度はおよそ何℃か？", choices: ["0℃", "-100℃", "-273℃", "-1000℃"], correct: 2, note: "絶対零度は約-273.15℃です。", terms: "絶対零度：0 K。セルシウス温度では約-273℃。" },
  { domain: "物理", subdomain: "力学", question: "質量と重さについて正しい説明はどれ？", choices: ["質量は場所で大きく変わる", "重さは重力による力である", "質量の単位はニュートンである", "重さはどこでも一定である"], correct: 1, note: "重さは重力が物体に及ぼす力です。", terms: "質量：kg。重さ：Nで表す力。" },
  { domain: "物理", subdomain: "量子", question: "金属表面から電子が飛び出す現象を何という？", choices: ["光電効果", "ドップラー効果", "トンネル効果", "ゼーマン効果"], correct: 0, note: "光電効果は光により電子が放出される現象です。", terms: "光電効果：光による電子放出。ドップラー効果：周波数のずれ。" },
  { domain: "物理", subdomain: "人物", question: "万有引力の法則で知られる科学者はどれ？", choices: ["ニュートン", "ダーウィン", "パスツール", "メンデル"], correct: 0, note: "ニュートンは運動法則や万有引力の法則で知られます。", terms: "ニュートン：力学。ダーウィン：進化論。" },
  { domain: "物理", subdomain: "単位", question: "1気圧はおよそ何Paか？", choices: ["10^2 Pa", "10^3 Pa", "10^5 Pa", "10^8 Pa"], correct: 2, note: "1気圧は約101325 Paで、桁としては10^5 Paです。", terms: "Pa：圧力の単位。標準気圧：約1.013×10^5 Pa。" },
  { domain: "物理", subdomain: "法則", question: "エネルギー保存則として正しい説明はどれ？", choices: ["エネルギーは常に増え続ける", "エネルギーは形を変えても総量は保存される", "エネルギーは温度が高いほど消滅する", "エネルギーは質量と無関係である"], correct: 1, note: "孤立系ではエネルギーの総量は保存されます。", terms: "保存則：総量が変わらないという法則。エネルギー：仕事をする能力。" },

  { domain: "化学", subdomain: "化学式", question: "硫酸の化学式はどれ？", choices: ["HCl", "H2SO4", "HNO3", "NaOH"], correct: 1, note: "硫酸の化学式はH2SO4です。", terms: "H2SO4：硫酸。HCl：塩酸。HNO3：硝酸。NaOH：水酸化ナトリウム。" },
  { domain: "化学", subdomain: "化学式", question: "CO2が表す物質はどれ？", choices: ["一酸化炭素", "二酸化炭素", "酸素", "炭酸"], correct: 1, note: "CO2は二酸化炭素を表します。", terms: "CO2：二酸化炭素。CO：一酸化炭素。" },
  { domain: "化学", subdomain: "状態変化", question: "固体が液体を経ずに気体になる現象はどれ？", choices: ["蒸発", "融解", "昇華", "凝固"], correct: 2, note: "昇華は固体から直接気体へ変わる現象です。", terms: "昇華：固体から気体。融解：固体から液体。凝固：液体から固体。" },
  { domain: "化学", subdomain: "測定", question: "pHメーターで主に測定するものはどれ？", choices: ["溶液の密度", "溶液の酸性・塩基性の程度", "溶液の色", "溶液の粘度"], correct: 1, note: "pHメーターは水溶液のpHを測定します。", terms: "pH：酸性・塩基性の指標。密度：質量÷体積。" },
  { domain: "化学", subdomain: "測定", question: "分光光度計で主に測定するものはどれ？", choices: ["光の吸収量", "試料の質量", "電気抵抗", "磁場の強さ"], correct: 0, note: "分光光度計は試料がどれだけ光を吸収するかを測ります。", terms: "吸光度：光の吸収の程度。分光：波長ごとに分けること。" },
  { domain: "化学", subdomain: "実験法", question: "クロマトグラフィーの主な目的はどれ？", choices: ["物質を分離する", "質量を測定する", "温度を一定に保つ", "圧力を加える"], correct: 0, note: "クロマトグラフィーは成分の移動しやすさの差を利用して分離します。", terms: "クロマトグラフィー：分離法。分光光度計：光吸収の測定。" },
  { domain: "化学", subdomain: "有機化学", question: "六員環の炭素原子からなる代表的な芳香族化合物はどれ？", choices: ["メタン", "エタノール", "ベンゼン", "アセトン"], correct: 2, note: "ベンゼンはC6H6で、代表的な芳香族化合物です。", terms: "ベンゼン：芳香族化合物。メタン：最も簡単なアルカン。" },
  { domain: "化学", subdomain: "周期表", question: "次のうち、アルカリ金属に分類される元素はどれ？", choices: ["ナトリウム", "カルシウム", "アルミニウム", "塩素"], correct: 0, note: "ナトリウムは周期表第1族のアルカリ金属です。", terms: "アルカリ金属：第1族元素。ハロゲン：第17族元素。" },
  { domain: "化学", subdomain: "組み合わせ", question: "元素記号と元素名の組み合わせとして正しいものはどれ？", choices: ["Fe：フッ素", "Na：ナトリウム", "K：クリプトン", "Cu：カルシウム"], correct: 1, note: "Naはナトリウムを表します。", terms: "Fe：鉄。F：フッ素。K：カリウム。Cu：銅。" },
  { domain: "化学", subdomain: "反応", question: "鉄がさびる現象は主にどの変化に分類される？", choices: ["還元", "酸化", "中和", "蒸留"], correct: 1, note: "鉄のさびは酸素との反応による酸化として扱われます。", terms: "酸化：電子を失う・酸素と結びつく。還元：電子を受け取る。" },

  { domain: "生物", subdomain: "分類", question: "哺乳類に分類される動物はどれ？", choices: ["ペンギン", "コウモリ", "カメ", "サメ"], correct: 1, note: "コウモリは空を飛ぶ哺乳類です。", terms: "哺乳類：乳で子を育てる脊椎動物。ペンギン：鳥類。" },
  { domain: "生物", subdomain: "遺伝", question: "DNAを構成する塩基ではないものはどれ？", choices: ["アデニン", "グアニン", "チミン", "ウラシル"], correct: 3, note: "ウラシルはRNAに含まれ、DNAでは通常チミンが使われます。", terms: "DNA：A,T,G,C。RNA：A,U,G,C。" },
  { domain: "生物", subdomain: "遺伝", question: "遺伝の法則の基礎を示した人物はどれ？", choices: ["ファラデー", "メンデル", "アインシュタイン", "ボーア"], correct: 1, note: "メンデルはエンドウを用いた実験で遺伝の法則を示しました。", terms: "メンデル：遺伝学。ファラデー：電磁気学。" },
  { domain: "生物", subdomain: "分子生物学", question: "PCRの正式名称として正しいものはどれ？", choices: ["Polymerase Chain Reaction", "Protein Chemical Reaction", "Physical Cell Replication", "Proton Chain Ratio"], correct: 0, note: "PCRはPolymerase Chain Reactionの略です。", terms: "PCR：DNAを増幅する方法。ポリメラーゼ：核酸鎖を伸ばす酵素。" },
  { domain: "生物", subdomain: "分子生物学", question: "PCRでDNA鎖を伸長する酵素はどれ？", choices: ["リガーゼ", "ポリメラーゼ", "アミラーゼ", "カタラーゼ"], correct: 1, note: "ポリメラーゼは鋳型に沿ってDNA鎖を伸長します。", terms: "DNAポリメラーゼ：DNA合成酵素。リガーゼ：DNA断片をつなぐ酵素。" },
  { domain: "生物", subdomain: "実験", question: "ヨウ素液で青紫色になりやすい物質はどれ？", choices: ["タンパク質", "デンプン", "脂質", "食塩"], correct: 1, note: "ヨウ素液はデンプンの検出に使われます。", terms: "ヨウ素デンプン反応：青紫色。ベネジクト液：還元糖の検出。" },
  { domain: "生物", subdomain: "人体", question: "インスリンを分泌する器官はどれ？", choices: ["肝臓", "すい臓", "腎臓", "甲状腺"], correct: 1, note: "インスリンはすい臓のランゲルハンス島で分泌されます。", terms: "すい臓：インスリン分泌。甲状腺：甲状腺ホルモン分泌。" },
  { domain: "生物", subdomain: "人体", question: "血液中で酸素を主に運ぶ細胞はどれ？", choices: ["赤血球", "白血球", "血小板", "神経細胞"], correct: 0, note: "赤血球はヘモグロビンにより酸素を運びます。", terms: "赤血球：酸素運搬。白血球：免疫。血小板：止血。" },
  { domain: "生物", subdomain: "細胞分裂", question: "細胞分裂で染色体が赤道面に並ぶ時期はどれ？", choices: ["前期", "中期", "後期", "終期"], correct: 1, note: "中期には染色体が細胞の赤道面に並びます。", terms: "前期：染色体凝縮。中期：赤道面に整列。後期：分離。" },
  { domain: "生物", subdomain: "免疫", question: "抗原に特異的に結合するタンパク質はどれ？", choices: ["抗体", "酵素", "ホルモン", "ヘモグロビン"], correct: 0, note: "抗体は抗原を特異的に認識して結合します。", terms: "抗体：免疫グロブリン。抗原：抗体などに認識される物質。" },

  { domain: "地学", subdomain: "天文", question: "木星の英語名として正しいものはどれ？", choices: ["Mars", "Venus", "Jupiter", "Saturn"], correct: 2, note: "木星の英語名はJupiterです。", terms: "Mars：火星。Venus：金星。Jupiter：木星。Saturn：土星。" },
  { domain: "地学", subdomain: "気象", question: "代表的な温室効果ガスはどれ？", choices: ["窒素", "酸素", "二酸化炭素", "アルゴン"], correct: 2, note: "二酸化炭素は代表的な温室効果ガスです。", terms: "温室効果ガス：赤外線を吸収する気体。CO2、メタンなど。" },
  { domain: "地学", subdomain: "天文", question: "惑星と特徴の組み合わせとして正しいものはどれ？", choices: ["火星：太陽系最大の惑星", "金星：最も大きな環をもつ惑星", "地球：液体の水が安定して存在する惑星", "水星：最も遠い惑星"], correct: 2, note: "地球は表面に液体の水が安定して存在する惑星です。", terms: "木星：最大。土星：大きな環。海王星：現在の主要惑星で最も外側。" },
  { domain: "地学", subdomain: "地震", question: "地震波のうち一般に先に到達するのはどれ？", choices: ["S波", "P波", "表面波", "津波"], correct: 1, note: "P波はS波より速く伝わるため先に到達します。", terms: "P波：初期微動。S波：主要動。" },
  { domain: "地学", subdomain: "大気", question: "対流圏の上にある大気の層はどれ？", choices: ["成層圏", "中間圏", "熱圏", "外気圏"], correct: 0, note: "地表に近い対流圏の上には成層圏があります。", terms: "対流圏、成層圏、中間圏、熱圏の順に並びます。" },
  { domain: "地学", subdomain: "岩石", question: "石灰岩の主成分として代表的な物質はどれ？", choices: ["炭酸カルシウム", "塩化ナトリウム", "二酸化ケイ素", "酸化鉄"], correct: 0, note: "石灰岩は主に炭酸カルシウムからなります。", terms: "炭酸カルシウム：CaCO3。二酸化ケイ素：SiO2。" },
  { domain: "地学", subdomain: "海洋", question: "海の深さを測る代表的な音波利用技術はどれ？", choices: ["ソナー", "レーダー", "顕微鏡", "望遠鏡"], correct: 0, note: "ソナーは音波を使って水中の距離や深さを測ります。", terms: "ソナー：音波。レーダー：電波。" },
  { domain: "地学", subdomain: "天文", question: "太陽に最も近い惑星はどれ？", choices: ["水星", "金星", "地球", "火星"], correct: 0, note: "水星は太陽に最も近い惑星です。", terms: "太陽からの順：水星、金星、地球、火星。" },
  { domain: "地学", subdomain: "気象", question: "雲量が0から1程度の天気は一般にどれ？", choices: ["快晴", "曇り", "雨", "雪"], correct: 0, note: "日本の天気分類では雲量が非常に少ない状態を快晴と呼びます。", terms: "快晴：雲が少ない。曇り：雲量が多い。" },
  { domain: "地学", subdomain: "地質", question: "地層の年代を推定する手がかりになる化石はどれ？", choices: ["示準化石", "示相化石", "生痕化石", "微化石"], correct: 0, note: "示準化石は地層の年代決定に役立ちます。", terms: "示準化石：年代。示相化石：環境。" },

  { domain: "工学", subdomain: "制御", question: "PID制御のPが表すものはどれ？", choices: ["比例", "積分", "微分", "圧力"], correct: 0, note: "PID制御のPはProportional、比例を表します。", terms: "P：比例。I：積分。D：微分。" },
  { domain: "工学", subdomain: "材料", question: "銅と亜鉛の合金はどれ？", choices: ["黄銅", "青銅", "鋼", "はんだ"], correct: 0, note: "黄銅は銅と亜鉛を主成分とする合金です。", terms: "黄銅：銅＋亜鉛。青銅：銅＋スズ。" },
  { domain: "工学", subdomain: "電気", question: "交流電圧を変える装置はどれ？", choices: ["変圧器", "整流器", "抵抗器", "発電機"], correct: 0, note: "変圧器は交流の電圧を変換します。", terms: "変圧器：電圧変換。整流器：交流から直流。" },
  { domain: "工学", subdomain: "電子", question: "電流を一方向に流しやすい半導体素子はどれ？", choices: ["ダイオード", "抵抗器", "コンデンサ", "コイル"], correct: 0, note: "ダイオードは整流などに使われます。", terms: "ダイオード：一方向性。抵抗器：電流を制限。" },
  { domain: "工学", subdomain: "機械", question: "流体の圧力を利用して力を伝える方式はどれ？", choices: ["油圧", "光通信", "蒸留", "暗号化"], correct: 0, note: "油圧は液体の圧力で力を伝えます。", terms: "油圧：液体圧力。空圧：気体圧力。" },
  { domain: "工学", subdomain: "製図", question: "CADの主な用途はどれ？", choices: ["設計図の作成", "血液検査", "植物栽培", "天体観測"], correct: 0, note: "CADはコンピュータ支援設計に使われます。", terms: "CAD：Computer-Aided Design。CAE：解析支援。" },
  { domain: "工学", subdomain: "情報通信", question: "光ファイバーが主に利用するものはどれ？", choices: ["光", "音波", "水流", "磁石"], correct: 0, note: "光ファイバーは光信号で情報を伝えます。", terms: "光ファイバー：光通信。銅線：電気信号。" },
  { domain: "工学", subdomain: "土木", question: "橋の上部構造を支える柱状の構造物はどれ？", choices: ["橋脚", "屋根", "軸受", "配管"], correct: 0, note: "橋脚は橋げたなどを支える構造物です。", terms: "橋脚：橋の支え。橋台：橋の端部の支え。" },
  { domain: "工学", subdomain: "熱工学", question: "熱をよく伝える性質を表す語はどれ？", choices: ["熱伝導率", "屈折率", "溶解度", "粘度"], correct: 0, note: "熱伝導率は熱の伝わりやすさを表します。", terms: "熱伝導率：熱の伝わりやすさ。粘度：流体のねばり。" },
  { domain: "工学", subdomain: "安全", question: "工場などで危険源を事前に洗い出す活動はどれ？", choices: ["リスクアセスメント", "クロマトグラフィー", "光合成", "品種改良"], correct: 0, note: "リスクアセスメントは危険性を評価し対策する活動です。", terms: "リスク：危険の大きさ。ハザード：危険源。" },

  { domain: "農学", subdomain: "栽培", question: "植物の受粉で、花粉がつく雌しべの部分はどれ？", choices: ["柱頭", "花弁", "根毛", "胚乳"], correct: 0, note: "花粉は雌しべの柱頭につきます。", terms: "柱頭：花粉がつく部分。胚珠：種子になる部分。" },
  { domain: "農学", subdomain: "病害虫", question: "害虫を食べる天敵を利用する防除法はどれ？", choices: ["生物的防除", "蒸留", "精米", "乾燥"], correct: 0, note: "生物的防除は天敵など生物の働きを使います。", terms: "生物的防除：天敵利用。化学的防除：農薬利用。" },
  { domain: "農学", subdomain: "土壌", question: "土を耕すことを何という？", choices: ["耕起", "収穫", "播種", "接ぎ木"], correct: 0, note: "耕起は土壌を掘り起こして耕す作業です。", terms: "耕起：土を耕す。播種：種をまく。" },
  { domain: "農学", subdomain: "食品", question: "大豆を原料とする発酵食品はどれ？", choices: ["味噌", "ヨーグルト", "バター", "寒天"], correct: 0, note: "味噌は大豆などを麹と塩で発酵させた食品です。", terms: "味噌：大豆発酵食品。ヨーグルト：乳発酵食品。" },
  { domain: "農学", subdomain: "畜産", question: "鶏卵を産むために飼育される鶏は一般にどれ？", choices: ["採卵鶏", "乳牛", "肉牛", "種豚"], correct: 0, note: "採卵鶏は卵生産を目的に飼育される鶏です。", terms: "採卵鶏：卵用。ブロイラー：肉用鶏。" },
  { domain: "農学", subdomain: "育種", question: "異なる品種や系統を交配して作る第一代を何という？", choices: ["F1", "pH", "ATP", "DNA"], correct: 0, note: "F1は雑種第一代を表します。", terms: "F1：雑種第一代。育種：品種改良。" },
  { domain: "農学", subdomain: "栄養", question: "植物の葉緑素に含まれる代表的な元素はどれ？", choices: ["マグネシウム", "ヘリウム", "金", "鉛"], correct: 0, note: "クロロフィル分子にはマグネシウムが含まれます。", terms: "クロロフィル：葉緑素。Mg：マグネシウム。" },
  { domain: "農学", subdomain: "水産", question: "海藻のノリは主にどの分野の生産物？", choices: ["水産", "畜産", "林業", "鉱業"], correct: 0, note: "ノリは養殖などで生産される水産物です。", terms: "水産：魚介類や海藻など。畜産：家畜生産。" },
  { domain: "農学", subdomain: "林学", question: "森林で木を間引く作業はどれ？", choices: ["間伐", "輪作", "受粉", "追肥"], correct: 0, note: "間伐は森林の成長を調整するために木を間引く作業です。", terms: "間伐：木を間引く。追肥：追加で肥料を与える。" },
  { domain: "農学", subdomain: "肥料", question: "肥料の三要素N・P・KのKはどれ？", choices: ["カリウム", "カルシウム", "クリプトン", "ケイ素"], correct: 0, note: "Kはカリウムを表します。", terms: "N：窒素。P：リン。K：カリウム。" },

  { domain: "情報・計算機科学", subdomain: "略称", question: "CPUの正式名称として最も適切なものはどれ？", choices: ["Central Processing Unit", "Computer Power Utility", "Control Program User", "Core Pixel Unit"], correct: 0, note: "CPUはCentral Processing Unitの略です。", terms: "CPU：中央処理装置。GPU：画像処理などに強い処理装置。" },
  { domain: "情報・計算機科学", subdomain: "略称", question: "URLのUが表す語はどれ？", choices: ["Uniform", "Universal", "User", "Unit"], correct: 0, note: "URLはUniform Resource Locatorの略です。", terms: "URL：Web上の場所を示す文字列。URI：資源識別子。" },
  { domain: "情報・計算機科学", subdomain: "セキュリティ", question: "公開鍵暗号で秘密に保管する鍵はどれ？", choices: ["秘密鍵", "公開鍵", "文字コード", "拡張子"], correct: 0, note: "秘密鍵は所有者だけが管理する鍵です。", terms: "公開鍵：公開できる鍵。秘密鍵：秘匿する鍵。" },
  { domain: "情報・計算機科学", subdomain: "Web", question: "CSSが主に指定するものはどれ？", choices: ["見た目やレイアウト", "データベース検索", "電源制御", "暗号鍵生成"], correct: 0, note: "CSSはWebページの見た目を指定します。", terms: "CSS：スタイル指定。HTML：文書構造。JavaScript：動作。" },
  { domain: "情報・計算機科学", subdomain: "データ形式", question: "画像ファイル形式として代表的なものはどれ？", choices: ["PNG", "SQL", "HTTP", "CPU"], correct: 0, note: "PNGは画像ファイル形式の一つです。", terms: "PNG：画像形式。SQL：問い合わせ言語。HTTP：通信プロトコル。" },
  { domain: "情報・計算機科学", subdomain: "データベース", question: "表形式データで横一行のデータを一般に何という？", choices: ["レコード", "ピクセル", "プロセス", "ポート"], correct: 0, note: "データベース表の1行はレコードと呼ばれます。", terms: "レコード：行。フィールド：列や項目。" },
  { domain: "情報・計算機科学", subdomain: "ネットワーク", question: "DNSが主に行うことはどれ？", choices: ["ドメイン名をIPアドレスに対応づける", "画像を圧縮する", "画面を明るくする", "電力を測る"], correct: 0, note: "DNSは名前解決を行う仕組みです。", terms: "DNS：名前解決。IPアドレス：ネットワーク上の識別子。" },
  { domain: "情報・計算機科学", subdomain: "プログラミング", question: "真または偽を表すデータ型はどれ？", choices: ["ブール型", "画像型", "音声型", "表紙型"], correct: 0, note: "ブール型はtrue/falseを扱う型です。", terms: "Boolean：真偽値。String：文字列。Number：数値。" },
  { domain: "情報・計算機科学", subdomain: "AI", question: "教師あり学習で用意する正解データを何という？", choices: ["ラベル", "ポート", "キャッシュ", "フォント"], correct: 0, note: "ラベルは入力データに対応する正解情報です。", terms: "教師あり学習：ラベル付きデータで学ぶ。ラベル：正解情報。" },
  { domain: "情報・計算機科学", subdomain: "OS", question: "複数の処理を見かけ上同時に扱うOSの機能はどれ？", choices: ["マルチタスク", "単位換算", "光合成", "蒸留"], correct: 0, note: "マルチタスクは複数の処理を並行して扱う機能です。", terms: "マルチタスク：複数処理。プロセス：実行中のプログラム。" },

  { domain: "医歯薬学", subdomain: "略称", question: "MRIのIが表す語はどれ？", choices: ["Imaging", "Injection", "Immune", "Index"], correct: 0, note: "MRIはMagnetic Resonance Imagingの略です。", terms: "MRI：磁気共鳴画像。CT：コンピュータ断層撮影。" },
  { domain: "医歯薬学", subdomain: "生理", question: "血圧の単位としてよく使われるものはどれ？", choices: ["mmHg", "Bq", "cd", "mol"], correct: 0, note: "血圧は臨床でmmHgを用いて表すことが多いです。", terms: "mmHg：水銀柱ミリメートル。Pa：SIの圧力単位。" },
  { domain: "医歯薬学", subdomain: "人体", question: "胆汁を作る主な臓器はどれ？", choices: ["肝臓", "腎臓", "肺", "脳"], correct: 0, note: "胆汁は肝臓で作られ、胆のうに蓄えられます。", terms: "肝臓：胆汁産生や代謝。胆のう：胆汁を蓄える。" },
  { domain: "医歯薬学", subdomain: "薬学", question: "薬を皮膚から吸収させる投与経路はどれ？", choices: ["経皮投与", "経口投与", "静脈内投与", "吸入投与"], correct: 0, note: "経皮投与は皮膚を通して薬を吸収させます。", terms: "経皮：皮膚から。経口：口から。静脈内：血管内へ。" },
  { domain: "医歯薬学", subdomain: "感染症", question: "ウイルスに対して使われる薬の分類はどれ？", choices: ["抗ウイルス薬", "抗菌薬", "制酸薬", "利尿薬"], correct: 0, note: "抗ウイルス薬はウイルス感染症に対して使われます。", terms: "抗ウイルス薬：ウイルスに作用。抗菌薬：細菌に作用。" },
  { domain: "医歯薬学", subdomain: "歯学", question: "歯ぐきを表す語はどれ？", choices: ["歯肉", "歯髄", "象牙質", "エナメル質"], correct: 0, note: "歯肉は一般に歯ぐきと呼ばれる組織です。", terms: "歯肉：歯ぐき。歯髄：神経や血管。象牙質：歯の主要な硬組織。" },
  { domain: "医歯薬学", subdomain: "栄養", question: "骨や歯の形成に重要なミネラルはどれ？", choices: ["カルシウム", "ヘリウム", "アルゴン", "ネオン"], correct: 0, note: "カルシウムは骨や歯の形成に重要です。", terms: "カルシウム：Ca。ミネラル：体に必要な無機質。" },
  { domain: "医歯薬学", subdomain: "免疫", question: "ワクチンで体に作らせたい防御反応はどれ？", choices: ["免疫記憶", "視力低下", "脱水", "虫歯"], correct: 0, note: "ワクチンは免疫記憶を作り、感染時の防御に備えます。", terms: "免疫記憶：再侵入時に速く反応する仕組み。抗体：抗原に結合するタンパク質。" },
  { domain: "医歯薬学", subdomain: "検査", question: "血糖値の長期的な目安として使われる検査項目はどれ？", choices: ["HbA1c", "pH", "Bq", "cd"], correct: 0, note: "HbA1cは過去1〜2か月程度の血糖状態の目安になります。", terms: "HbA1c：糖化ヘモグロビン。血糖値：血液中のブドウ糖濃度。" },
  { domain: "医歯薬学", subdomain: "人体", question: "呼吸で酸素を取り込む主な臓器はどれ？", choices: ["肺", "腎臓", "胃", "脾臓"], correct: 0, note: "肺は酸素と二酸化炭素の交換を行います。", terms: "肺：ガス交換。腎臓：尿生成。胃：消化。" },

  { domain: "人文社会科学", subdomain: "心理学", question: "刺激と反応の結びつきを学習する考え方はどれ？", choices: ["条件づけ", "為替介入", "酸化還元", "地殻変動"], correct: 0, note: "条件づけは刺激と反応の関係を学習する現象です。", terms: "古典的条件づけ：刺激間の連合。オペラント条件づけ：行動と結果の連合。" },
  { domain: "人文社会科学", subdomain: "経済学", question: "物価が継続的に上昇する現象はどれ？", choices: ["インフレーション", "デフレーション", "分散", "蒸散"], correct: 0, note: "インフレーションは物価水準の持続的上昇です。", terms: "インフレ：物価上昇。デフレ：物価下落。" },
  { domain: "人文社会科学", subdomain: "法学", question: "私人間の権利義務を広く扱う法律はどれ？", choices: ["民法", "刑法", "天文学", "薬理学"], correct: 0, note: "民法は契約や所有、親族など私人間の関係を扱います。", terms: "民法：私人間。刑法：犯罪と刑罰。" },
  { domain: "人文社会科学", subdomain: "政治学", question: "裁判所が担う国家権力はどれ？", choices: ["司法権", "立法権", "行政権", "所有権"], correct: 0, note: "司法権は法に基づいて紛争を裁く権限です。", terms: "司法権：裁判。立法権：法律制定。行政権：政策実行。" },
  { domain: "人文社会科学", subdomain: "言語学", question: "意味をもつ最小の言語単位はどれ？", choices: ["形態素", "音素", "段落", "周波数"], correct: 0, note: "形態素は意味をもつ最小単位です。", terms: "形態素：意味の最小単位。音素：意味を区別する音の単位。" },
  { domain: "人文社会科学", subdomain: "地理", question: "地図で実際の距離を縮めた割合を何という？", choices: ["縮尺", "湿度", "硬度", "密度"], correct: 0, note: "縮尺は地図上の距離と実際の距離の比です。", terms: "縮尺：地図の縮小比。等高線：同じ高さを結ぶ線。" },
  { domain: "人文社会科学", subdomain: "歴史", question: "明治維新が始まった時期として代表的な年はどれ？", choices: ["1868年", "1603年", "1945年", "1192年"], correct: 0, note: "1868年は明治元年で、明治維新の重要な年です。", terms: "明治維新：近代国家形成の大きな変革。江戸幕府成立：1603年。" },
  { domain: "人文社会科学", subdomain: "社会学", question: "個人が社会の規範や役割を身につける過程はどれ？", choices: ["社会化", "酸化", "屈折", "昇華"], correct: 0, note: "社会化は人が社会の価値や行動様式を学ぶ過程です。", terms: "社会化：社会的行動の学習。規範：行動基準。" },
  { domain: "人文社会科学", subdomain: "哲学", question: "功利主義で重視される代表的な基準はどれ？", choices: ["幸福や効用", "原子番号", "塩分濃度", "絶対温度"], correct: 0, note: "功利主義は幸福や効用の最大化を重視する考え方です。", terms: "功利主義：最大多数の最大幸福。義務論：義務や原則を重視。" },
  { domain: "人文社会科学", subdomain: "教育学", question: "学習目標を小さな段階に分けて支援する考え方に近い語はどれ？", choices: ["足場かけ", "蒸留", "電離", "沈殿"], correct: 0, note: "足場かけは学習者ができるようになるまで段階的に支援する考え方です。", terms: "足場かけ：スキャフォールディング。メタ認知：自分の学びを振り返る働き。" }
];

function idFor(index: number) {
  return `10000000-0000-4000-8003-${String(index + 1).padStart(12, "0")}`;
}

function toQuestion(spec: Spec, index: number): BankQuestion {
  const withinDomain = index % 10;
  const difficulty = difficulties[withinDomain];
  const correctChoice = spec.choices[spec.correct];
  return {
    id: idFor(index),
    title: `${spec.domain} 知識確認 ${spec.subdomain}`,
    question_text: spec.question,
    choices: [...spec.choices],
    correct_choice_index: spec.correct,
    short_explanation: `正解は「${correctChoice}」です。${spec.note}`,
    detailed_explanation: `${spec.note} この問題は、用語・単位・現象・人物・分類などの知識を正確に呼び出せるかを確認します。${spec.terms}`,
    domain: spec.domain,
    subdomain: spec.subdomain,
    ability_axis: "基礎力",
    cognitive_type: "用語・定義",
    learning_objective: `${spec.subdomain}の基礎知識を選択肢から正確に選べる`,
    difficulty_initial: difficulty,
    difficulty_continuous: difficulty,
    distractor_rationales: spec.choices.map((choice, choiceIndex) =>
      choiceIndex === spec.correct ? `正解。${spec.note}` : `不正解。「${choice}」はこの問いで求める対象ではありません。${spec.terms}`
    ),
    common_misconception: "似た用語・単位・現象名・人物名を混同する",
    basic_terms: spec.terms,
    source_url: "",
    source_note: "全分野科学検定 知識確認100問 v2",
    currentness_type: "evergreen",
    expires_at: null,
    tags: [spec.domain, spec.subdomain, "知識確認", "用語・定義", "基礎力", "v2"],
    status: "published"
  };
}

export const knowledgeQuestionsV2: BankQuestion[] = specs.map(toQuestion);
