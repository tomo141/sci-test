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

const difficulties = [100, 180, 260, 340, 420, 500, 580, 660, 740, 820];

const specs: Spec[] = [
  { domain: "数学", subdomain: "数と式", question: "円周率を表す代表的なギリシャ文字はどれ？", choices: ["π", "Σ", "Δ", "Ω"], correct: 0, note: "πは円周の直径に対する比を表す記号です。", terms: "π：円周率。Σ：総和。Δ：差や変化量。Ω：オームなど。" },
  { domain: "数学", subdomain: "数と式", question: "自然数のうち、1と自分自身だけを約数にもつ数はどれ？", choices: ["素数", "偶数", "平方数", "有理数"], correct: 0, note: "2,3,5,7のような数を素数と呼びます。", terms: "素数：正の約数が2個の自然数。偶数：2で割り切れる整数。平方数：整数の2乗。" },
  { domain: "数学", subdomain: "図形", question: "直角三角形で、直角に向かい合う最も長い辺を何という？", choices: ["斜辺", "底辺", "半径", "弦"], correct: 0, note: "直角三角形では直角の向かい側の辺が斜辺です。", terms: "斜辺：直角三角形の最長辺。弦：円周上の2点を結ぶ線分。" },
  { domain: "数学", subdomain: "統計", question: "データを小さい順に並べたとき中央にくる値はどれ？", choices: ["平均値", "中央値", "最頻値", "分散"], correct: 1, note: "中央値はデータの中央の位置を表す代表値です。", terms: "平均値：合計を個数で割った値。中央値：中央の値。最頻値：最も多い値。分散：ばらつき。" },
  { domain: "数学", subdomain: "代数", question: "2次方程式 ax^2+bx+c=0 の判別式として使われる式はどれ？", choices: ["b^2-4ac", "a+b+c", "2πr", "ab/c"], correct: 0, note: "b^2-4acの符号で実数解の個数を判定できます。", terms: "判別式：2次方程式の解の様子を判定する式。" },
  { domain: "数学", subdomain: "集合", question: "空集合を表す記号はどれ？", choices: ["∅", "∞", "∈", "∪"], correct: 0, note: "要素を1つも持たない集合を空集合といいます。", terms: "∅：空集合。∞：無限大。∈：属する。∪：和集合。" },
  { domain: "数学", subdomain: "関数", question: "sin, cos, tan は一般に何関数と呼ばれる？", choices: ["指数関数", "三角関数", "対数関数", "一次関数"], correct: 1, note: "sin, cos, tanは角度と辺の比を扱う三角関数です。", terms: "三角関数：角度に対応する比や周期を表す関数。" },
  { domain: "数学", subdomain: "確率", question: "起こり得るすべての場合の集合を確率で何という？", choices: ["標本空間", "中央値", "偏差", "階級"], correct: 0, note: "標本空間は試行で起こり得る結果全体の集合です。", terms: "標本空間：全結果の集合。事象：標本空間の部分集合。" },
  { domain: "数学", subdomain: "微分積分", question: "関数の瞬間的な変化率を表す操作はどれ？", choices: ["積分", "微分", "因数分解", "標準化"], correct: 1, note: "微分は接線の傾きや瞬間の変化率を表します。", terms: "微分：変化率を求める操作。積分：蓄積量や面積を求める操作。" },
  { domain: "数学", subdomain: "線形代数", question: "行と列に数を並べた長方形状の配列を何という？", choices: ["行列", "数列", "素因数", "命題"], correct: 0, note: "行列は線形変換や連立方程式の表現に使われます。", terms: "行列：数を行と列に並べたもの。数列：順序をもつ数の並び。" },

  { domain: "物理", subdomain: "単位", question: "放射能の強さを表すSI単位はどれ？", choices: ["Gy", "Bq", "Sv", "N"], correct: 1, note: "Bqは1秒あたりの原子核崩壊数を表します。", terms: "Bq：放射能。Gy：吸収線量。Sv：人体影響を考えた線量。N：力。" },
  { domain: "物理", subdomain: "単位", question: "光の強さ（光度）のSI基本単位はどれ？", choices: ["lm", "lx", "cd", "W"], correct: 2, note: "cd（カンデラ）は光度のSI基本単位です。", terms: "cd：光度。lm：光束。lx：照度。W：仕事率。" },
  { domain: "物理", subdomain: "力学", question: "力のSI単位はどれ？", choices: ["J", "Pa", "N", "W"], correct: 2, note: "N（ニュートン）は力の単位です。", terms: "N：力。J：エネルギー。Pa：圧力。W：仕事率。" },
  { domain: "物理", subdomain: "電磁気", question: "電気抵抗の単位はどれ？", choices: ["Ω", "V", "A", "C"], correct: 0, note: "Ω（オーム）は電気抵抗を表します。", terms: "Ω：抵抗。V：電圧。A：電流。C：電荷。" },
  { domain: "物理", subdomain: "波", question: "音の高さに主に対応する物理量はどれ？", choices: ["振幅", "周波数", "密度", "圧力"], correct: 1, note: "周波数が高いほど高い音として聞こえます。", terms: "周波数：1秒あたりの振動数。振幅：振れ幅。" },
  { domain: "物理", subdomain: "熱", question: "絶対温度の単位はどれ？", choices: ["℃", "K", "Pa", "mol"], correct: 1, note: "K（ケルビン）は熱力学温度のSI基本単位です。", terms: "K：絶対温度。℃：セルシウス温度。Pa：圧力。mol：物質量。" },
  { domain: "物理", subdomain: "電磁気", question: "磁束密度のSI単位はどれ？", choices: ["T", "Wb", "H", "F"], correct: 0, note: "T（テスラ）は磁束密度の単位です。", terms: "T：磁束密度。Wb：磁束。H：インダクタンス。F：静電容量。" },
  { domain: "物理", subdomain: "量子", question: "光の粒子としての単位を何という？", choices: ["電子", "陽子", "光子", "中性子"], correct: 2, note: "光子は電磁波の量子です。", terms: "光子：光の量子。電子・陽子・中性子：物質を構成する粒子。" },
  { domain: "物理", subdomain: "力学", question: "運動量を表す典型的な式はどれ？", choices: ["mv", "ma", "mgh", "IR"], correct: 0, note: "運動量は質量mと速度vの積で表されます。", terms: "mv：運動量。ma：力。mgh：位置エネルギー。IR：電圧。" },
  { domain: "物理", subdomain: "単位", question: "圧力のSI単位はどれ？", choices: ["Pa", "J", "T", "Hz"], correct: 0, note: "Pa（パスカル）は1平方メートルあたり1ニュートンの圧力です。", terms: "Pa：圧力。J：エネルギー。T：磁束密度。Hz：周波数。" },

  { domain: "化学", subdomain: "物質名", question: "NaHCO3の一般名はどれ？", choices: ["食塩", "重曹", "消石灰", "石灰石"], correct: 1, note: "NaHCO3は炭酸水素ナトリウムで、重曹と呼ばれます。", terms: "重曹：炭酸水素ナトリウム。食塩：塩化ナトリウム。" },
  { domain: "化学", subdomain: "酸塩基", question: "電子対を受け取る物質を何という？", choices: ["ルイス酸", "ルイス塩基", "酸化剤", "還元剤"], correct: 0, note: "ルイス酸は電子対を受け取る物質です。", terms: "ルイス酸：電子対受容体。ルイス塩基：電子対供与体。" },
  { domain: "化学", subdomain: "元素", question: "元素記号Wが表す元素はどれ？", choices: ["タングステン", "タンタル", "タリウム", "チタン"], correct: 0, note: "Wはタングステンを表します。", terms: "W：タングステン。Ta：タンタル。Tl：タリウム。Ti：チタン。" },
  { domain: "化学", subdomain: "元素", question: "元素記号Agが表す元素はどれ？", choices: ["金", "銀", "アルゴン", "アルミニウム"], correct: 1, note: "Agは銀を表します。", terms: "Ag：銀。Au：金。Ar：アルゴン。Al：アルミニウム。" },
  { domain: "化学", subdomain: "物質量", question: "物質量のSI基本単位はどれ？", choices: ["mol", "g", "L", "Pa"], correct: 0, note: "mol（モル）は物質量のSI基本単位です。", terms: "mol：物質量。g：質量。L：体積。Pa：圧力。" },
  { domain: "化学", subdomain: "結合", question: "NaClに代表される、陽イオンと陰イオンの静電引力による結合はどれ？", choices: ["共有結合", "イオン結合", "金属結合", "水素結合"], correct: 1, note: "イオン結合は陽イオンと陰イオンの間の結合です。", terms: "イオン結合：イオン間の静電引力。共有結合：電子対の共有。" },
  { domain: "化学", subdomain: "有機化学", question: "CH4の物質名はどれ？", choices: ["メタン", "エタン", "プロパン", "ブタン"], correct: 0, note: "CH4は最も簡単なアルカンで、メタンです。", terms: "メタン：CH4。エタン：C2H6。プロパン：C3H8。ブタン：C4H10。" },
  { domain: "化学", subdomain: "周期表", question: "周期表の第18族元素は一般に何と呼ばれる？", choices: ["アルカリ金属", "ハロゲン", "希ガス", "遷移元素"], correct: 2, note: "第18族はヘリウムやネオンなどの希ガスです。", terms: "希ガス：第18族元素。ハロゲン：第17族元素。" },
  { domain: "化学", subdomain: "酸化還元", question: "電子を失う反応を何という？", choices: ["還元", "酸化", "中和", "沈殿"], correct: 1, note: "酸化は電子を失う反応として定義できます。", terms: "酸化：電子を失う。還元：電子を受け取る。" },
  { domain: "化学", subdomain: "実験器具", question: "溶液のpHを測る代表的な紙はどれ？", choices: ["リトマス紙", "ろ紙", "薬包紙", "感光紙"], correct: 0, note: "リトマス紙は酸性・アルカリ性の判定に使われます。", terms: "リトマス紙：酸塩基の判定。ろ紙：ろ過に使う紙。" },

  { domain: "生物", subdomain: "細胞", question: "タンパク質合成の場となる細胞小器官はどれ？", choices: ["リソソーム", "リボソーム", "中心体", "ゴルジ体"], correct: 1, note: "リボソームはmRNAの情報に基づきタンパク質を合成します。", terms: "リボソーム：タンパク質合成。ゴルジ体：分泌物の加工。" },
  { domain: "生物", subdomain: "遺伝", question: "DNAでアデニンと塩基対をつくる塩基はどれ？", choices: ["シトシン", "グアニン", "チミン", "ウラシル"], correct: 2, note: "DNAではAとT、GとCが塩基対を作ります。", terms: "A：アデニン。T：チミン。G：グアニン。C：シトシン。" },
  { domain: "生物", subdomain: "遺伝", question: "ヒトの体細胞に通常含まれる染色体数は？", choices: ["23本", "44本", "46本", "48本"], correct: 2, note: "ヒトの体細胞は通常46本、配偶子は23本です。", terms: "体細胞：46本。配偶子：23本。" },
  { domain: "生物", subdomain: "細胞", question: "植物細胞で光合成を行う細胞小器官はどれ？", choices: ["葉緑体", "ミトコンドリア", "核", "液胞"], correct: 0, note: "葉緑体はクロロフィルを含み光合成を行います。", terms: "葉緑体：光合成。ミトコンドリア：呼吸。" },
  { domain: "生物", subdomain: "分類", question: "生物の学名で使われる二名法を提唱した人物は誰？", choices: ["ダーウィン", "リンネ", "メンデル", "パスツール"], correct: 1, note: "リンネは属名と種小名からなる二名法を整えました。", terms: "リンネ：分類学。ダーウィン：進化論。メンデル：遺伝の法則。" },
  { domain: "生物", subdomain: "遺伝", question: "RNAでアデニンと塩基対をつくる塩基はどれ？", choices: ["チミン", "ウラシル", "グアニン", "シトシン"], correct: 1, note: "RNAではチミンの代わりにウラシルが使われます。", terms: "RNA：A-U、G-C。DNA：A-T、G-C。" },
  { domain: "生物", subdomain: "生態", question: "ある地域にすむ同種個体の集まりを何という？", choices: ["個体群", "群集", "生態系", "バイオーム"], correct: 0, note: "同じ種の個体の集まりを個体群といいます。", terms: "個体群：同種の集まり。群集：複数種の集まり。生態系：生物と環境。" },
  { domain: "生物", subdomain: "人体", question: "血糖値を下げるホルモンはどれ？", choices: ["インスリン", "アドレナリン", "グルカゴン", "チロキシン"], correct: 0, note: "インスリンは血糖値を下げる働きをもちます。", terms: "インスリン：血糖値を下げる。グルカゴン：血糖値を上げる。" },
  { domain: "生物", subdomain: "進化", question: "自然選択を中心とする進化論で知られる人物は誰？", choices: ["ニュートン", "ダーウィン", "ワトソン", "フック"], correct: 1, note: "ダーウィンは自然選択による進化を論じました。", terms: "ダーウィン：進化論。ワトソン：DNA構造研究。フック：細胞の観察。" },
  { domain: "生物", subdomain: "細胞", question: "細胞内でエネルギー産生に深く関わる小器官はどれ？", choices: ["ミトコンドリア", "リボソーム", "ゴルジ体", "中心体"], correct: 0, note: "ミトコンドリアは細胞呼吸によりATP産生に関わります。", terms: "ミトコンドリア：ATP産生。リボソーム：タンパク質合成。" },

  { domain: "地学", subdomain: "地球内部", question: "地球の磁場を主に生み出していると考えられる層はどれ？", choices: ["地殻", "マントル", "外核", "内核"], correct: 2, note: "液体の外核の運動が地球磁場の主な起源と考えられています。", terms: "外核：液体金属の層。内核：固体の中心部。" },
  { domain: "地学", subdomain: "鉱物", question: "モース硬度が最も高い鉱物はどれ？", choices: ["石英", "コランダム", "ダイヤモンド", "長石"], correct: 2, note: "ダイヤモンドはモース硬度10です。", terms: "ダイヤモンド：硬度10。コランダム：硬度9。石英：硬度7。" },
  { domain: "地学", subdomain: "天文", question: "太陽系で最も大きい惑星はどれ？", choices: ["木星", "土星", "天王星", "海王星"], correct: 0, note: "木星は太陽系最大の惑星です。", terms: "木星：最大の惑星。土星：大きな環をもつ惑星。" },
  { domain: "地学", subdomain: "気象", question: "天気図で気圧が等しい地点を結んだ線はどれ？", choices: ["等温線", "等圧線", "等高線", "海岸線"], correct: 1, note: "等圧線は同じ気圧の地点を結ぶ線です。", terms: "等圧線：気圧。等温線：気温。等高線：高さ。" },
  { domain: "地学", subdomain: "岩石", question: "マグマが冷えて固まった岩石を何という？", choices: ["火成岩", "堆積岩", "変成岩", "石灰岩"], correct: 0, note: "火成岩はマグマが冷えて固まってできます。", terms: "火成岩：マグマ起源。堆積岩：堆積物起源。変成岩：熱や圧力で変化。" },
  { domain: "地学", subdomain: "地震", question: "地震波のうち最も速く伝わる波はどれ？", choices: ["P波", "S波", "表面波", "津波"], correct: 0, note: "P波はPrimary waveで、最初に到達する地震波です。", terms: "P波：速い縦波。S波：遅い横波。表面波：地表を伝わる波。" },
  { domain: "地学", subdomain: "天文", question: "恒星の明るさと表面温度の関係を示す図はどれ？", choices: ["HR図", "天気図", "地質図", "海図"], correct: 0, note: "HR図は恒星の分類や進化を理解する基本図です。", terms: "HR図：恒星の明るさと温度の図。地質図：地層や岩石分布の図。" },
  { domain: "地学", subdomain: "大気", question: "地球大気で最も多い気体はどれ？", choices: ["酸素", "窒素", "二酸化炭素", "アルゴン"], correct: 1, note: "地球大気の約78%は窒素です。", terms: "窒素：約78%。酸素：約21%。アルゴン：約0.9%。" },
  { domain: "地学", subdomain: "海洋", question: "海水の平均的な塩分はおよそどれ？", choices: ["0.35%", "3.5%", "35%", "70%"], correct: 1, note: "海水の塩分は平均で約3.5%です。", terms: "塩分：海水に溶けた塩類の割合。" },
  { domain: "地学", subdomain: "天文", question: "月が地球の影に入る現象はどれ？", choices: ["日食", "月食", "流星", "彗星"], correct: 1, note: "月食は月が地球の影に入る現象です。", terms: "月食：月が地球の影に入る。日食：月が太陽を隠す。" },

  { domain: "工学", subdomain: "材料", question: "鉄に炭素を加えた代表的な合金はどれ？", choices: ["鋼", "黄銅", "青銅", "ジュラルミン"], correct: 0, note: "鋼は鉄を主成分とし炭素を含む合金です。", terms: "鋼：鉄と炭素。黄銅：銅と亜鉛。青銅：銅とスズ。" },
  { domain: "工学", subdomain: "電気", question: "交流を直流に変換する装置・回路を何という？", choices: ["整流器", "変圧器", "発振器", "増幅器"], correct: 0, note: "整流器は交流から直流を得るために使われます。", terms: "整流器：交流を直流へ。変圧器：交流電圧を変える。" },
  { domain: "工学", subdomain: "機械", question: "歯車の歯数比によって変わる代表的な量はどれ？", choices: ["回転速度", "色温度", "pH", "濃度"], correct: 0, note: "歯車は回転速度やトルクを変える機械要素です。", terms: "歯車：回転の伝達。トルク：回転させる力の効果。" },
  { domain: "工学", subdomain: "制御", question: "出力を入力側に戻して制御に利用する仕組みはどれ？", choices: ["フィードバック", "コンパイル", "ろ過", "蒸留"], correct: 0, note: "フィードバック制御は目標との差を利用して調整します。", terms: "フィードバック：出力を戻す制御。コンパイル：プログラム変換。" },
  { domain: "工学", subdomain: "情報通信", question: "GPSが主に利用するものはどれ？", choices: ["人工衛星", "海底ケーブル", "地震計", "顕微鏡"], correct: 0, note: "GPSは複数の人工衛星からの信号で位置を求めます。", terms: "GPS：衛星測位システム。" },
  { domain: "工学", subdomain: "土木", question: "コンクリートの主な結合材として使われる材料はどれ？", choices: ["セメント", "ガラス", "銅", "ゴム"], correct: 0, note: "セメントは水と反応して硬化し、骨材を結びます。", terms: "セメント：結合材。骨材：砂や砂利。" },
  { domain: "工学", subdomain: "電気", question: "電圧を測定する計器はどれ？", choices: ["電圧計", "電流計", "温度計", "圧力計"], correct: 0, note: "電圧計は回路の2点間の電位差を測定します。", terms: "電圧計：電圧。電流計：電流。温度計：温度。" },
  { domain: "工学", subdomain: "機械", question: "軸を支えて回転を滑らかにする部品はどれ？", choices: ["軸受", "抵抗器", "コンデンサ", "ノズル"], correct: 0, note: "軸受はベアリングとも呼ばれ、回転軸を支えます。", terms: "軸受：回転軸の支持。抵抗器：電流を制限する部品。" },
  { domain: "工学", subdomain: "製造", question: "3Dプリンタで材料を積み重ねて形を作る製造法はどれ？", choices: ["付加製造", "鋳造", "鍛造", "切削"], correct: 0, note: "付加製造は材料を積み重ねて造形する方法です。", terms: "付加製造：積層造形。切削：材料を削る加工。" },
  { domain: "工学", subdomain: "電子", question: "電荷を蓄える電子部品はどれ？", choices: ["コンデンサ", "抵抗器", "ダイオード", "リレー"], correct: 0, note: "コンデンサは電荷を蓄える部品です。", terms: "コンデンサ：蓄電。抵抗器：抵抗。ダイオード：一方向に電流を流しやすい素子。" },

  { domain: "農学", subdomain: "作物", question: "米を実らせる植物はどれ？", choices: ["イネ", "コムギ", "トウモロコシ", "ダイズ"], correct: 0, note: "米はイネの種子を加工した食品です。", terms: "イネ：米の作物。コムギ：小麦粉の原料。ダイズ：豆類。" },
  { domain: "農学", subdomain: "土壌", question: "植物の三大栄養素に含まれないものはどれ？", choices: ["窒素", "リン", "カリウム", "ヘリウム"], correct: 3, note: "三大栄養素は窒素・リン・カリウムです。", terms: "N：窒素。P：リン。K：カリウム。" },
  { domain: "農学", subdomain: "病害虫", question: "植物の病気を引き起こす微生物に含まれるものはどれ？", choices: ["菌類", "砂粒", "窒素分子", "石英"], correct: 0, note: "菌類や細菌、ウイルスなどが植物病原体になります。", terms: "菌類：カビやキノコの仲間。病原体：病気の原因となる生物など。" },
  { domain: "農学", subdomain: "畜産", question: "牛の胃のうち、発酵が盛んに行われる第一胃はどれ？", choices: ["ルーメン", "砂嚢", "盲腸", "膵臓"], correct: 0, note: "ルーメンでは微生物による発酵が行われます。", terms: "ルーメン：反芻動物の第一胃。砂嚢：鳥類などの器官。" },
  { domain: "農学", subdomain: "育種", question: "品種改良で、親から子へ伝わる性質を何という？", choices: ["形質", "降水量", "蒸散", "塩分"], correct: 0, note: "形質は生物が示す特徴で、遺伝するものがあります。", terms: "形質：生物の特徴。育種：望ましい性質をもつ品種を作ること。" },
  { domain: "農学", subdomain: "栽培", question: "植物が水を水蒸気として主に葉から放出する現象はどれ？", choices: ["蒸散", "発芽", "受粉", "発酵"], correct: 0, note: "蒸散は葉の気孔などから水が失われる現象です。", terms: "蒸散：水蒸気の放出。受粉：花粉が柱頭につくこと。" },
  { domain: "農学", subdomain: "食品", question: "牛乳を乳酸菌で発酵させた食品はどれ？", choices: ["ヨーグルト", "豆腐", "味噌", "こんにゃく"], correct: 0, note: "ヨーグルトは乳酸菌発酵によって作られます。", terms: "ヨーグルト：乳酸発酵食品。味噌：大豆などを麹で発酵。" },
  { domain: "農学", subdomain: "水産", question: "魚介類を人の管理下で育てることを何という？", choices: ["養殖", "輪作", "接ぎ木", "間伐"], correct: 0, note: "養殖は水産生物を管理して育てる生産方法です。", terms: "養殖：水産生物を育てる。輪作：作物を順に変えて栽培。" },
  { domain: "農学", subdomain: "土壌", question: "土壌の酸性・アルカリ性を表す指標はどれ？", choices: ["pH", "Bq", "cd", "Hz"], correct: 0, note: "pHは水溶液や土壌の酸性・アルカリ性の指標です。", terms: "pH：酸性・アルカリ性。Bq：放射能。cd：光度。Hz：周波数。" },
  { domain: "農学", subdomain: "栽培", question: "同じ畑で異なる作物を順番に栽培する方法はどれ？", choices: ["輪作", "単作", "養殖", "精米"], correct: 0, note: "輪作は病害や土壌養分の偏りを抑える目的で行われます。", terms: "輪作：作物を交替。単作：同じ作物を続ける栽培。" },

  { domain: "情報・計算機科学", subdomain: "Web", question: "Webページの見出しや段落など、文書構造を記述する代表的な言語はどれ？", choices: ["HTML", "CSS", "SQL", "Python"], correct: 0, note: "HTMLはWebページの構造を記述するマークアップ言語です。", terms: "HTML：文書構造。CSS：見た目。SQL：データベース操作。Python：プログラミング言語。" },
  { domain: "情報・計算機科学", subdomain: "データベース", question: "リレーショナルデータベースの問い合わせに使われる代表的な言語はどれ？", choices: ["SQL", "HTML", "CSS", "PNG"], correct: 0, note: "SQLはデータの検索・追加・更新などに使われます。", terms: "SQL：データベース問い合わせ言語。PNG：画像形式。" },
  { domain: "情報・計算機科学", subdomain: "ネットワーク", question: "Webページ取得で広く使われる通信プロトコルはどれ？", choices: ["HTTP", "JPEG", "CSV", "UTF-8"], correct: 0, note: "HTTPはWebの通信に使われるプロトコルです。", terms: "HTTP：Web通信。JPEG：画像形式。CSV：表形式テキスト。UTF-8：文字コード。" },
  { domain: "情報・計算機科学", subdomain: "セキュリティ", question: "本人確認で使う「IDとパスワード」のうち、秘密にすべきものはどれ？", choices: ["パスワード", "ユーザー名", "公開鍵", "URL"], correct: 0, note: "パスワードは本人確認の秘密情報です。", terms: "パスワード：秘密情報。公開鍵：公開して使える鍵。" },
  { domain: "情報・計算機科学", subdomain: "アルゴリズム", question: "データを小さい順や大きい順に並べ替える処理はどれ？", choices: ["ソート", "検索", "圧縮", "暗号化"], correct: 0, note: "ソートはデータを一定の順序に並べ替える処理です。", terms: "ソート：並べ替え。検索：探す。圧縮：容量を減らす。暗号化：読めない形に変換。" },
  { domain: "情報・計算機科学", subdomain: "データ表現", question: "0と1だけで数や情報を表す表記はどれ？", choices: ["2進数", "10進数", "16進数", "ローマ数字"], correct: 0, note: "コンピュータ内部では2進数による表現が基本です。", terms: "2進数：0と1。10進数：0から9。16進数：0から9とAからF。" },
  { domain: "情報・計算機科学", subdomain: "プログラミング", question: "プログラムの誤りを見つけて直す作業を何という？", choices: ["デバッグ", "レンダリング", "バックアップ", "ログイン"], correct: 0, note: "デバッグはバグを発見し修正する作業です。", terms: "デバッグ：誤りの修正。バックアップ：データの予備保存。" },
  { domain: "情報・計算機科学", subdomain: "OS", question: "Windows、macOS、Linuxは一般に何の種類？", choices: ["オペレーティングシステム", "画像形式", "通信ケーブル", "暗号方式"], correct: 0, note: "これらはコンピュータを管理するOSです。", terms: "OS：基本ソフトウェア。画像形式：PNGやJPEGなど。" },
  { domain: "情報・計算機科学", subdomain: "AI", question: "大量のデータから規則性を学習するAI分野はどれ？", choices: ["機械学習", "手動計算", "配線工事", "紙の校正"], correct: 0, note: "機械学習はデータからモデルを学習する分野です。", terms: "機械学習：データから学ぶ方法。モデル：予測や分類に使う仕組み。" },
  { domain: "情報・計算機科学", subdomain: "ネットワーク", question: "インターネット上の住所に相当する数値識別子はどれ？", choices: ["IPアドレス", "拡張子", "フォント", "ピクセル"], correct: 0, note: "IPアドレスはネットワーク上の機器を識別します。", terms: "IPアドレス：ネットワーク上の識別子。拡張子：ファイル種別の目印。" },

  { domain: "医歯薬学", subdomain: "人体", question: "心臓から全身へ血液を送り出す血管はどれ？", choices: ["大動脈", "大静脈", "肺静脈", "門脈"], correct: 0, note: "大動脈は左心室から全身へ血液を送る太い動脈です。", terms: "大動脈：全身へ送る。大静脈：全身から戻る。" },
  { domain: "医歯薬学", subdomain: "薬学", question: "薬の効き目をもたらす主な成分を何という？", choices: ["有効成分", "添加物", "賦形剤", "香料"], correct: 0, note: "有効成分は薬効を示す中心的な成分です。", terms: "有効成分：薬効の主体。添加物：製剤化の補助成分。" },
  { domain: "医歯薬学", subdomain: "歯学", question: "歯の表面を覆う人体で最も硬い組織はどれ？", choices: ["エナメル質", "象牙質", "歯髄", "歯肉"], correct: 0, note: "エナメル質は歯冠表面を覆う非常に硬い組織です。", terms: "エナメル質：歯の表面。象牙質：その内側。歯髄：神経や血管を含む部分。" },
  { domain: "医歯薬学", subdomain: "感染症", question: "細菌を殺す、または増殖を抑える薬は一般に何と呼ばれる？", choices: ["抗菌薬", "解熱鎮痛薬", "制酸薬", "利尿薬"], correct: 0, note: "抗菌薬は細菌感染症に対して使われます。", terms: "抗菌薬：細菌に作用。解熱鎮痛薬：熱や痛みに作用。" },
  { domain: "医歯薬学", subdomain: "人体", question: "酸素を運ぶ赤血球中のタンパク質はどれ？", choices: ["ヘモグロビン", "コラーゲン", "インスリン", "アミラーゼ"], correct: 0, note: "ヘモグロビンは酸素と結合して運搬します。", terms: "ヘモグロビン：酸素運搬。インスリン：血糖調節。アミラーゼ：でんぷん分解酵素。" },
  { domain: "医歯薬学", subdomain: "薬学", question: "薬を飲み薬として口から取り入れる投与経路はどれ？", choices: ["経口投与", "静脈内投与", "経皮投与", "吸入投与"], correct: 0, note: "経口投与は口から薬を服用する方法です。", terms: "経口：口から。静脈内：血管内へ。経皮：皮膚から。吸入：肺へ。" },
  { domain: "医歯薬学", subdomain: "栄養", question: "ビタミンCの化学名として知られるものはどれ？", choices: ["アスコルビン酸", "クエン酸", "乳酸", "酢酸"], correct: 0, note: "ビタミンCはアスコルビン酸としても知られます。", terms: "アスコルビン酸：ビタミンC。クエン酸：柑橘類などに多い有機酸。" },
  { domain: "医歯薬学", subdomain: "人体", question: "尿を作る主な臓器はどれ？", choices: ["腎臓", "肝臓", "膵臓", "脾臓"], correct: 0, note: "腎臓は血液をろ過して尿を作ります。", terms: "腎臓：尿生成。肝臓：代謝や解毒。膵臓：消化酵素やホルモン。" },
  { domain: "医歯薬学", subdomain: "免疫", question: "抗体を産生する免疫細胞に分化するリンパ球はどれ？", choices: ["B細胞", "赤血球", "血小板", "好中球"], correct: 0, note: "B細胞は形質細胞に分化して抗体を産生します。", terms: "B細胞：抗体産生に関与。好中球：自然免疫で重要な白血球。" },
  { domain: "医歯薬学", subdomain: "薬学", question: "薬の体内での吸収・分布・代謝・排泄を扱う分野はどれ？", choices: ["薬物動態学", "解剖学", "疫学", "病理学"], correct: 0, note: "薬物動態学はADMEを扱います。", terms: "ADME：吸収・分布・代謝・排泄。薬力学：薬が体に及ぼす作用。" },

  { domain: "人文社会科学", subdomain: "心理学", question: "記憶を短時間だけ保持する仕組みはどれ？", choices: ["短期記憶", "古典的条件づけ", "社会化", "貨幣供給"], correct: 0, note: "短期記憶は一時的に情報を保持する記憶です。", terms: "短期記憶：一時保持。長期記憶：長期間保持。" },
  { domain: "人文社会科学", subdomain: "経済学", question: "需要と供給が一致する価格を何という？", choices: ["均衡価格", "失業率", "所得税", "為替レート"], correct: 0, note: "均衡価格は市場で需要量と供給量が一致する価格です。", terms: "均衡価格：需要と供給が一致。為替レート：通貨の交換比率。" },
  { domain: "人文社会科学", subdomain: "社会学", question: "社会の中で共有される行動の決まりや期待を何という？", choices: ["規範", "緯度", "触媒", "塩基"], correct: 0, note: "規範は社会で望ましいとされる行動基準です。", terms: "規範：行動基準。制度：社会的な仕組み。" },
  { domain: "人文社会科学", subdomain: "歴史", question: "日本国憲法が施行された年はどれ？", choices: ["1945年", "1947年", "1951年", "1964年"], correct: 1, note: "日本国憲法は1947年5月3日に施行されました。", terms: "施行：法令の効力が発生すること。公布：公に知らせること。" },
  { domain: "人文社会科学", subdomain: "言語学", question: "意味を区別する最小の音の単位を何という？", choices: ["音素", "文節", "形態素", "段落"], correct: 0, note: "音素は言語で意味の違いを生む最小の音単位です。", terms: "音素：音の単位。形態素：意味をもつ最小単位。" },
  { domain: "人文社会科学", subdomain: "法学", question: "犯罪と刑罰について定める法律分野はどれ？", choices: ["刑法", "民法", "商法", "民俗学"], correct: 0, note: "刑法は犯罪と刑罰に関する基本法です。", terms: "刑法：犯罪と刑罰。民法：私人間の権利義務。" },
  { domain: "人文社会科学", subdomain: "政治学", question: "国会が法律を作る働きは一般に何権と呼ばれる？", choices: ["立法権", "行政権", "司法権", "所有権"], correct: 0, note: "立法権は法律を制定する権限です。", terms: "立法権：法律を作る。行政権：政策を実行。司法権：裁判。" },
  { domain: "人文社会科学", subdomain: "地理", question: "人口を面積で割った値はどれ？", choices: ["人口密度", "出生率", "標高", "識字率"], correct: 0, note: "人口密度は単位面積あたりの人口です。", terms: "人口密度：人口÷面積。出生率：出生数の割合。" },
  { domain: "人文社会科学", subdomain: "哲学", question: "『我思う、ゆえに我あり』で知られる哲学者は誰？", choices: ["デカルト", "アリストテレス", "カント", "ニーチェ"], correct: 0, note: "デカルトは近代哲学の出発点として知られます。", terms: "デカルト：方法的懐疑。カント：批判哲学。ニーチェ：近代思想家。" },
  { domain: "人文社会科学", subdomain: "教育学", question: "学習者が自分の学びを振り返って調整することを何という？", choices: ["メタ認知", "インフレーション", "光合成", "沈殿"], correct: 0, note: "メタ認知は自分の認知や学習を客観的に捉える働きです。", terms: "メタ認知：自分の思考を捉えること。振り返り：学習改善に役立つ活動。" }
];

