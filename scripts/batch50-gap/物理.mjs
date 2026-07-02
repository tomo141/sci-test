import { q, balanceAll } from "../lib/batch50-helpers.mjs";

const raw = [
  // L100 ×1
  q({
    domain: "物理",
    subdomain: "熱",
    difficulty_initial: 100,
    cognitive_type: "原理・因果",
    question_text: "金属の棒を加熱すると棒が少し長くなる主な理由はどれか。",
    choices: [
      "原子の間隔が広がるため",
      "原子の数が増えるため",
      "重力が弱くなるため",
      "金属が液体に変わるため"
    ],
    correct_choice_index: 0,
    short_explanation: "温度上昇で原子の振動が大きくなり、平均的な原子間距離が広がる。",
    detailed_explanation: "熱膨張は分子・原子の熱運動の激しさに伴い平衡位置がわずかに離れることで起こる。原子の個数や質量は通常変わらない。",
    learning_objective: "熱膨張が原子間距離の変化による現象であることを説明できる",
    common_misconception: "加熱すると原子が増えると考える",
    distractor_rationales: [
      "正解。温度上昇で原子間の平均距離が広がる。",
      "不正解。加熱だけでは原子数は変わらない。",
      "不正解。熱膨張と重力の変化は無関係。",
      "不正解。固体の軽い加熱では融解しない。"
    ],
    basic_terms: "熱膨張：温度上昇に伴う物体の寸法増加、原子間距離：結晶や固体中の粒子間の平均的な隔たり"
  }),

  // L200 ×1
  q({
    domain: "物理",
    subdomain: "力学",
    difficulty_initial: 200,
    cognitive_type: "原理・因果",
    question_text: "てこを用いて軽い力で重い物体を持ち上げられる主な理由はどれか。",
    choices: [
      "力点と作用点の距離の比で力を変換できるため",
      "物体の質量が一時的に減るため",
      "重力がてこだけ無効になるため",
      "摩擦が完全になくなるため"
    ],
    correct_choice_index: 0,
    short_explanation: "てこは支点からの腕の長さの比により力の大きさを変えられる。",
    detailed_explanation: "剛体のてこでは力点のモーメントと作用点のモーメントが釣り合うとき F₁L₁ = F₂L₂ が成り立ち、腕が長い側で小さな力を大きな力に変換できる。",
    learning_objective: "てこの原理が力のモーメントの釣り合いに基づくことを説明できる",
    common_misconception: "てこを使うと重力そのものが減ると考える",
    distractor_rationales: [
      "正解。モーメントの釣り合いにより力の大きさを変換できる。",
      "不正解。質量は変わらない。",
      "不正解。重力は消えない。",
      "不正解。摩擦は依然として存在しうる。"
    ],
    basic_terms: "てこ：支点・力点・作用点をもつ単純機械、モーメント：力と力の腕の積"
  }),

  // L300 ×4
  q({
    domain: "物理",
    subdomain: "波",
    difficulty_initial: 300,
    cognitive_type: "基本的な適用",
    question_text: "振幅を他の条件のまま2倍にした単振動の全エネルギーは、元の何倍になるか。",
    choices: [
      "4倍",
      "2倍",
      "8倍",
      "変わらない"
    ],
    correct_choice_index: 0,
    short_explanation: "単振動のエネルギーは振幅の2乗に比例するため、振幅2倍で4倍になる。",
    detailed_explanation: "単振動の全エネルギー E = ½kA² より E ∝ A²。振幅 A を2倍にするとエネルギーは4倍になる。",
    learning_objective: "単振動のエネルギーが振幅の2乗に比例することを適用できる",
    common_misconception: "エネルギーが振幅に比例すると考える",
    distractor_rationales: [
      "正解。E ∝ A² より振幅2倍でエネルギー4倍。",
      "不正解。線形比例ではなく2乗に比例する。",
      "不正解。3乗や8倍にはならない。",
      "不正解。振幅を変えればエネルギーも変わる。"
    ],
    basic_terms: "単振動：復元力に比例する往復運動、振幅：振動の最大変位"
  }),

  q({
    domain: "物理",
    subdomain: "電磁気",
    difficulty_initial: 300,
    cognitive_type: "基本的な適用",
    question_text: "抵抗 10 Ω に 2 A の電流を 5 秒間流し続けたとき、抵抗で発生するジュール熱の量はどれか。",
    choices: [
      "200 J",
      "20 J",
      "50 J",
      "100 J"
    ],
    correct_choice_index: 0,
    short_explanation: "Q = I²Rt = 2² × 10 × 5 = 200 J。",
    detailed_explanation: "ジュール熱は Q = I²Rt で与えられる。I = 2 A、R = 10 Ω、t = 5 s より Q = 4 × 10 × 5 = 200 J。",
    learning_objective: "ジュール熱の公式 Q = I²Rt を用いて発熱量を計算できる",
    common_misconception: "Q = IRt と一次式で計算する",
    distractor_rationales: [
      "正解。Q = I²Rt = 200 J。",
      "不正解。I² ではなく I だけを使った誤計算。",
      "不正解。時間を掛け忘れた値に近い。",
      "不正解。I²R = 40 W を時間5秒で掛けた値ではない。"
    ],
    basic_terms: "ジュール熱：電流による抵抗発熱、電力 P = I²R"
  }),

  q({
    domain: "物理",
    subdomain: "原子物理",
    difficulty_initial: 300,
    cognitive_type: "用語・定義",
    question_text: "放射性物質から放出される α 線の実体として正しいものはどれか。",
    choices: [
      "ヘリウム原子核（⁴He²⁺）",
      "高速の電子",
      "電磁波（γ線）",
      "中性子"
    ],
    correct_choice_index: 0,
    short_explanation: "α 線は⁴He の原子核2個の陽子と2個の中性子からなる粒子である。",
    detailed_explanation: "α 崩壊では原子核が⁴He 核を放出する。β 線は電子（または陽電子）、γ 線は電磁波、中性子は別の放射線種である。",
    learning_objective: "α・β・γ 放射線の実体を区別して説明できる",
    common_misconception: "α 線を電子や電磁波と混同する",
    distractor_rationales: [
      "正解。α 粒子はヘリウム原子核である。",
      "不正解。高速電子は β 線の実体。",
      "不正解。電磁波は γ 線の実体。",
      "不正解。中性子は α・β・γ とは別の粒子線。"
    ],
    basic_terms: "α 線：ヘリウム原子核からなる放射線、β 線：電子または陽電子、γ 線：高エネルギー電磁波"
  }),

  q({
    domain: "物理",
    subdomain: "力学",
    difficulty_initial: 300,
    cognitive_type: "比較・分類",
    question_text: "同じ質量のおもりを、回転軸から遠い位置に置いたほうが回転しにくくなる主な理由はどれか。",
    choices: [
      "慣性モーメントが大きくなるため",
      "質量が増えるため",
      "重力が強くなるため",
      "摩擦が増えるため"
    ],
    correct_choice_index: 0,
    short_explanation: "慣性モーメント I = Σmr² は軸からの距離の2乗に比例する。",
    detailed_explanation: "回転運動では τ = Iα が成り立ち、同じトルクでも I が大きいほど角加速度 α は小さくなる。おもりを遠くに置くと r² が大きく I が増える。",
    learning_objective: "慣性モーメントが質量分布と軸からの距離に依存することを説明できる",
    common_misconception: "回転のしにくさは質量だけで決まると考える",
    distractor_rationales: [
      "正解。軸から遠いほど慣性モーメントが大きく回転しにくい。",
      "不正解。質量は変わらない。",
      "不正解。重力の大きさは位置の違いで変わらない。",
      "不正解。摩擦は問題の主因ではない。"
    ],
    basic_terms: "慣性モーメント：回転に対する慣性の大きさ、トルク：回転を起こす力のモーメント"
  }),

  // L400 ×5
  q({
    domain: "物理",
    subdomain: "力学",
    difficulty_initial: 400,
    cognitive_type: "原理・因果",
    question_text: "万有引力の大きさ F が、2 物体の距離 r にどのように依存するかとして正しいものはどれか。",
    choices: [
      "F ∝ 1/r²",
      "F ∝ 1/r",
      "F ∝ r",
      "F ∝ r²"
    ],
    correct_choice_index: 0,
    short_explanation: "万有引力は F = GmM/r² より距離の2乗に反比例する。",
    detailed_explanation: "ニュートンの万有引力の法則 F = Gm₁m₂/r² では、力は質量の積に比例し距離の2乗に反比例する。",
    learning_objective: "万有引力が距離の2乗に反比例することを説明できる",
    common_misconception: "万有引力が距離に単純反比例すると考える",
    distractor_rationales: [
      "正解。F ∝ 1/r² が万有引力の法則。",
      "不正解。1/r はクーロン力とも異なる依存性。",
      "不正解。距離に比例すると力が遠くで強くなる。",
      "不正解。距離の2乗に比例する法則は万有引力ではない。"
    ],
    basic_terms: "万有引力定数 G：万有引力の比例定数、反比例：一方が増えるともう一方が減る関係"
  }),

  q({
    domain: "物理",
    subdomain: "電磁気",
    difficulty_initial: 400,
    cognitive_type: "原理・因果",
    question_text: "閉じた経路におけるキルヒホッフの第一法則（電流則）の内容として正しいものはどれか。",
    choices: [
      "接続点に流入する電流の代数和がゼロになる",
      "経路の電圧降下の総和が起電力に等しい",
      "電流は抵抗の大きさに比例する",
      "接続点の電位はすべて等しい"
    ],
    correct_choice_index: 0,
    short_explanation: "第一法則はノード（接続点）での電流の保存を表す。",
    detailed_explanation: "キルヒホッフの第一法則は流入電流と流出電流の代数和がゼロという電荷保存の表現である。第二法則が閉回路の電圧則。",
    learning_objective: "キルヒホッフの第一法則と第二法則を区別して説明できる",
    common_misconception: "第一法則を電圧則と混同する",
    distractor_rationales: [
      "正解。接続点で流入・流出電流の代数和がゼロになる。",
      "不正解。これは第二法則（電圧則）の内容。",
      "不正解。オームの法則の記述。",
      "不正解。接続点の電位が等しいとは限らない。"
    ],
    basic_terms: "キルヒホッフの法則：回路解析の基本法則、ノード：複数素子が接続される点"
  }),

  q({
    domain: "物理",
    subdomain: "波",
    difficulty_initial: 400,
    cognitive_type: "基本的な適用",
    question_text: "同一振幅の2つのコヒーレント波が重ね合わされたとき、強い明るさ（建設的干渉）が生じる位相差の条件はどれか。",
    choices: [
      "位相差が 2π の整数倍",
      "位相差が π の奇数倍",
      "位相差が π/2",
      "位相差が任意の値"
    ],
    correct_choice_index: 0,
    short_explanation: "位相差 2πn（n は整数）のとき振幅が最大となり建設的干渉が起こる。",
    detailed_explanation: "コヒーレント波の重ね合わせでは、位相差が 2π の整数倍のとき位相が揃い建設的干渉となる。π の奇数倍では破壊的干渉。",
    learning_objective: "干渉条件を位相差で述べられる",
    common_misconception: "位相差 π で明るくなると混同する",
    distractor_rationales: [
      "正解。2π の整数倍で位相が一致し建設的干渉。",
      "不正解。π の奇数倍は破壊的干渉。",
      "不正解。π/2 では中間的な強度。",
      "不正解。干渉には特定の位相条件が必要。"
    ],
    basic_terms: "建設的干渉：波が強め合う重ね合わせ、コヒーレント：一定の位相関係をもつ波"
  }),

  q({
    domain: "物理",
    subdomain: "熱",
    difficulty_initial: 400,
    cognitive_type: "原理・因果",
    question_text: "理想気体の圧力を分子運動論で説明するとき、圧力が比例する量として正しいものはどれか。",
    choices: [
      "分子の平均運動エネルギー",
      "分子間の引力の大きさ",
      "気体の体積の2乗",
      "分子の直径の3乗"
    ],
    correct_choice_index: 0,
    short_explanation: "P = (1/3)ρ⟨v²⟩ より圧力は分子の平均運動エネルギーに比例する。",
    detailed_explanation: "容器壁への分子衝突から P = nkT = NkT/V が導かれ、温度（平均運動エネルギー）に比例する。理想気体では分子間力は無視する。",
    learning_objective: "気体の圧力が分子の運動エネルギーと温度に結びつくことを説明できる",
    common_misconception: "圧力は主に分子間引力で決まると考える",
    distractor_rationales: [
      "正解。圧力は分子の運動による運動量輸送に比例する。",
      "不正解。理想気体では分子間力は無視する。",
      "不正解。体積の2乗には比例しない。",
      "不正解。分子直径は理想気体の圧力式に直接現れない。"
    ],
    basic_terms: "分子運動論：気体を粒子の集団として扱う理論、平均運動エネルギー：分子の運動の大きさの平均"
  }),

  q({
    domain: "物理",
    subdomain: "光学",
    difficulty_initial: 400,
    cognitive_type: "基本的な適用",
    question_text: "光が屈折率の大きい媒質から小さい媒質へ入射し、全反射が起こる条件として正しいものはどれか（n₁ > n₂）。",
    choices: [
      "入射角が臨界角以上",
      "入射角が任意の角度",
      "入射角が臨界角より小さい",
      "屈折角が 45° 以上"
    ],
    correct_choice_index: 0,
    short_explanation: "n₁ sin θ_c = n₂ より入射角が臨界角以上で全反射が起こる。",
    detailed_explanation: "密な媒質から疏な媒質へ入射するとき、屈折角が 90° となる入射角を臨界角という。これ以上では屈折が起こらず全反射する。",
    learning_objective: "全反射の条件を屈折率と臨界角で説明できる",
    common_misconception: "全反射はどの入射角でも起こると考える",
    distractor_rationales: [
      "正解。入射角が臨界角以上で全反射。",
      "不正解。臨界角以上という条件が必要。",
      "不正解。臨界角より小さいときは通常の屈折が起こる。",
      "不正解。45° という固定角度ではない。"
    ],
    basic_terms: "全反射：光が境界面で反射のみ起こす現象、臨界角：屈折角が 90° となる入射角"
  }),

  // L500 ×4
  q({
    domain: "物理",
    subdomain: "力学",
    difficulty_initial: 500,
    cognitive_type: "基本的な適用",
    question_text: "質量 4 kg の物体が速さ 3 m/s で運動しているとき、その運動エネルギーはどれか。",
    choices: [
      "18 J",
      "12 J",
      "36 J",
      "72 J"
    ],
    correct_choice_index: 0,
    short_explanation: "K = ½mv² = ½ × 4 × 9 = 18 J。",
    detailed_explanation: "運動エネルギー K = ½mv²。m = 4 kg、v = 3 m/s より K = ½ × 4 × 3² = 18 J。",
    learning_objective: "運動エネルギー公式 K = ½mv² を適用できる",
    common_misconception: "K = mv と一次式で計算する",
    distractor_rationales: [
      "正解。K = ½mv² = 18 J。",
      "不正解。mv = 12 J で速度の2乗を使っていない。",
      "不正解。½ を掛け忘れた値。",
      "不正解。係数の誤り。"
    ],
    basic_terms: "運動エネルギー：物体の運動に伴うエネルギー K = ½mv²"
  }),

  q({
    domain: "物理",
    subdomain: "電磁気",
    difficulty_initial: 500,
    cognitive_type: "原理・因果",
    question_text: "磁束密度 B のある磁場中を、電荷 q の粒子が速度 v で垂直に運動するとき、粒子に働くローレンツ力の大きさはどれか。",
    choices: [
      "qvB",
      "qB/v",
      "qv²B",
      "qB²v"
    ],
    correct_choice_index: 0,
    short_explanation: "磁場に垂直な運動に対するローレンツ力は F = qvB。",
    detailed_explanation: "ローレンツ力 F = q(E + v×B)。磁場のみで v ⊥ B のとき大きさは F = qvB となる。",
    learning_objective: "ローレンツ力の大きさを磁場・電荷・速度から求められる",
    common_misconception: "力が速度の2乗に比例すると考える",
    distractor_rationales: [
      "正解。v ⊥ B のとき F = qvB。",
      "不正解。速度で割ると次元が合わない。",
      "不正解。v² ではなく v に比例する。",
      "不正解。B の2乗には比例しない。"
    ],
    basic_terms: "ローレンツ力：電磁場中の荷電粒子に働く力、磁束密度 B：磁場の強さを表すベクトル"
  }),

  q({
    domain: "物理",
    subdomain: "熱力学",
    difficulty_initial: 500,
    cognitive_type: "比較・分類",
    question_text: "可逆過程と不可逆過程を比較したとき、孤立系のエントロピー変化について正しいものはどれか。",
    choices: [
      "不可逆過程では孤立系のエントロピーは増大する",
      "可逆過程では孤立系のエントロピーは減少する",
      "どちらの過程でも孤立系のエントロピーは一定",
      "可逆過程でのみ孤立系のエントロピーが増大する"
    ],
    correct_choice_index: 0,
    short_explanation: "孤立系では可逆過程で ΔS = 0、不可逆過程で ΔS > 0。",
    detailed_explanation: "熱力学第二法則より孤立系のエントロピーは増大しない。可逆過程では ΔS = 0、不可逆過程では ΔS > 0 となる。",
    learning_objective: "可逆・不可逆過程におけるエントロピー変化を区別できる",
    common_misconception: "可逆過程でエントロピーが減ると考える",
    distractor_rationales: [
      "正解。不可逆過程で孤立系のエントロピーは増大する。",
      "不正解。孤立系でエントロピーは減少しない。",
      "不正解。不可逆過程では増大する。",
      "不正解。不可逆過程でもエントロピーは増大しうる。"
    ],
    basic_terms: "可逆過程：無限にゆっくり進む理想過程、不可逆過程：実際に起こりうる非平衡過程"
  }),

  q({
    domain: "物理",
    subdomain: "量子",
    difficulty_initial: 500,
    cognitive_type: "基本的な適用",
    question_text: "光電効果において、入射光の周波数を ν、プランク定数を h とするとき、放出される光電子の最大運動エネルギー K_max を表す式はどれか（仕事関数を φ とする）。",
    choices: [
      "K_max = hν − φ",
      "K_max = hν + φ",
      "K_max = hν / φ",
      "K_max = φ − hν"
    ],
    correct_choice_index: 0,
    short_explanation: "アインシュタインの光電効果の式は K_max = hν − φ。",
    detailed_explanation: "光子エネルギー hν のうち、金属から電子を引き抜くのに必要な仕事関数 φ を超えた分が最大運動エネルギーとなる。",
    learning_objective: "光電効果のエネルギー保存式を適用できる",
    common_misconception: "仕事関数を足し合わせると考える",
    distractor_rationales: [
      "正解。K_max = hν − φ がアインシュタインの式。",
      "不正解。仕事関数は差し引く。",
      "不正解。除算の形は成り立たない。",
      "不正解。符号が逆で物理的に意味をなさない。"
    ],
    basic_terms: "光電効果：光により金属から電子が放出される現象、仕事関数：電子を引き抜くのに必要な最小エネルギー"
  }),

  // L600 ×3
  q({
    domain: "物理",
    subdomain: "電磁気学",
    difficulty_initial: 600,
    cognitive_type: "原理・因果",
    question_text: "静磁場においてベクトルポテンシャル A と磁束密度 B の関係として正しいものはどれか。",
    choices: [
      "B = ∇ × A",
      "B = ∇ · A",
      "B = −∇A",
      "B = ∇²A"
    ],
    correct_choice_index: 0,
    short_explanation: "磁場はベクトルポテンシャルの回転として B = ∇ × A と表される。",
    detailed_explanation: "マクスウェル方程式の ∇·B = 0 より B はあるベクトル場の回転で書ける。これがベクトルポテンシャル A で B = ∇ × A。",
    learning_objective: "ベクトルポテンシャルと磁場の関係を述べられる",
    common_misconception: "B = −∇A とスカラーポテンシャルと混同する",
    distractor_rationales: [
      "正解。B = ∇ × A がベクトルポテンシャルの定義。",
      "不正解。発散は磁場のソースを表さない。",
      "不正解。スカラーポテンシャルの勾配は電場に関係する。",
      "不正解。ラプラシアンはポアソン方程式に現れる。"
    ],
    basic_terms: "ベクトルポテンシャル：磁場を回転として表すベクトル場、回転 ∇×：ベクトル場の回転成分"
  }),

  q({
    domain: "物理",
    subdomain: "統計力学",
    difficulty_initial: 600,
    cognitive_type: "基本的な適用",
    question_text: "理想気体の状態方程式 PV = Nk_BT において、k_B の物理的意味として正しいものはどれか。",
    choices: [
      "ボルツマン定数で、分子の熱運動と温度を結ぶ比例定数",
      "1 分子あたりの平均運動エネルギー",
      "温度 1 K あたりの分子のエントロピー",
      "アボガドロ数とプランク定数の積"
    ],
    correct_choice_index: 0,
    short_explanation: "k_B はボルツマン定数で、分子スケールのエネルギーと温度を結ぶ。",
    detailed_explanation: "ボルツマン定数 k_B ≈ 1.38×10⁻²³ J/K は、理想気体や統計力学で温度とエネルギーを結ぶ基本定数である。R = N_A k_B。",
    learning_objective: "ボルツマン定数の役割を理想気体の文脈で説明できる",
    common_misconception: "k_B をアボガドロ数と混同する",
    distractor_rationales: [
      "正解。k_B は分子スケールの熱力学と統計力学を結ぶ定数。",
      "不正解。平均運動エネルギーは (3/2)k_BT などの形で現れる。",
      "不正解。エントロピーの単位ではない。",
      "不正解。それは気体定数 R に関係するが k_B そのものではない。"
    ],
    basic_terms: "ボルツマン定数 k_B：統計力学の基本定数、理想気体：分子間力を無視した気体模型"
  }),

  q({
    domain: "物理",
    subdomain: "固体物理",
    difficulty_initial: 600,
    cognitive_type: "用語・定義",
    question_text: "絶対零度における金属のフェルミ準位の定義として正しいものはどれか。",
    choices: [
      "伝導電子が占有する最高エネルギー準位",
      "価電子帯の上端のエネルギー",
      "原子核の結合エネルギー",
      "格子振動の零点エネルギー"
    ],
    correct_choice_index: 0,
    short_explanation: "T = 0 K ではフェルミ準位が最高占有準位となる。",
    detailed_explanation: "パウリの除外原理により電子は低いエネルギー準位から順に占有される。絶対零度ではフェルミ準位が最高占有エネルギーである。",
    learning_objective: "フェルミ準位を金属電子系の最高占有準位として説明できる",
    common_misconception: "フェルミ準位を価電子帯の上端と混同する",
    distractor_rationales: [
      "正解。絶対零度での最高占有エネルギーがフェルミ準位。",
      "不正解。価電子帯上端は半導体の文脈で使われる。",
      "不正解。原子核の結合エネルギーとは無関係。",
      "不正解。零点エネルギーは格子振動に関する量。"
    ],
    basic_terms: "フェルミ準位：金属中の電子の化学ポテンシャルに相当するエネルギー、伝導電子：金属中を自由に動ける電子"
  }),

  // L700 ×3
  q({
    domain: "物理",
    subdomain: "量子力学",
    difficulty_initial: 700,
    cognitive_type: "原理・因果",
    question_text: "パウリの除外原理が述べる内容として正しいものはどれか。",
    choices: [
      "同一の量子状態に2つ以上のフェルミオンは占められない",
      "全ての粒子は同じ量子状態を共有できる",
      "ボソンは1つの状態に1粒子しか入れない",
      "スピンがゼロの粒子のみ除外原理の対象"
    ],
    correct_choice_index: 0,
    short_explanation: "フェルミオンは1つの量子状態に最大1粒子までしか入れない。",
    detailed_explanation: "パウリの除外原理は半整数スピンをもつフェルミオンに対し、完全に同じ量子数の状態は占有できないことを述べる。",
    learning_objective: "パウリの除外原理の対象と内容を説明できる",
    common_misconception: "除外原理がボソンにも適用されると考える",
    distractor_rationales: [
      "正解。フェルミオンは同一量子状態に2つ以上入れない。",
      "不正解。フェルミオンは同じ状態を共有できない。",
      "不正解。ボソンは同じ状態に多数集まりうる。",
      "不正解。半整数スピンのフェルミオンが対象。"
    ],
    basic_terms: "フェルミオン：半整数スピンの粒子、ボソン：整数スピンの粒子"
  }),

  q({
    domain: "物理",
    subdomain: "統計力学",
    difficulty_initial: 700,
    cognitive_type: "基本的な適用",
    question_text: "キャノニカルアンサンブルの分配関数 Z = Σ_i e^(−βE_i) において、系の平均エネルギー ⟨E⟩ を表す式はどれか（β = 1/k_BT）。",
    choices: [
      "⟨E⟩ = −∂(ln Z)/∂β",
      "⟨E⟩ = ∂Z/∂T",
      "⟨E⟩ = k_BT ln Z",
      "⟨E⟩ = Z / β"
    ],
    correct_choice_index: 0,
    short_explanation: "⟨E⟩ = −∂(ln Z)/∂β が統計力学の基本関係式である。",
    detailed_explanation: "分配関数から熱力学量を導くとき、平均エネルギーは ⟨E⟩ = −∂(ln Z)/∂β で与えられる。",
    learning_objective: "分配関数から平均エネルギーを導出できる",
    common_misconception: "平均エネルギーが k_BT ln Z と混同される",
    distractor_rationales: [
      "正解。⟨E⟩ = −∂(ln Z)/∂β。",
      "不正解。温度で直接微分する形ではない。",
      "不正解。自由エネルギーに関係する形と混同。",
      "不正解。次元が合わない。"
    ],
    basic_terms: "分配関数：統計力学で系の状態和をとった関数、キャノニカルアンサンブル：定温熱浴と接触する系"
  }),

  q({
    domain: "物理",
    subdomain: "相対性理論",
    difficulty_initial: 700,
    cognitive_type: "比較・分類",
    question_text: "特殊相対性理論において、4元ベクトル (ct, x, y, z) の不変量（ローレンツ不変量）として正しいものはどれか。",
    choices: [
      "(ct)² − x² − y² − z²",
      "ct + x + y + z",
      "(ct)² + x² + y² + z²",
      "x² + y² + z² − (ct)²"
    ],
    correct_choice_index: 0,
    short_explanation: "間隔 s² = (ct)² − x² − y² − z² はローレンツ変換で不変。",
    detailed_explanation: "ミンコフスキー時空では s² = c²t² − r² が不変量であり、すべての慣性系で同じ値をとる。",
    learning_objective: "4元ベクトルの不変量を識別できる",
    common_misconception: "ユークリッド的な距離の2乗和が不変だと考える",
    distractor_rationales: [
      "正解。(ct)² − x² − y² − z² がローレンツ不変量。",
      "不正解。単純和は不変ではない。",
      "不正解。符号がユークリッド距離の形。",
      "不正解。時間成分の符号が不変量の定義と異なる。"
    ],
    basic_terms: "ローレンツ不変量：ローレンツ変換で変わらない量、4元ベクトル：時空を統一的に表すベクトル"
  }),

  // L800 ×3
  q({
    domain: "物理",
    subdomain: "量子力学",
    difficulty_initial: 800,
    cognitive_type: "原理・因果",
    question_text: "ヘイゼンベルグ表象において、演算子 Â の時間発展を記述するヘイゼンベルグ方程式として正しいものはどれか（ħ はディラック定数）。",
    choices: [
      "dÂ/dt = (i/ħ)[Ĥ, Â] + (∂Â/∂t)_Heisenberg",
      "dÂ/dt = −(i/ħ)[Ĥ, Â] + (∂Â/∂t)_Heisenberg",
      "dÂ/dt = [Ĥ, Â]",
      "dÂ/dt = ĤÂ − ÂĤ"
    ],
    correct_choice_index: 0,
    short_explanation: "ヘイゼンベルグ方程式は dÂ/dt = (i/ħ)[Ĥ,Â] + (∂Â/∂t)_H。",
    detailed_explanation: "演算子の時間発展は対易関係とハミルトニアンで決まる。シュレーディンガー表象とは役割が入れ替わる。",
    learning_objective: "ヘイゼンベルグ方程式の形と対易関係の役割を説明できる",
    common_misconception: "対易子の符号を逆にする",
    distractor_rationales: [
      "正解。ヘイゼンベルグ方程式の正しい形。",
      "不正解。対易子の符号が逆。",
      "不正解。ħ の係数と符号が欠ける。",
      "不正解。対易子のみで時間微分の形になっていない。"
    ],
    basic_terms: "ヘイゼンベルグ表象：演算子が時間発展する量子力学の形式、対易子 [Ĥ,Â] = ĤÂ − ÂĤ"
  }),

  q({
    domain: "物理",
    subdomain: "量子場論",
    difficulty_initial: 800,
    cognitive_type: "用語・定義",
    question_text: "フェルミオン場の二次量子化において、同一モードの消滅演算子 â と生成演算子 â† が満たす反交換関係として正しいものはどれか。",
    choices: [
      "{â, â†} = 1",
      "[â, â†] = 1",
      "ââ† = 0",
      "[â, â†] = i"
    ],
    correct_choice_index: 0,
    short_explanation: "フェルミオンでは反交換子 {â, â†} = ââ† + â†â = 1。",
    detailed_explanation: "ボソンは対易関係 [â,â†]=1、フェルミオンは反交換関係 {â,â†}=1 を満たす。これがパウリ原理の場の理論版である。",
    learning_objective: "フェルミオン場の反交換関係をボソンと区別できる",
    common_misconception: "フェルミオンにも対易関係を適用する",
    distractor_rationales: [
      "正解。フェルミオンの反交換関係 {â, â†} = 1。",
      "不正解。対易関係はボソン用。",
      "不正解。積がゼロになるわけではない。",
      "不正解。虚数単位 i は対易関係の係数として不適切。"
    ],
    basic_terms: "二次量子化：場を演算子として量子化する手法、反交換子 {A,B} = AB + BA"
  }),

  q({
    domain: "物理",
    subdomain: "量子力学",
    difficulty_initial: 800,
    cognitive_type: "基本的な適用",
    question_text: "非縮退な基底状態 |ψ₀⟩ に対する摂動ハミルトニアン Ĥ′ の1次エネルギー修正 ΔE⁽¹⁾ として正しいものはどれか。",
    choices: [
      "ΔE⁽¹⁾ = ⟨ψ₀|Ĥ′|ψ₀⟩",
      "ΔE⁽¹⁾ = ⟨ψ₁|Ĥ′|ψ₀⟩",
      "ΔE⁽¹⁾ = ⟨ψ₀|Ĥ|ψ₀⟩",
      "ΔE⁽¹⁾ = ⟨ψ₀|Ĥ′²|ψ₀⟩"
    ],
    correct_choice_index: 0,
    short_explanation: "1次エネルギー修正は ΔE⁽¹⁾ = ⟨ψ₀|Ĥ′|ψ₀⟩。",
    detailed_explanation: "時間独立摂動論では、非縮退基底状態に対し1次のエネルギー修正は摂動ハミルトニアンの期待値で与えられる。",
    learning_objective: "非縮退摂動論の1次エネルギー修正を計算できる",
    common_misconception: "励起状態との行列要素が1次修正だと考える",
    distractor_rationales: [
      "正解。1次エネルギー修正は基底状態での Ĥ′ の期待値。",
      "不正解。非対角行列要素は2次修正に寄与する。",
      "不正解。これは非摂動ハミルトニアンの期待値。",
      "不正解。2乗は2次修正の計算に現れる。"
    ],
    basic_terms: "摂動論：厳密解が求まらない系を既知の解に小さな修正として扱う手法、期待値：⟨ψ|Â|ψ⟩"
  })
];

export const physicsGap = balanceAll(raw);