function idFor(index: number) {
  return `10000000-0000-4000-8002-${String(index + 1).padStart(12, "0")}`;
}

function titleFor(spec: Spec) {
  return `${spec.domain} 知識確認 ${spec.subdomain}`;
}

function toQuestion(spec: Spec, index: number): BankQuestion {
  const domainOffset = Math.floor(index / 10);
  const withinDomain = index - domainOffset * 10;
  const difficulty = difficulties[withinDomain];
  const correctChoice = spec.choices[spec.correct];
  return {
    id: idFor(index),
    title: titleFor(spec),
    question_text: spec.question,
    choices: [...spec.choices],
    correct_choice_index: spec.correct,
    short_explanation: `正解は「${correctChoice}」です。${spec.note}`,
    detailed_explanation: `${spec.note} この問題は計算や推論ではなく、用語・単位・事実を正確に取り出せるかを確認します。${spec.terms}`,
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
    common_misconception: "似た用語・単位・人物名を混同する",
    basic_terms: spec.terms,
    source_url: "",
    source_note: "全分野科学検定 知識確認100問 v1",
    currentness_type: "evergreen",
    expires_at: null,
    tags: [spec.domain, spec.subdomain, "知識確認", "用語・定義", "基礎力", "v1"],
    status: "published"
  };
}

export const knowledgeQuestions: BankQuestion[] = specs.map(toQuestion);
