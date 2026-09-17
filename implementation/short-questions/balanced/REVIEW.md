# 100問の短問・仮難度と改稿案

2026-09-17。10分野各10問、レベル1〜7を各14〜15問。本人の「文量は維持」「作成全体を難しくせず、正解状況で出題難度を上げる」を反映。実回答で校正した難度ではありません。

仮難度は各レベル内の100・225・375・525・675・825・925。a＝1、c＝0.25を共通の仮定とし、採択済み70％基準からbを逆算。本番の採点基準・7段階の境界は変更しません。旧問題のbや回答実績は移植しません。

|分野|L1|L2|L3|L4|L5|L6|L7|
|---|---:|---:|---:|---:|---:|---:|---:|
|数学|2|1|1|1|2|2|1|
|物理|1|2|1|1|1|2|2|
|化学|2|1|1|2|1|1|2|
|生物|1|2|1|2|2|1|1|
|地学|2|1|1|1|2|2|1|
|工学|1|2|1|1|1|2|2|
|農学|2|1|2|1|1|1|2|
|情報・計算機科学|1|2|2|2|1|1|1|
|医歯薬学|2|1|2|2|1|1|1|
|人文社会科学|1|2|2|1|2|1|1|
|合計|15|15|14|14|14|14|14|

公開前の原稿です。元問題のキー・本文ハッシュを保存し、単純修正と測定内容の変更を区別します。具体的な内容が変わる問題は新しい版・必要に応じて新しい問題群として審査し、既存受験の問題と採点を遡って書き換えません。

## short-math-01｜数学｜レベル3（仮）

f(x)=x²の、x=3での接線の傾きは？

1. 3
2. 6
3. 9
4. 12

正解：6

導関数はf′(x)=2x。x=3を代入すると、接線の傾きは6です。

- 3：xの値であり、傾きではありません。
- 6：導関数2xに3を代入した値です。
- 9：関数の値f(3)=9と、接線の傾きを区別します。
- 12：2xに3を代入しても12にはなりません。

仮難度70：375、b：-1.0305。

出典：[OpenStax — Calculus Volume 1 §3.2 The Derivative as a Function](https://openstax.org/books/calculus-volume-1/pages/3-2-the-derivative-as-a-function)

置換元：math-analysis-logic-reviewed.json / 10000000-0000-4000-8007-000000000328。原稿関係：pilot-rewrite。

## short-math-02｜数学｜レベル4（仮）

一次独立な3次元ベクトルa,bの外積a×bは？

1. aと平行
2. bと平行
3. ゼロベクトル
4. 両方に垂直

正解：両方に垂直

外積はaにもbにも垂直です。一次独立なので、ゼロベクトルにはなりません。

- aと平行：aと直交する非零ベクトルなので、aとは平行になりません。
- bと平行：bと直交する非零ベクトルなので、bとは平行になりません。
- ゼロベクトル：大きさは|a||b|sinθで、一次独立なときは0ではありません。
- 両方に垂直：外積の直交性に対応します。

仮難度70：525、b：-0.2805。

出典：[OpenStax — Calculus Volume 3 §2.4 The Cross Product](https://openstax.org/books/calculus-volume-3/pages/2-4-the-cross-product)

置換元：math-scope-completion-reviewed.json / 10000000-0000-4000-8005-000000000104。原稿関係：pilot-rewrite。

## short-math-03｜数学｜レベル1（仮）

2＋3×4を計算すると？

1. 24
2. 9
3. 14
4. 20

正解：14

掛け算を先に計算します。3×4＝12なので、2＋12＝14です。

- 24：2×3×4の値です。
- 9：掛け算を足し算に置き換えた値です。
- 14：掛け算を先に行った値です。
- 20：足し算を先にすると、この値になります。

仮難度70：100、b：-2.4055。

出典：[OpenStax — College Algebra 2e §1.1 Real Numbers: Algebra Essentials](https://openstax.org/books/college-algebra-2e/pages/1-1-real-numbers-algebra-essentials)

置換元：math-scope-completion-reviewed.json / 10000000-0000-4000-8006-000000000121。原稿関係：revised-concept。

## short-math-04｜数学｜レベル1（仮）

一辺5 cmの正方形の面積は？

1. 125 cm²
2. 25 cm²
3. 10 cm²
4. 20 cm²

正解：25 cm²

正方形の面積は一辺×一辺。5×5＝25 cm²です。

- 125 cm²：一辺5 cmの立方体の体積の数値です。
- 25 cm²：5×5で求めます。
- 10 cm²：一辺を2倍しても面積にはなりません。
- 20 cm²：周の長さの数値と混同しています。

仮難度70：100、b：-2.4055。

出典：[OpenStax — Contemporary Mathematics §10.6 Area](https://openstax.org/books/contemporary-mathematics/pages/10-6-area)

置換元：math-calculation-reviewed.json / 10000000-0000-4000-8007-000000000304。原稿関係：revised-concept。

## short-math-05｜数学｜レベル2（仮）

log₂8の値は？

1. 3
2. 2
3. 4
4. 16

正解：3

2を何乗すると8になるかを考えます。2³＝8なので3です。

- 3：2³＝8です。
- 2：2²は4です。
- 4：2⁴は16です。
- 16：底と真数を掛ける計算ではありません。

仮難度70：225、b：-1.7805。

出典：[OpenStax — College Algebra 2e §6.3 Logarithmic Functions](https://openstax.org/books/college-algebra-2e/pages/6-3-logarithmic-functions)

置換元：math-calculation-reviewed.json / 10000000-0000-4000-8006-000000000128。原稿関係：new-concept。

## short-math-06｜数学｜レベル5（仮）

正方行列Aが逆行列を持つ必要十分条件は？

1. det(A)＝0
2. tr(A)＝0
3. A＝Aᵀ
4. det(A)≠0

正解：det(A)≠0

正方行列は、行列式が0でないとき、かつそのときに限って逆行列を持ちます。

- det(A)＝0：行列式が0なら逆行列を持ちません。
- tr(A)＝0：トレースだけでは可逆性を判定できません。
- A＝Aᵀ：対称行列にも可逆なものと不可逆なものがあります。
- det(A)≠0：正則行列の同値な条件です。

仮難度70：675、b：0.4695。

出典：[Wolfram MathWorld — Matrix Inverse](https://mathworld.wolfram.com/MatrixInverse.html)

置換元：math-properties-reviewed.json / 10000000-0000-4000-8007-000000000327。原稿関係：revised-concept。

## short-math-07｜数学｜レベル5（仮）

分散σ²の独立同分布なn標本。標本平均の分散は？

1. σ²/√n
2. σ²
3. σ²/n
4. nσ²

正解：σ²/n

独立な和の分散はnσ²。平均では和をnで割るため、分散はn²で割られ、σ²/nになります。

- σ²/√n：標準偏差が1/√nになることと混同しています。
- σ²：n＝1以外では平均の分散を表しません。
- σ²/n：和の分散をn²で割った値です。
- nσ²：標本の和の分散です。

仮難度70：675、b：0.4695。

出典：[OpenStax — Introductory Statistics 2e §7.1 The Central Limit Theorem for Sample Means (Averages)](https://openstax.org/books/introductory-statistics-2e/pages/7-1-the-central-limit-theorem-for-sample-means-averages)

置換元：math-scope-completion-reviewed.json / 10000000-0000-4000-8007-000000000326。原稿関係：revised-concept。

## short-math-08｜数学｜レベル6（仮）

正則なf＝u＋ivが満たすコーシー・リーマン式は？

1. uₓ＝uᵧ、vₓ＝vᵧ
2. uₓ＝vᵧ、uᵧ＝−vₓ
3. uₓ＝vᵧ、uᵧ＝vₓ
4. uₓ＝−vᵧ、uᵧ＝vₓ

正解：uₓ＝vᵧ、uᵧ＝−vₓ

複素微分の値が近づく方向によらないことから、uₓ＝vᵧ、uᵧ＝−vₓが得られます。添字は偏微分です。

- uₓ＝uᵧ、vₓ＝vᵧ：正則性を特徴づける関係ではありません。
- uₓ＝vᵧ、uᵧ＝−vₓ：実軸方向と虚軸方向の微分を一致させた関係です。
- uₓ＝vᵧ、uᵧ＝vₓ：2番目の式の符号が違います。
- uₓ＝−vᵧ、uᵧ＝vₓ：反正則な場合に対応する符号です。

仮難度70：825、b：1.2195。

出典：[MIT OpenCourseWare — 18.305 Lecture 2, equations (2.7)–(2.9)](https://ocw.mit.edu/courses/18-305-advanced-analytic-methods-in-science-and-engineering-fall-2004/09cfb5e3efabe59c46bfebfcfaecf743_second1.pdf)

置換元：math-methods-reviewed.json / 10000000-0000-4000-8004-000000000019。原稿関係：revised-concept。

## short-math-09｜数学｜レベル6（仮）

ノルム空間がバナッハ空間となる必要十分条件は？

1. 完備である
2. 有限次元である
3. コンパクトである
4. 有界である

正解：完備である

ノルムから定まる距離について、すべてのコーシー列がその空間内で収束する、という完備性が条件です。

- 完備である：バナッハ空間の定義です。
- 有限次元である：十分条件ですが、無限次元のバナッハ空間もあります。
- コンパクトである：空間全体のコンパクト性は定義ではありません。
- 有界である：空間全体の有界性は完備性とは異なります。

仮難度70：825、b：1.2195。

出典：[Wolfram MathWorld — Banach Space](https://mathworld.wolfram.com/BanachSpace.html)

置換元：math-definitions-reviewed.json / 10000000-0000-4000-8004-000000000003。原稿関係：revised-concept。

## short-math-10｜数学｜レベル7（仮）

次のうち、一意因子分解整域でないのは？

1. ℤ
2. ℚ[x]
3. ℤ[i]
4. ℤ[√−5]

正解：ℤ[√−5]

ℤ[√−5]では、6＝2×3＝(1＋√−5)(1−√−5)が、同伴を除いて異なる既約元への分解になります。

- ℤ：整数環では素因数分解が一意です。
- ℚ[x]：体上の一変数多項式環はユークリッド整域です。
- ℤ[i]：ガウス整数環はユークリッド整域です。
- ℤ[√−5]：一意分解が成り立たない標準例です。

仮難度70：925、b：1.7195。

出典：[Wolfram MathWorld — Unique Factorization Domain](https://mathworld.wolfram.com/UniqueFactorizationDomain.html)、[Keith Conrad — Factoring in Quadratic Fields](https://kconrad.math.uconn.edu/blurbs/ugradnumthy/quadraticundergrad.pdf)

置換元：math-scope-completion-reviewed.json / 10000000-0000-4000-8007-000000000350。原稿関係：revised-concept。

## short-physics-01｜物理｜レベル2（仮）

近づく救急車のサイレンが高く聞こえる現象は？

1. ドップラー効果
2. 干渉
3. 共鳴
4. 回折

正解：ドップラー効果

音源が近づくと、観測者に届く波の間隔が詰まり、周波数が高くなります。

- ドップラー効果：音源と観測者の相対運動による周波数の変化です。
- 干渉：波が重なり、強め合ったり弱め合ったりする現象です。
- 共鳴：固有振動数に近い振動で振幅が増す現象です。
- 回折：波が障害物の後ろなどへ回り込む現象です。

仮難度70：225、b：-1.7805。

出典：[OpenStax — University Physics Volume 1, §17.7 The Doppler Effect](https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect)

置換元：physics-classical-reviewed.json / 10000000-0000-4000-8006-000000000151。原稿関係：pilot-rewrite。

## short-physics-02｜物理｜レベル1（仮）

2Ωと4Ωを直列接続。合成抵抗は？

1. 6Ω
2. 4/3Ω
3. 2Ω
4. 4Ω

正解：6Ω

直列接続の合成抵抗は足し算で、2+4=6Ωです。並列接続とは計算が異なります。

- 6Ω：直列接続では各抵抗を足します。
- 4/3Ω：2Ωと4Ωを並列接続した場合の値です。
- 2Ω：小さい方の抵抗を選ぶ計算ではありません。
- 4Ω：大きい方の抵抗を選ぶ計算ではありません。

仮難度70：100、b：-2.4055。

出典：[OpenStax — University Physics Volume 2, §10.2 Resistors in Series and Parallel](https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel)

置換元：physics-classical-reviewed.json / 10000000-0000-4000-8007-000000000366。原稿関係：pilot-rewrite。

## short-physics-03｜物理｜レベル2（仮）

等速円運動で半径を保ち速さを2倍にすると、向心加速度は？

1. 4倍
2. 2倍
3. 1/2倍
4. 変わらない

正解：4倍

向心加速度はv²/r。半径が同じなら、速さを2倍にすると4倍です。

- 4倍：速さの2乗に比例します。
- 2倍：速さに比例する量との混同です。
- 1/2倍：速さに反比例はしません。
- 変わらない：速さが変われば向心加速度も変わります。

仮難度70：225、b：-1.7805。

出典：[OpenStax — University Physics Volume 1, §6.3 Centripetal Force](https://openstax.org/books/university-physics-volume-1/pages/6-3-centripetal-force)

置換元：physics-classical-reviewed.json / 10000000-0000-4000-8006-000000000144。原稿関係：revised-concept。

## short-physics-04｜物理｜レベル3（仮）

同じ金属の1光子光電効果。最大運動エネルギーを増やすのは？

1. 同じ光を強くする
2. 照射時間を延ばす
3. 照射面積を広げる
4. 光の周波数を上げる

正解：光の周波数を上げる

同じ金属の1光子による光電効果ではK_max＝hf−φ。しきい値を超えた光の周波数を上げると、最大運動エネルギーが増えます。

- 同じ光を強くする：通常は放出される電子数に影響します。
- 照射時間を延ばす：照射時間を延ばすことは1光子のエネルギーを変えません。
- 照射面積を広げる：面積を変えても光の周波数は変わりません。
- 光の周波数を上げる：1光子のエネルギーhfが増えます。

仮難度70：375、b：-1.0305。

出典：[OpenStax — University Physics Volume 3, §6.2 Photoelectric Effect](https://openstax.org/books/university-physics-volume-3/pages/6-2-photoelectric-effect)

置換元：physics-modern-reviewed.json / 10000000-0000-4000-8007-000000000367。原稿関係：revised-concept。

## short-physics-05｜物理｜レベル4（仮）

断熱・剛体容器内で理想気体が真空へ自由膨張。温度は？

1. 下がる
2. 絶対零度になる
3. 変わらない
4. 上がる

正解：変わらない

熱の出入りも外部への仕事も0なので内部エネルギーは一定です。理想気体の内部エネルギーは温度で決まるため、膨張前後の平衡温度は同じです。

- 下がる：可逆な断熱膨張による冷却と区別します。
- 絶対零度になる：絶対零度へ冷える過程ではありません。
- 変わらない：理想気体の自由膨張では温度は不変です。
- 上がる：熱や仕事による内部エネルギーの増加はありません。

仮難度70：525、b：-0.2805。

出典：[OpenStax — University Physics Volume 2, §3.6 Adiabatic Processes for an Ideal Gas](https://openstax.org/books/university-physics-volume-2/pages/3-6-adiabatic-processes-for-an-ideal-gas)

置換元：physics-classical-reviewed.json / 10000000-0000-4000-8007-000000000373。原稿関係：revised-concept。

## short-physics-06｜物理｜レベル5（仮）

位置r、運動量pの質点の軌道角運動量は？

1. r＋p
2. r×p
3. r・p
4. p×r

正解：r×p

同じ基準点からの位置ベクトルrを使い、角運動量は外積r×pです。

- r＋p：位置と運動量は単位が異なり、その和では定義しません。
- r×p：角運動量の定義です。
- r・p：内積はスカラーで、角運動量ベクトルではありません。
- p×r：外積の順序を逆にすると符号が反転します。

仮難度70：675、b：0.4695。

出典：[OpenStax — University Physics Volume 1, §11.2 Angular Momentum](https://openstax.org/books/university-physics-volume-1/pages/11-2-angular-momentum)

置換元：physics-classical-reviewed.json / 10000000-0000-4000-8007-000000000372。原稿関係：revised-concept。

## short-physics-07｜物理｜レベル6（仮）

非縮退の定常摂動論。摂動Vによるエネルギーの一次補正は？

1. ⟨n|V|n⟩
2. ⟨n|V²|n⟩
3. ⟨n|H₀|n⟩
4. ⟨n|V|n⟩²

正解：⟨n|V|n⟩

無摂動の規格化固有状態|n⟩で、摂動Vの期待値を取ります。通常の非縮退摂動論を適用できる場合の式です。

- ⟨n|V|n⟩：一次補正は摂動の期待値です。
- ⟨n|V²|n⟩：V²の期待値は一次補正ではありません。
- ⟨n|H₀|n⟩：無摂動のエネルギーです。
- ⟨n|V|n⟩²：期待値の2乗では単位もエネルギーと異なります。

仮難度70：825、b：1.2195。

出典：[MIT OpenCourseWare — 8.06 Quantum Physics III, Chapter 1: Non-degenerate and Degenerate Perturbation Theory](https://ocw.mit.edu/courses/8-06-quantum-physics-iii-spring-2018/a0889c5ca8a479c3e56c544d646fb770_MIT8_06S18ch1.pdf)

置換元：physics-modern-reviewed.json / 10000000-0000-4000-8005-000000000128。原稿関係：revised-concept。

## short-physics-08｜物理｜レベル6（仮）

フェルミ液体の、フェルミ面近くの低エネルギー励起は？

1. マグノン
2. フォノン
3. ヒッグス粒子
4. フェルミ準粒子

正解：フェルミ準粒子

ランダウのフェルミ液体理論では、相互作用の効果を含む、長寿命のフェルミ準粒子として低エネルギー励起を扱います。

- マグノン：磁性体のスピン波の量子です。
- フォノン：格子振動などの量子です。
- ヒッグス粒子：この理論の電子励起を表すものではありません。
- フェルミ準粒子：フェルミ面付近の基本的な励起です。

仮難度70：825、b：1.2195。

出典：[Steven H. Simon — Lecture Notes for Quantum Matter](https://www-thphys.physics.ox.ac.uk/people/SteveSimon/QCM2023/QuantumMatter.pdf)

置換元：physics-fields-reviewed.json / 10000000-0000-4000-8004-000000000040。原稿関係：revised-concept。

## short-physics-09｜物理｜レベル7（仮）

純粋な二体系のエンタングルメントを測る、部分系の量は？

1. 粒子数
2. 化学ポテンシャル
3. フォン・ノイマンエントロピー
4. 内部エネルギー

正解：フォン・ノイマンエントロピー

全体が純粋状態なら、部分系の縮約密度行列ρのエントロピー−Tr(ρ lnρ)がエンタングルメント・エントロピーになります。

- 粒子数：粒子数だけでは量子もつれを定量化できません。
- 化学ポテンシャル：粒子の付加に伴う熱力学量であり、ここでの尺度ではありません。
- フォン・ノイマンエントロピー：全体が純粋状態という条件で用います。
- 内部エネルギー：部分系のエネルギーだけでは測れません。

仮難度70：925、b：1.7195。

出典：[Kitaev and Preskill — Topological Entanglement Entropy](https://preskill.caltech.edu/pubs/preskill-2006-topological.pdf)

置換元：physics-fields-reviewed.json / 10000000-0000-4000-8005-000000000134。原稿関係：revised-concept。

## short-physics-10｜物理｜レベル7（仮）

非相互作用の2次元Z₂トポロジカル絶縁体。時間反転対の境界状態は？

1. バルクと同じギャップ
2. ヘリカル
3. 一方向のカイラル
4. 局在した孤立準位

正解：ヘリカル

非相互作用の量子スピンホール系では、反対方向へ進む時間反転対のヘリカルな境界状態が現れます。

- バルクと同じギャップ：境界にはギャップレスな状態が現れます。
- ヘリカル：時間反転対となる逆向きの状態です。
- 一方向のカイラル：通常の整数電気的量子ホール境界との区別です。
- 局在した孤立準位：保護された伝導境界の特徴を表しません。

仮難度70：925、b：1.7195。

出典：[Dai et al. — Helical edge and surface states in HgTe quantum wells and bulk insulators](https://arxiv.org/abs/0705.1516)

置換元：physics-fields-reviewed.json / 10000000-0000-4000-8007-000000000399。原稿関係：revised-concept。

## short-chemistry-01｜化学｜レベル3（仮）

少量の酸・塩基によるpH変化を抑える溶液の呼び名は？

1. 緩衝液
2. 飽和溶液
3. 過飽和溶液
4. 懸濁液

正解：緩衝液

緩衝液は、少量の酸や塩基によるpH変化を小さくします。抑えられる量には限りがあります。

- 緩衝液：pH変化を抑える性質を表す名称です。
- 飽和溶液：溶解度に達した状態を表す名称です。
- 過飽和溶液：平衡での溶解度を超えて溶けた状態を表します。
- 懸濁液：粒子が液体中に分散した状態を表し、緩衝作用を意味しません。

仮難度70：375、b：-1.0305。

出典：[OpenStax — Chemistry 2e, Buffers](https://openstax.org/books/chemistry-2e/pages/14-6-buffers)

置換元：chemistry-equilibria-reviewed.json / 10000000-0000-4000-8007-000000000074。原稿関係：pilot-rewrite。

## short-chemistry-02｜化学｜レベル4（仮）

典型的なS_N2反応後、反応炭素の立体配置は？

1. 反転する
2. 平面になる
3. ラセミ化する
4. 保持される

正解：反転する

求核剤が脱離基の反対側から近づき、配置が反転します。R/S記号が逆になるという意味とは区別します。

- 反転する：背面攻撃による幾何学的な配置の反転です。
- 平面になる：遷移状態と生成物の構造を区別します。
- ラセミ化する：典型的なS_N2は両側から同程度に反応する機構ではありません。
- 保持される：典型的なS_N2反応は配置の反転を伴います。

仮難度70：525、b：-0.2805。

出典：[John McMurry / OpenStax — Organic Chemistry, The SN2 Reaction](https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction)

置換元：chemistry-organic-reviewed.json / 10000000-0000-4000-8006-000000000025。原稿関係：pilot-rewrite。

## short-chemistry-03｜化学｜レベル1（仮）

水分子の化学式は？

1. CO₂
2. O₂
3. H₂O
4. H₂O₂

正解：H₂O

水分子は水素原子2個と酸素原子1個からなります。

- CO₂：二酸化炭素の化学式です。
- O₂：酸素分子の化学式です。
- H₂O：水の化学式です。
- H₂O₂：過酸化水素の化学式です。

仮難度70：100、b：-2.4055。

出典：[NIST Chemistry WebBook — Water](https://webbook.nist.gov/cgi/cbook.cgi?ID=C7732185&Mask=1EBF)

置換元：chemistry-foundations-reviewed.json / 10000000-0000-4000-8007-000000000051。原稿関係：revised-concept。

## short-chemistry-04｜化学｜レベル1（仮）

原子番号が表すのは、原子核に含まれる何の数？

1. 電子
2. 陽子
3. 中性子
4. 陽子と中性子の合計

正解：陽子

原子番号Zは陽子数です。陽子と中性子の合計は質量数Aです。電子は原子核の構成粒子ではありません。

- 電子：中性原子では陽子数と等しいですが、原子核内にはありません。
- 陽子：原子番号を決めます。
- 中性子：同位体間で変わる数です。
- 陽子と中性子の合計：質量数を表します。

仮難度70：100、b：-2.4055。

出典：[OpenStax — Chemistry 2e, Atomic Structure and Symbolism](https://openstax.org/books/chemistry-2e/pages/2-3-atomic-structure-and-symbolism)

置換元：chemistry-foundations-reviewed.json / 10000000-0000-4000-8007-000000000058。原稿関係：new-concept。

## short-chemistry-05｜化学｜レベル2（仮）

NaCl結晶のNa⁺とCl⁻を結び付ける主な結合は？

1. イオン結合
2. 金属結合
3. 水素結合
4. 共有結合

正解：イオン結合

反対の電荷を持つイオン間の静電引力を中心に説明する、イオン結合です。

- イオン結合：陽イオンと陰イオンの静電引力によります。
- 金属結合：金属で自由電子が関与する結合です。
- 水素結合：水素原子を介する相互作用です。
- 共有結合：電子対を共有する結合を指します。

仮難度70：225、b：-1.7805。

出典：[OpenStax — Chemistry 2e, Ionic and Molecular Compounds](https://openstax.org/books/chemistry-2e/pages/2-6-ionic-and-molecular-compounds)

置換元：chemistry-foundations-reviewed.json / 10000000-0000-4000-8002-000000000026。原稿関係：revised-concept。

## short-chemistry-06｜化学｜レベル4（仮）

ルイス酸が、結合の形成時に受け取るものは？

1. プロトン
2. 中性子
3. 水素原子
4. 電子対

正解：電子対

ルイス酸は電子対受容体です。電子対を供与するルイス塩基と付加体を形成します。

- プロトン：プロトン受容体はブレンステッド塩基の定義です。
- 中性子：核反応の粒子であり、酸塩基の定義ではありません。
- 水素原子：水素原子の受容を条件とはしません。
- 電子対：ルイス酸の定義です。

仮難度70：525、b：-0.2805。

出典：[OpenStax — Chemistry 2e, Lewis Acids and Bases](https://openstax.org/books/chemistry-2e/pages/15-2-lewis-acids-and-bases)

置換元：chemistry-equilibria-reviewed.json / 10000000-0000-4000-8005-000000000026。原稿関係：revised-concept。

## short-chemistry-07｜化学｜レベル5（仮）

Beer–Lambert則の範囲で濃度2倍・光路長半分。吸光度は？

1. 4倍
2. 半分
3. 変わらない
4. 2倍

正解：変わらない

同じ吸光種・波長ならA＝εcl。濃度の2倍と光路長の1/2が打ち消し合います。

- 4倍：両方を2倍した場合との混同です。
- 半分：濃度の変更を見落としています。
- 変わらない：cとlの積が同じです。
- 2倍：光路長の変更を見落としています。

仮難度70：675、b：0.4695。

出典：[IUPAC Gold Book — Beer–Lambert law (B00626)](https://goldbook.iupac.org/terms/view/B00626)

置換元：chemistry-analysis-reviewed.json / 10000000-0000-4000-8010-000000000016。原稿関係：revised-concept。

## short-chemistry-08｜化学｜レベル6（仮）

Pt(II)錯体の速度論的トランス効果で、注目する量は？

1. 中心金属の酸化数
2. 反対側の配位子の置換速度
3. 金属と配位子の結合長
4. 錯体の溶解度

正解：反対側の配位子の置換速度

正方形平面型錯体で、ある配位子がそのトランス位の配位子の置換を速める速度論的効果です。結合長等に関するトランス影響と区別します。

- 中心金属の酸化数：中心金属の酸化数の変化を意味しません。
- 反対側の配位子の置換速度：トランス位の配位子の置換促進を指します。
- 金属と配位子の結合長：結合長等へのトランス影響と区別します。
- 錯体の溶解度：溶解度を直接表す用語ではありません。

仮難度70：825、b：1.2195。

出典：[Douglas College — Chem 2330, The Trans Effect](https://chem.libretexts.org/Courses/Douglas_College/DC%3A_Chem_2330_%28O%27Connor%29/5%3A_Reactions_of_the_Transition_Metals/5.4%3A_The_Trans_Effect)

置換元：chemistry-materials-reviewed.json / 10000000-0000-4000-8007-000000000077。原稿関係：revised-concept。

## short-chemistry-09｜化学｜レベル7（仮）

λ等が一定のMarcus逆領域で、駆動力を増すと速度定数は？

1. 低下する
2. 増加する
3. 変わらない
4. 0へ不連続に飛ぶ

正解：低下する

古典的単純モデルの逆領域では、−ΔG°をさらに増すと(λ＋ΔG°)²/(4λ)で表す障壁が上がります。温度と前因子も一定なら速度定数は下がります。

- 低下する：逆領域での特徴的な挙動です。
- 増加する：通常領域の傾向との混同です。
- 変わらない：このモデルでは障壁が変わります。
- 0へ不連続に飛ぶ：モデルは不連続な0への変化を予測しません。

仮難度70：925、b：1.7195。

出典：[Rudolph A. Marcus — Electron Transfer Reactions in Chemistry: Theory and Experiment, Nobel Lecture 1992](https://www.nobelprize.org/uploads/2018/06/marcus-lecture.pdf)

置換元：chemistry-kinetics-reviewed.json / 10000000-0000-4000-8007-000000000100。原稿関係：revised-concept。

## short-chemistry-10｜化学｜レベル7（仮）

定温・定圧のGibbs–Duhem式で、Σnᵢdμᵢは？

1. RT
2. dG
3. dH
4. 0

正解：0

単純圧縮系のGibbs–Duhem式はΣnᵢdμᵢ＝−S dT＋V dp。温度と圧力が一定なら右辺は0です。

- RT：RTという定数にはなりません。
- dG：組成変化の際のdGとは区別します。
- dH：エンタルピー変化を表す式ではありません。
- 0：dT＝dp＝0から得られます。

仮難度70：925、b：1.7195。

出典：[Paul Ellgen — Thermodynamics and Chemical Equilibrium, Gibbs-Duhem Equation](https://chem.libretexts.org/Bookshelves/Physical_and_Theoretical_Chemistry_Textbook_Maps/Thermodynamics_and_Chemical_Equilibrium_(Ellgen)/14:_Chemical_Potential_-_Extending_the_Scope_of_the_Fundamental_Equation/14.08:_Gibbs-Duhem_Equation)

置換元：chemistry-equilibria-reviewed.json / 10000000-0000-4000-8007-000000000087。原稿関係：revised-concept。

## short-biology-01｜生物｜レベル3（仮）

エネルギーを使い、イオンを電気化学勾配に逆らって運ぶのは？

1. 浸透
2. 能動輸送
3. 促進拡散
4. 単純拡散

正解：能動輸送

能動輸送は、別のエネルギー源と共役して、対象のイオンを電気化学勾配に逆らって運びます。

- 浸透：水の移動を扱う用語です。
- 能動輸送：ATPなどのエネルギーや、別の物質の勾配を利用できます。
- 促進拡散：輸送タンパク質を介しますが、対象物質の勾配に従う受動輸送です。
- 単純拡散：対象物質の勾配に従う受動輸送です。

仮難度70：375、b：-1.0305。

出典：[OpenStax — Biology 2e, Active Transport](https://openstax.org/books/biology-2e/pages/5-3-active-transport)

置換元：biology-foundations-reviewed.json / 10000000-0000-4000-8007-000000000422。原稿関係：pilot-rewrite。

## short-biology-02｜生物｜レベル2（仮）

DNAの塩基配列を写してRNAを作る過程は？

1. 逆転写
2. 翻訳
3. 複製
4. 転写

正解：転写

DNAを鋳型にRNAを作る過程が転写です。RNAをもとにタンパク質を作る過程は翻訳です。

- 逆転写：RNAを鋳型にDNAを作る過程です。
- 翻訳：mRNAの情報をもとにタンパク質を合成する過程です。
- 複製：DNAをもとにDNAを作る過程です。
- 転写：DNAの配列をもとにRNAを合成します。

仮難度70：225、b：-1.7805。

出典：[NHGRI — Transcription](https://www.genome.gov/genetics-glossary/Transcription)

置換元：biology-molecular-reviewed.json / 10000000-0000-4000-8007-000000000426。原稿関係：pilot-rewrite。

## short-biology-03｜生物｜レベル1（仮）

次のうち、哺乳類は？

1. コウモリ
2. ペンギン
3. ワニ
4. カエル

正解：コウモリ

コウモリは、子を母乳で育てる哺乳類です。飛ぶこと自体は鳥類の条件ではありません。

- コウモリ：哺乳類に分類されます。
- ペンギン：鳥類です。
- ワニ：爬虫類です。
- カエル：両生類です。

仮難度70：100、b：-2.4055。

出典：[U.S. National Park Service — All About Bats](https://www.nps.gov/subjects/bats/all-about-bats.htm)、[OpenStax — Biology 2e, Determining Evolutionary Relationships](https://openstax.org/books/biology-2e/pages/20-2-determining-evolutionary-relationships)

置換元：biology-ecology-evolution-reviewed.json / 10000000-0000-4000-8003-000000000031。原稿関係：revised-concept。

## short-biology-04｜生物｜レベル2（仮）

細胞膜のリン脂質の親水性頭部は、どちらに向く？

1. 二重層の中央
2. 隣の脂肪酸側
3. 膜面に平行な方向
4. 膜の内外の水側

正解：膜の内外の水側

親水性頭部は細胞の内外の水相へ向き、疎水性の脂肪酸鎖は二重層の内側へ向きます。

- 二重層の中央：疎水性の尾部が集まる側です。
- 隣の脂肪酸側：主に尾部が向き合う配置です。
- 膜面に平行な方向：二重層の基本配置を表しません。
- 膜の内外の水側：水になじみやすい頭部の向きです。

仮難度70：225、b：-1.7805。

出典：[OpenStax — Biology 2e, Components and Structure](https://openstax.org/books/biology-2e/pages/5-1-components-and-structure)

置換元：biology-foundations-reviewed.json / 10000000-0000-4000-8004-000000000087。原稿関係：revised-concept。

## short-biology-05｜生物｜レベル4（仮）

変性・還元したSDS-PAGEで、主に分離する基準は？

1. 酵素活性
2. 天然状態の形
3. 分子量
4. 等電点

正解：分子量

十分なSDSによる変性と還元の条件では、ポリペプチドの分子量による分離が主になります。

- 酵素活性：通常の変性SDS-PAGEで活性を測っているわけではありません。
- 天然状態の形：変性によって天然の立体構造は崩れます。
- 分子量：小さいポリペプチドほど移動しやすくなります。
- 等電点：等電点電気泳動との混同です。

仮難度70：525、b：-0.2805。

出典：[Bio-Rad — Criterion Precast Gels Instruction Manual, §3.1](https://www.bio-rad.com/webroot/web/pdf/lsr/literature/Bulletin_4110001E.pdf)

置換元：biology-molecular-reviewed.json / 10000000-0000-4000-8005-000000000149。原稿関係：revised-concept。

## short-biology-06｜生物｜レベル4（仮）

真核細胞の細胞質で、開始コドンAUGが指定するアミノ酸は？

1. フェニルアラニン
2. メチオニン
3. トリプトファン
4. グリシン

正解：メチオニン

通常の翻訳開始では、開始tRNAがメチオニンを運びます。細菌のホルミルメチオニンとは区別します。

- フェニルアラニン：標準遺伝暗号ではUUU・UUCに対応します。
- メチオニン：AUGに対応します。
- トリプトファン：標準遺伝暗号ではUGGに対応します。
- グリシン：標準遺伝暗号ではGGから始まるコドンに対応します。

仮難度70：525、b：-0.2805。

出典：[OpenStax — Microbiology, §11.4 Protein Synthesis](https://openstax.org/books/microbiology/pages/11-4-protein-synthesis-translation)、[NCBI — The Genetic Codes, Standard Code (table 1)](https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi)

置換元：biology-molecular-reviewed.json / 10000000-0000-4000-8006-000000000168。原稿関係：revised-concept。

## short-biology-07｜生物｜レベル5（仮）

有限集団で、偶然に対立遺伝子頻度が変わる過程は？

1. 遺伝的浮動
2. 自然選択
3. 遺伝子流動
4. 突然変異

正解：遺伝的浮動

有限集団で、次世代へ伝わる対立遺伝子の偶然の偏りによって頻度が変わるのが遺伝的浮動です。

- 遺伝的浮動：偶然の標本抽出による頻度変化です。
- 自然選択：遺伝的な違いに伴う繁殖成功の差が関わります。
- 遺伝子流動：集団間の移動に伴う遺伝子のやり取りです。
- 突然変異：DNA配列の変化であり、ここで問う過程とは異なります。

仮難度70：675、b：0.4695。

出典：[Andrews (2010) — Natural Selection, Genetic Drift, and Gene Flow Do Not Act in Isolation in Natural Populations](https://www.nature.com/scitable/knowledge/library/natural-selection-genetic-drift-and-gene-flow-15186648/)、[Scitable — Genetic Drift and Effective Population Size](https://www.nature.com/scitable/topicpage/genetic-drift-and-effective-population-size-772523/)

置換元：biology-ecology-evolution-reviewed.json / 10000000-0000-4000-8007-000000000415。原稿関係：revised-concept。

## short-biology-08｜生物｜レベル5（仮）

野生型大腸菌のlacオペロンが強く発現する糖の条件は？

1. 乳糖あり・ブドウ糖多
2. 乳糖なし・ブドウ糖少
3. 乳糖なし・ブドウ糖多
4. 乳糖あり・ブドウ糖少

正解：乳糖あり・ブドウ糖少

野生型では乳糖に由来する誘導物質で抑制が解除され、グルコースが乏しいとcAMP–CRPの活性化も働きます。

- 乳糖あり・ブドウ糖多：グルコースによるカタボライト抑制が関わります。
- 乳糖なし・ブドウ糖少：誘導物質がなく、リプレッサーによる抑制が残ります。
- 乳糖なし・ブドウ糖多：誘導されず、グルコースも豊富な条件です。
- 乳糖あり・ブドウ糖少：誘導と正の調節がそろう条件です。

仮難度70：675、b：0.4695。

出典：[OpenStax — Microbiology, §11.7 Gene Regulation: Operon Theory](https://openstax.org/books/microbiology/pages/11-7-gene-regulation-operon-theory)

置換元：biology-cell-metabolism-reviewed.json / 10000000-0000-4000-8007-000000000446。原稿関係：revised-concept。

## short-biology-09｜生物｜レベル6（仮）

Tn5を使い、開いたクロマチン領域を調べる手法は？

1. ChIP-seq
2. Hi-C
3. ATAC-seq
4. RNA-seq

正解：ATAC-seq

ATAC-seqは、アクセスしやすいクロマチンへのTn5によるアダプター挿入を利用します。

- ChIP-seq：特定タンパク質等に結合したDNAを免疫沈降して調べます。
- Hi-C：主にクロマチン領域間の接触を調べます。
- ATAC-seq：クロマチンのアクセシビリティを調べます。
- RNA-seq：主に転写産物を調べます。

仮難度70：825、b：1.2195。

出典：[Buenrostro et al. (2013) — Transposition of native chromatin for fast and sensitive epigenomic profiling of open chromatin, DNA-binding proteins and nucleosome position](https://pubmed.ncbi.nlm.nih.gov/24097267/)、[Buenrostro et al. — author manuscript](https://pmc.ncbi.nlm.nih.gov/articles/3959825/)

置換元：biology-molecular-reviewed.json / 10000000-0000-4000-8005-000000000158。原稿関係：revised-concept。

## short-biology-10｜生物｜レベル7（仮）

Harmony原法で、バッチ補正する主な対象は？

1. 細胞型ラベル
2. 低次元空間の細胞座標
3. 生の遺伝子発現カウント
4. UMAPの表示用座標

正解：低次元空間の細胞座標

2019年のHarmonyは、主成分などの低次元表現の細胞座標を補正して統合します。生の遺伝子発現カウントを直接置換する方式とは区別します。

- 細胞型ラベル：主な出力は補正された低次元表現で、細胞型のラベルではありません。
- 低次元空間の細胞座標：主成分等の低次元表現を反復的に補正します。
- 生の遺伝子発現カウント：元のカウントを直接補正して置換する方式ではありません。
- UMAPの表示用座標：表示用UMAP座標の修正が主要な処理ではありません。

仮難度70：925、b：1.7195。

出典：[Korsunsky et al. (2019) — Fast, sensitive and accurate integration of single-cell data with Harmony](https://pubmed.ncbi.nlm.nih.gov/31740819/)

置換元：biology-molecular-reviewed.json / 10000000-0000-4000-8005-000000000157。原稿関係：revised-concept。

## short-earth-01｜地学｜レベル1（仮）

晴れた昼、海から陸へ吹く局地風は？

1. 陸風
2. 海風
3. 山風
4. 谷風

正解：海風

昼に陸が暖まると、海から陸へ空気が流れ込みます。これが海風です。

- 陸風：海陸風の循環で、陸から海へ吹く風です。
- 海風：海から陸へ吹く風です。
- 山風：山地から谷側へ吹く風を指します。
- 谷風：谷側から山地へ吹く風を指します。

仮難度70：100、b：-2.4055。

出典：[NOAA National Weather Service Wilmington — Science and Technology: Sea Breeze](https://www.weather.gov/ilm/scienceandtechnology)

置換元：earth-weather-reviewed.json / earth-daytime-sea-breeze。原稿関係：pilot-rewrite。

## short-earth-02｜地学｜レベル2（仮）

地層の時代の対比に用いる化石を何と呼ぶ？

1. 示相化石
2. 生痕化石
3. 生きた化石
4. 示準化石

正解：示準化石

示準化石は、地層の時代を比べる手掛かりです。環境の推定に用いる示相化石と区別します。

- 示相化石：主に地層ができた環境の推定に用います。
- 生痕化石：足跡や巣穴など、生物の活動の痕跡です。
- 生きた化石：現生の生物について使われる呼称で、年代対比の役割を表す名称ではありません。
- 示準化石：地層の時代の対比に用いる化石の呼び名です。

仮難度70：225、b：-1.7805。

出典：[USGS — Geologic Time: Index Fossils](https://pubs.usgs.gov/gip/geotime/fossils.html)、[Smithsonian Human Origins Program — Dating: Index Fossils](https://humanorigins.si.edu/evidence/dating)

置換元：earth-minerals-strata-reviewed.json / 10000000-0000-4000-8005-000000000061。原稿関係：pilot-rewrite。

## short-earth-03｜地学｜レベル1（仮）

太陽系の8惑星で、直径も質量も最大なのは？

1. 天王星
2. 海王星
3. 木星
4. 土星

正解：木星

木星は太陽系の惑星で最大の直径と質量を持ちます。

- 天王星：木星より小さい氷巨大惑星です。
- 海王星：木星より小さい氷巨大惑星です。
- 木星：直径・質量とも最大です。
- 土星：木星より小さい巨大惑星です。

仮難度70：100、b：-2.4055。

出典：[NASA — Jupiter Resources](https://science.nasa.gov/solar-system/resources/resource-packages/jupiter-resources/)

置換元：earth-astronomy-reviewed.json / 10000000-0000-4000-8006-000000000072。原稿関係：revised-concept。

## short-earth-04｜地学｜レベル3（仮）

花崗岩を、でき方で分類すると？

1. 変成岩
2. 深成岩
3. 火山岩
4. 堆積岩

正解：深成岩

花崗岩はマグマが地下で比較的ゆっくり冷えてできる深成岩で、火成岩の一種です。

- 変成岩：既存の岩石が熱・圧力等で変化した岩石です。
- 深成岩：地下でマグマから固まった岩石です。
- 火山岩：同じ火成岩でも、地表付近で急に冷える岩石です。
- 堆積岩：堆積物が固まってできる岩石です。

仮難度70：375、b：-1.0305。

出典：[USGS — What are igneous rocks?](https://www.usgs.gov/faqs/what-are-igneous-rocks)

置換元：earth-interior-rocks-reviewed.json / 10000000-0000-4000-8006-000000000061。原稿関係：revised-concept。

## short-earth-05｜地学｜レベル4（仮）

地衡風近似で、気圧傾度力とつり合うのは？

1. コリオリ力
2. 摩擦力
3. 浮力
4. 遠心力

正解：コリオリ力

赤道から離れた大規模な水平運動で、摩擦と加速度を無視した近似では、気圧傾度力とコリオリ力がつり合います。

- コリオリ力：地衡風の力のつり合いです。
- 摩擦力：地衡風近似では無視する力です。
- 浮力：鉛直方向の密度差に関わります。
- 遠心力：曲率を含む傾度風との区別が必要です。

仮難度70：525、b：-0.2805。

出典：[NOAA National Weather Service Jackson — Weather Education](https://www.weather.gov/jkl/education)

置換元：earth-weather-reviewed.json / 10000000-0000-4000-8007-000000000193。原稿関係：revised-concept。

## short-earth-06｜地学｜レベル5（仮）

¹⁸O/¹⁶O比が標準の1.002倍。δ¹⁸Oは？

1. ＋0.2‰
2. ＋20‰
3. −2‰
4. ＋2‰

正解：＋2‰

δ＝(試料の比/標準の比−1)×1000‰。0.002×1000＝＋2‰です。

- ＋0.2‰：百分率の数値との混同です。
- ＋20‰：桁が一つ大きくなっています。
- −2‰：試料の比が標準より大きいので正です。
- ＋2‰：千分率への換算です。

仮難度70：675、b：0.4695。

出典：[USGS Open-File Report 00-160 — 水の水素・酸素同位体比、導入部のδ定義](https://pubs.usgs.gov/of/2000/ofr00-160/pdf/ofr00-160.pdf)

置換元：earth-climate-geochemistry-reviewed.json / 10000000-0000-4000-8007-000000000178。原稿関係：revised-concept。

## short-earth-07｜地学｜レベル5（仮）

一次元のダルシー則で、比流量は水頭勾配にどう依存する？

1. 2乗に比例
2. 大きさに反比例
3. 反対向きに比例
4. 同じ向きに比例

正解：反対向きに比例

透水係数K＞0ならq＝−K dh/dx。水は水頭の低い方へ流れるので、勾配とは逆向きです。

- 2乗に比例：ダルシー則はこの範囲では線形です。
- 大きさに反比例：勾配が大きいほど比流量の大きさも増えます。
- 反対向きに比例：負号を含む比例関係です。
- 同じ向きに比例：水頭の高い方へ向かう関係ではありません。

仮難度70：675、b：0.4695。

出典：[USGS TWRI Book 3, Chapter B2 — Introduction to Ground-Water Hydraulics, Part II](https://water.usgs.gov/ogw/pubs/TWRI3-B2/TWRI3-B2-with-links.pdf)

置換元：earth-water-reviewed.json / earth-darcy-specific-discharge。原稿関係：revised-concept。

## short-earth-08｜地学｜レベル6（仮）

絶対渦度保存の気塊が北緯30°から60°へ。相対渦度は？

1. fの2倍になる
2. 減る
3. 増える
4. 一定

正解：減る

北へ移るとコリオリパラメーターfが増えます。f＋ζが保存されるなら、その増加分だけ相対渦度ζが減ります。

- fの2倍になる：絶対渦度の保存は、相対渦度をfの2倍にする条件ではありません。
- 減る：fの増加を打ち消す変化です。
- 増える：和の保存と逆の変化です。
- 一定：fが変化するため、ζも変化します。

仮難度70：825、b：1.2195。

出典：[NASA PDS Atmospheres Node — Vorticity](https://pds-atmospheres.nmsu.edu/education_and_outreach/encyclopedia/vorticity.htm)、[NASA PDS Atmospheres Node — Beta Plane Approximation](https://pds-atmospheres.nmsu.edu/education_and_outreach/encyclopedia/beta_plane.htm)

置換元：earth-weather-reviewed.json / 10000000-0000-4000-8007-000000000183。原稿関係：revised-concept。

## short-earth-09｜地学｜レベル6（仮）

乱れていない氷床コアで、気泡の空気は周囲の氷より？

1. 若い
2. 古い
3. 同じ年代
4. 年代が定義できない

正解：若い

積もった雪が氷へ圧密される間も空気は交換され、後から気泡が閉じます。そのため空気の平均年代は周囲の氷より若くなります。

- 若い：氷の材料となる雪より後に空気が封じ込められます。
- 古い：閉鎖の順序が逆です。
- 同じ年代：氷の年代と気体の年代には通常差があります。
- 年代が定義できない：不確かさはありますが、年代を推定できます。

仮難度70：825、b：1.2195。

出典：[Bender, Sowers & Brook (1997) — Gases in ice cores, PNAS 94, 8343–8349](https://pmc.ncbi.nlm.nih.gov/articles/PMC33751/)

置換元：earth-climate-geochemistry-reviewed.json / 10000000-0000-4000-8004-000000000105。原稿関係：revised-concept。

## short-earth-10｜地学｜レベル7（仮）

酸素フガシティーのFMQ基準で、Qが示す鉱物は？

1. 磁鉄鉱
2. 鉄かんらん石
3. 赤鉄鉱
4. 石英

正解：石英

FMQはfayalite–magnetite–quartz、鉄かんらん石・磁鉄鉱・石英の組合せです。Qはquartzです。

- 磁鉄鉱：magnetiteでMに対応します。
- 鉄かんらん石：fayaliteでFに対応します。
- 赤鉄鉱：FMQを構成する3鉱物には含まれません。
- 石英：quartzを表します。

仮難度70：925、b：1.7195。

出典：[Australian National University — Oxygen fugacity calculator: fayalite–magnetite–quartz](https://fo2.rses.anu.edu.au/fo2app/)

置換元：earth-climate-geochemistry-reviewed.json / 10000000-0000-4000-8007-000000000196。原稿関係：revised-concept。

## short-engineering-01｜工学｜レベル2（仮）

吊り橋の主ケーブルは、主にどの作用で荷重を支える？

1. 引張
2. ねじり
3. 圧縮
4. 曲げ

正解：引張

主ケーブルは引張を受けて荷重を支えます。橋の塔が主に受ける圧縮と区別します。

- 引張：主ケーブルを引く力で荷重を伝えます。
- ねじり：主ケーブルの荷重支持を主に説明する作用ではありません。
- 圧縮：ケーブルを押し縮める作用は主な荷重支持機構ではありません。
- 曲げ：梁では重要ですが、柔軟な主ケーブルの主な支持機構とは異なります。

仮難度70：225、b：-1.7805。

出典：[FHWA — Primer for the Inspection and Strength Evaluation of Suspension Bridge Cables](https://www.fhwa.dot.gov/bridge/pubs/if11045.pdf)

置換元：engineering-civil-reviewed.json / 10000000-0000-4000-8007-000000000206。原稿関係：pilot-rewrite。

## short-engineering-02｜工学｜レベル3（仮）

活性汚泥法の曝気で、好気性微生物に供給する気体は？

1. 酸素
2. 窒素
3. メタン
4. 水素

正解：酸素

曝気で酸素を供給し、好気性の微生物による有機物の分解を支えます。

- 酸素：活性汚泥法の好気的な処理を支えます。
- 窒素：空気には多く含まれますが、設問の処理で供給する目的となる気体は酸素です。
- メタン：嫌気性の消化などで生じる気体で、この曝気の目的ではありません。
- 水素：好気性微生物の呼吸を支えるための供給気体ではありません。

仮難度70：375、b：-1.0305。

出典：[US EPA — Primer for Municipal Wastewater Treatment Systems](https://www.epa.gov/sites/default/files/2015-09/documents/primer.pdf)

置換元：engineering-process-reviewed.json / 10000000-0000-4000-8004-000000000147。原稿関係：pilot-rewrite。

## short-engineering-03｜工学｜レベル1（仮）

CADで主に行う作業は？

1. 形状や図面の設計
2. 材料の溶接
3. 製品の運搬
4. 温度の実測

正解：形状や図面の設計

CADはコンピューターを使って形状や図面等を設計するための支援です。

- 形状や図面の設計：Computer-Aided Designの中心的な役割です。
- 材料の溶接：設計データを使う場合もありますが、CAD自体の主な作業ではありません。
- 製品の運搬：運搬装置の制御とは区別します。
- 温度の実測：計測装置による測定とは区別します。

仮難度70：100、b：-2.4055。

出典：[Autodesk — CAD Software](https://www.autodesk.com/solutions/cad-software)

置換元：engineering-manufacturing-reviewed.json / 10000000-0000-4000-8003-000000000056。原稿関係：revised-concept。

## short-engineering-04｜工学｜レベル2（仮）

炭素鋼の主成分となる金属は？

1. 銅
2. アルミニウム
3. ニッケル
4. 鉄

正解：鉄

炭素鋼は鉄を主成分とし、炭素を含む鋼です。

- 銅：銅合金と鋼は異なります。
- アルミニウム：アルミニウム合金と鋼は異なります。
- ニッケル：合金元素となる場合はありますが、鋼の主成分ではありません。
- 鉄：鋼の主成分です。

仮難度70：225、b：-1.7805。

出典：[World Steel Association — Raw materials](https://worldsteel.org/about-steel/raw-materials/)

置換元：engineering-materials-reviewed.json / 10000000-0000-4000-8002-000000000051。原稿関係：revised-concept。

## short-engineering-05｜工学｜レベル4（仮）

理想減速機で角速度を1/4にすると、出力トルクは入力の？

1. 16倍
2. 同じ
3. 4倍
4. 1/4倍

正解：4倍

定常で損失がなければ動力Tωは保存されます。角速度が1/4ならトルクは4倍になります。

- 16倍：角速度の2乗には反比例しません。
- 同じ：同じトルクでは動力が1/4になります。
- 4倍：同じ動力を小さい角速度で伝えるためです。
- 1/4倍：角速度と同じ比にする関係ではありません。

仮難度70：525、b：-0.2805。

出典：[OpenStax — Work and Power for Rotational Motion](https://openstax.org/books/university-physics-volume-1/pages/10-8-work-and-power-for-rotational-motion)

置換元：engineering-mechanical-reviewed.json / 10000000-0000-4000-8006-000000000096。原稿関係：revised-concept。

## short-engineering-06｜工学｜レベル5（仮）

レイノルズ数は、慣性力と何の力の比を表す？

1. 浮力
2. 粘性力
3. 重力
4. 表面張力

正解：粘性力

Re＝ρUL/μは慣性力と粘性力の相対的な大きさを表します。値が大きいほど慣性の寄与が相対的に大きくなります。

- 浮力：浮力を含む指標とは区別します。
- 粘性力：慣性力/粘性力に対応する無次元量です。
- 重力：重力との比較はフルード数等に関わります。
- 表面張力：表面張力との比較はウェーバー数に関わります。

仮難度70：675、b：0.4695。

出典：[NASA Glenn — Similarity Parameters](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/similarity-parameters/)

置換元：engineering-heat-fluid-reviewed.json / eng-reynolds-force-ratio。原稿関係：revised-concept。

## short-engineering-07｜工学｜レベル6（仮）

等密度・定常の不可逆一次反応CSTR。kτ＝3で転化率は？

1. 75％
2. 25％
3. 50％
4. 95％

正解：75％

理想完全混合槽では、滞留時間τについてX＝kτ/(1＋kτ)。3/4＝75％です。

- 75％：完全混合槽の物質収支から得られます。
- 25％：出口の未反応割合に対応します。
- 50％：kτ＝1の場合の転化率です。
- 95％：同じkτの理想押出し流れに近い値です。

仮難度70：825、b：1.2195。

出典：[University of Michigan — Startup of a CSTR](https://websites.umich.edu/~elements/5e/06chap/expanded_ch06_cstr.pdf)

置換元：engineering-process-reviewed.json / eng-cstr-first-order-steady-conversion。原稿関係：revised-concept。

## short-engineering-08｜工学｜レベル6（仮）

8 kHzの余弦波を10 kHzで標本化。折り返し周波数は？

1. 4 kHz
2. 5 kHz
3. 8 kHz
4. 2 kHz

正解：2 kHz

0〜5 kHzのナイキスト帯域に折り返すと、10−8＝2 kHzの余弦波と同じ標本列になります。

- 4 kHz：元の周波数の半分ではありません。
- 5 kHz：ナイキスト周波数そのものであり、折り返し先ではありません。
- 8 kHz：元の信号の周波数です。
- 2 kHz：標本化周波数との差です。

仮難度70：825、b：1.2195。

出典：[MIT 6.003 — Lecture 21: Sampling](https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/12e6e5d7567fca2e993ef8563fef5a60_MIT6_003F11_lec21.pdf)

置換元：engineering-communications-reviewed.json / eng-sampling-cosine-alias。原稿関係：revised-concept。

## short-engineering-09｜工学｜レベル7（仮）

平面nMOSの短チャネル化による電荷共有は、しきい値電圧を？

1. 一定にする
2. 供給電圧に一致させる
3. 下げる
4. 上げる

正解：下げる

一様ドーピングのモデルで他の条件を固定すると、ソース・ドレインが空乏層電荷の一部を担い、ゲートに必要な電圧が低下します。逆短チャネル効果などは分けて扱います。

- 一定にする：この寄与を考えると変化します。
- 供給電圧に一致させる：供給電圧と等しくする効果ではありません。
- 下げる：電荷共有によるしきい値のロールオフです。
- 上げる：別の効果で上昇する場合との区別が必要です。

仮難度70：925、b：1.7195。

出典：[MIT 6.774 — Lecture 8, Dopant diffusion and profile measurement](https://ocw.mit.edu/courses/6-774-physics-of-microfabrication-front-end-processing-fall-2004/1usKzT5lXIFBbXrwHd6MmOD3PbE3Z9HPO_transcript.pdf)

置換元：engineering-electrical-reviewed.json / 10000000-0000-4000-8007-000000000243。原稿関係：revised-concept。

## short-engineering-10｜工学｜レベル7（仮）

磁場なし・時間反転の偶奇が同じ変数で、Onsager相反関係は？

1. L₁₂＋L₂₁＝1
2. L₁₂＝L₂₁
3. L₁₂＝−L₂₁
4. L₁₂L₂₁＝1

正解：L₁₂＝L₂₁

平衡近傍の線形応答で微視的可逆性が成り立つとき、指定された条件では交差係数が対称になります。

- L₁₂＋L₂₁＝1：係数の和を1にする規格化ではありません。
- L₁₂＝L₂₁：同じ時間反転対称性を持つ変数間の関係です。
- L₁₂＝−L₂₁：偶奇性が異なる場合などと混同しています。
- L₁₂L₂₁＝1：逆数関係を要求する法則ではありません。

仮難度70：925、b：1.7195。

出典：[S. D. Brechet — Onsager-Casimir reciprocal relations (2022)](https://arxiv.org/pdf/2210.04289)

置換元：engineering-heat-fluid-reviewed.json / 10000000-0000-4000-8007-000000000247。原稿関係：revised-concept。

## short-agriculture-01｜農学｜レベル3（仮）

還元糖とアミノ基の反応で食品が褐色になるのは？

1. メイラード反応
2. カラメル化
3. 糊化
4. 乳化

正解：メイラード反応

メイラード反応は、還元糖とアミノ基を持つ成分から始まり、食品の色や香りに関わります。

- メイラード反応：設問の反応物の組合せに対応します。
- カラメル化：糖の加熱で進む変化で、アミノ基を持つ成分を反応の必須相手としません。
- 糊化：デンプンを水と加熱したときの変化です。
- 乳化：混ざりにくい液体の一方が微細な滴として分散することです。

仮難度70：375、b：-1.0305。

出典：[American Chemical Society — Sweet Science: Having Fun with Candy Chemistry](https://www.acs.org/content/dam/acsorg/events/culinary-chemistry/Slides/2014-10-16-candy-chemistry-final.pdf)

置換元：agriculture-food-reviewed.json / agri-maillard-versus-caramelization。原稿関係：pilot-rewrite。

## short-agriculture-02｜農学｜レベル3（仮）

切株から伸びる芽を利用して森林を再生する方法は？

1. 萌芽更新
2. 植栽
3. 天然下種更新
4. 播種更新

正解：萌芽更新

萌芽更新は、切株などから新しい芽が伸びる力を利用します。種子から育つ更新とは異なります。

- 萌芽更新：残った個体の組織から伸びる芽を利用します。
- 植栽：苗木を植える方法です。
- 天然下種更新：自然に散布された種子などから次の世代を育てます。
- 播種更新：種子をまいて更新する方法です。

仮難度70：375、b：-1.0305。

出典：[FAO AGROVOC — Coppice system](https://agrovoc.review.fao.org/browse/agrovoc/en/page/c_1871)

置換元：agriculture-forestry-reviewed.json / agri-coppice-asexual-regeneration。原稿関係：pilot-rewrite。

## short-agriculture-03｜農学｜レベル1（仮）

二つの親系統を交配した、雑種第一代の記号は？

1. P₁
2. BC₁
3. F₁
4. F₂

正解：F₁

F₁はfirst filial generation、雑種第一代です。

- P₁：親系統を表す記号です。
- BC₁：第1回の戻し交配世代を表します。
- F₁：最初の雑種世代です。
- F₂：F₁の次の子世代です。

仮難度70：100、b：-2.4055。

出典：[Iowa State University — Crop Genetics, Chapter 7: Inbreeding and Heterosis](https://iastate.pressbooks.pub/cropgenetics/chapter/inbreeding-and-heterosis-2/)

置換元：agriculture-breeding-reviewed.json / 10000000-0000-4000-8003-000000000066。原稿関係：revised-concept。

## short-agriculture-04｜農学｜レベル1（仮）

肥料表示のN・P・Kで、Nは？

1. カルシウム
2. 窒素
3. リン
4. カリウム

正解：窒素

Nは窒素、Pはリン、Kはカリウムを表します。

- カルシウム：元素記号Caです。
- 窒素：元素記号Nです。
- リン：元素記号Pです。
- カリウム：元素記号Kです。

仮難度70：100、b：-2.4055。

出典：[University of Minnesota Extension — What is the right fertilizer for your lawn and garden?](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/what-is-the-right-fertilizer-for-your-lawn-and-garden)

置換元：agriculture-soil-reviewed.json / 10000000-0000-4000-8006-000000000182。原稿関係：revised-concept。

## short-agriculture-05｜農学｜レベル2（仮）

イネのいもち病を起こす病原体の仲間は？

1. 真菌
2. 細菌
3. ウイルス
4. 線虫

正解：真菌

いもち病は、真菌に分類されるいもち病菌による病害です。

- 真菌：病原体は糸状菌です。
- 細菌：別の病害を起こす細菌とは区別します。
- ウイルス：ウイルス性病害ではありません。
- 線虫：動物に分類される線虫ではありません。

仮難度70：225、b：-1.7805。

出典：[IRRI Rice Knowledge Bank — Blast (leaf and collar)](https://www.knowledgebank.irri.org/training/fact-sheets/pest-management/diseases/item/blast-leaf-collar)

置換元：agriculture-plant-pathology-reviewed.json / 10000000-0000-4000-8006-000000000184。原稿関係：revised-concept。

## short-agriculture-06｜農学｜レベル4（仮）

食品の平衡水蒸気圧が同温の純水の90％。水分活性は？

1. 0.09
2. 0.10
3. 9.0
4. 0.90

正解：0.90

水分活性は、同温の純水の水蒸気圧に対する比です。水分含量が90％という意味ではありません。

- 0.09：百分率の換算が一桁違います。
- 0.10：1から差し引く定義ではありません。
- 9.0：この条件で1を超える値にはなりません。
- 0.90：90％を比で表した値です。

仮難度70：525、b：-0.2805。

出典：[FDA — Water Activity (aw) in Foods](https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-technical-guides/water-activity-aw-foods)

置換元：agriculture-food-reviewed.json / 10000000-0000-4000-8004-000000000159。原稿関係：revised-concept。

## short-agriculture-07｜農学｜レベル5（仮）

飼料の全窒素が乾物の2％。係数6.25による粗タンパク質は？

1. 8.25％
2. 0.32％
3. 12.5％
4. 3.125％

正解：12.5％

2×6.25＝12.5％です。全窒素による換算なので、非タンパク態窒素も寄与し得ます。

- 8.25％：足し算ではありません。
- 0.32％：窒素割合を係数で割っていません。
- 12.5％：窒素割合に係数を掛けます。
- 3.125％：係数を窒素割合で割っていません。

仮難度70：675、b：0.4695。

出典：[Oregon State University — Understanding your forage test results](https://extension.oregonstate.edu/catalog/em-8801-understanding-your-forage-test-results)

置換元：agriculture-livestock-reviewed.json / agri-crude-protein-nitrogen-factor。原稿関係：revised-concept。

## short-agriculture-08｜農学｜レベル6（仮）

戻し交配で、目的領域外を反復親型へ戻すための選抜は？

1. 無作為選抜
2. 背景選抜
3. 前景選抜
4. 組換え選抜

正解：背景選抜

背景選抜は、目的領域以外のゲノムを反復親に近づけるためにマーカー等を使います。

- 無作為選抜：反復親型への回復を狙った選抜ではありません。
- 背景選抜：反復親の遺伝的背景の回復を進めます。
- 前景選抜：目的遺伝子等を持つ個体の選抜です。
- 組換え選抜：主に目的遺伝子近傍の連鎖を切る組換えに注目します。

仮難度70：825、b：1.2195。

出典：[Iowa State University — Molecular Plant Breeding, Chapter 6: Marker Assisted Backcrossing](https://iastate.pressbooks.pub/molecularplantbreeding/chapter/marker-assisted-backcrossing/)

置換元：agriculture-breeding-reviewed.json / agri-marker-background-selection。原稿関係：revised-concept。

## short-agriculture-09｜農学｜レベル7（仮）

植物のTIR型免疫受容体で、TIRドメインの代表的酵素活性は？

1. NAD⁺分解
2. DNA複製
3. セルロース合成
4. 脂肪酸合成

正解：NAD⁺分解

植物TIRドメインのNAD⁺切断活性は免疫シグナルに関与します。TIRという名前を持つすべてのタンパク質に同じ機能を一般化する問題ではありません。

- NAD⁺分解：免疫シグナル分子の生成に関わる活性です。
- DNA複製：DNAポリメラーゼの反応ではありません。
- セルロース合成：細胞壁のセルロース合成酵素ではありません。
- 脂肪酸合成：脂肪酸合成酵素ではありません。

仮難度70：925、b：1.7195。

出典：[Horsefield et al. (2019), NAD+ cleavage activity by animal and plant TIR domains in cell death pathways](https://pubmed.ncbi.nlm.nih.gov/31439792/)

置換元：agriculture-plant-pathology-reviewed.json / 10000000-0000-4000-8007-000000000495。原稿関係：new-concept。

## short-agriculture-10｜農学｜レベル7（仮）

活性型ZAR1レジストソームは、ZAR1何分子からなる？

1. 4分子
2. 6分子
3. 8分子
4. 5分子

正解：5分子

活性化したZAR1が五量体を形成します。この複合体はカルシウム透過性チャネルとして機能することも示されています。

- 4分子：四量体ではありません。
- 6分子：六量体ではありません。
- 8分子：八量体ではありません。
- 5分子：五量体の複合体です。

仮難度70：925、b：1.7195。

出典：[Bi et al. (2021), The ZAR1 resistosome is a calcium-permeable channel triggering plant immune signaling](https://doi.org/10.1016/j.cell.2021.05.003)、[Max Planck Institute for Plant Breeding Research — Plant immunity](https://www.mpipz.mpg.de/plant-immunity)

置換元：agriculture-breeding-reviewed.json / 10000000-0000-4000-8005-000000000174。原稿関係：new-concept。

## short-informatics-01｜情報・計算機科学｜レベル3（仮）

整列済み配列を、候補を半分ずつにして探す方法は？

1. 深さ優先探索
2. 二分探索
3. 線形探索
4. 幅優先探索

正解：二分探索

二分探索は、中央の要素との比較で、探す範囲を半分ずつに絞ります。

- 深さ優先探索：グラフなどを一つの経路に沿って深く調べる方法です。
- 二分探索：整列順を利用して、候補を半分ずつに絞ります。
- 線形探索：要素を順に調べる方法です。
- 幅優先探索：グラフなどを近い層から調べる方法です。

仮難度70：375、b：-1.0305。

出典：[Sedgewick & Wayne — Elementary Symbol Tables](https://algs4.cs.princeton.edu/31elementary/)

置換元：informatics-algorithms-reviewed.json / 10000000-0000-4000-8007-000000000272。原稿関係：pilot-rewrite。

## short-informatics-02｜情報・計算機科学｜レベル3（仮）

SQLで、結果の行を指定した順に並べる句は？

1. WHERE
2. GROUP BY
3. HAVING
4. ORDER BY

正解：ORDER BY

ORDER BYで、列や式を基準とする並び順を指定します。同順位を区別したいときは追加の並べ替え条件も指定します。

- WHERE：行の抽出条件を指定する句です。
- GROUP BY：行をグループにまとめるための句です。
- HAVING：グループに対する抽出条件を指定します。
- ORDER BY：結果の並べ替え条件を指定する句です。

仮難度70：375、b：-1.0305。

出典：[PostgreSQL 18 — Sorting Rows (ORDER BY)](https://www.postgresql.org/docs/18/queries-order.html)

置換元：informatics-database-reviewed.json / info-sql-order-guarantee。原稿関係：pilot-rewrite。

## short-informatics-03｜情報・計算機科学｜レベル1（仮）

Webページの色や配置を指定するのは？

1. CSS
2. SQL
3. SMTP
4. DNS

正解：CSS

CSSは、Web文書の要素をどう表示するかを指定します。

- CSS：スタイルやレイアウトを指定します。
- SQL：データベースを操作する言語です。
- SMTP：メール配送のプロトコルです。
- DNS：名前解決に使う仕組みです。

仮難度70：100、b：-2.4055。

出典：[MDN — CSS: Cascading Style Sheets](https://developer.mozilla.org/en-US/docs/Web/CSS)

置換元：informatics-web-ethics-reviewed.json / 10000000-0000-4000-8003-000000000074。原稿関係：revised-concept。

## short-informatics-04｜情報・計算機科学｜レベル2（仮）

A→B→Cと積んだスタックから取り出す順は？

1. A→B→C
2. B→A→C
3. A→C→B
4. C→B→A

正解：C→B→A

スタックは後入れ先出しです。最後に積んだCから取り出します。

- A→B→C：先入れ先出しのキューの順です。
- B→A→C：最後に積んだCが最初になっていません。
- A→C→B：最初に積んだAが最初になっていません。
- C→B→A：LIFOに従った順です。

仮難度70：225、b：-1.7805。

出典：[Sedgewick & Wayne — Bags, Queues, and Stacks](https://algs4.cs.princeton.edu/13stacks/)

置換元：informatics-algorithms-reviewed.json / 10000000-0000-4000-8006-000000000102。原稿関係：revised-concept。

## short-informatics-05｜情報・計算機科学｜レベル2（仮）

AESで暗号化と復号に使う鍵の関係は？

1. 送信者の公開鍵と秘密鍵
2. 異なる公開鍵同士
3. 同じ秘密鍵
4. 受信者の公開鍵と秘密鍵

正解：同じ秘密鍵

AESは共通鍵暗号で、対応する暗号化・復号に同じ秘密鍵を用います。

- 送信者の公開鍵と秘密鍵：公開鍵方式の署名などとの混同です。
- 異なる公開鍵同士：AESの鍵の関係ではありません。
- 同じ秘密鍵：共通鍵暗号の基本的な関係です。
- 受信者の公開鍵と秘密鍵：公開鍵暗号の組合せです。

仮難度70：225、b：-1.7805。

出典：[NIST CSRC — Symmetric Cryptography](https://csrc.nist.gov/glossary/term/Symmetric_Cryptography)

置換元：informatics-security-reviewed.json / 10000000-0000-4000-8007-000000000271。原稿関係：revised-concept。

## short-informatics-06｜情報・計算機科学｜レベル4（仮）

取引の更新を一部だけ確定させないACIDの性質は？

1. 永続性
2. 原子性
3. 一貫性
4. 分離性

正解：原子性

原子性は、トランザクション全体が確定するか、全体が確定しないかという性質です。

- 永続性：確定した結果を保持する性質です。
- 原子性：all-or-nothingの性質です。
- 一貫性：整合性条件を守る性質です。
- 分離性：並行トランザクション間の干渉の扱いです。

仮難度70：525、b：-0.2805。

出典：[PostgreSQL 18 — Transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html)

置換元：informatics-database-reviewed.json / 10000000-0000-4000-8006-000000000106。原稿関係：revised-concept。

## short-informatics-07｜情報・計算機科学｜レベル4（仮）

標準的な幅優先探索で、未処理の頂点を管理する構造は？

1. キュー
2. スタック
3. ヒープ
4. 二分探索木

正解：キュー

キューを使い、発見した順に処理することで、始点から辺数の少ない順に探索できます。

- キュー：先入れ先出しで処理します。
- スタック：通常は深さ優先探索に対応します。
- ヒープ：重み付き最短路等で優先度管理に使います。
- 二分探索木：探索順をこの方式で保つための標準構造ではありません。

仮難度70：525、b：-0.2805。

出典：[Sedgewick & Wayne — Undirected Graphs](https://algs4.cs.princeton.edu/41graph/)

置換元：informatics-algorithms-reviewed.json / 10000000-0000-4000-8006-000000000120。原稿関係：revised-concept。

## short-informatics-08｜情報・計算機科学｜レベル5（仮）

処理時間の20％が並列化不能。Amdahl則で高速化の上限は？

1. 4倍
2. 20倍
3. 80倍
4. 5倍

正解：5倍

固定仕事量で追加コストを無視しても、残る20％の時間は短縮できません。上限は1/0.2＝5倍です。

- 4倍：並列化できる割合との比ではありません。
- 20倍：20という百分率の数値をそのまま使いません。
- 80倍：並列化可能部分の百分率をそのまま使いません。
- 5倍：並列化できない割合の逆数です。

仮難度70：675、b：0.4695。

出典：[LLNL — Introduction to Parallel Computing Tutorial: Amdahl’s Law](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial)

置換元：informatics-os-reviewed.json / info-amdahl-fixed-work-limit。原稿関係：revised-concept。

## short-informatics-09｜情報・計算機科学｜レベル6（仮）

Q∈NP。既知のNP完全問題LからQの困難さを示す還元は？

1. LからLへ
2. QからQへ
3. LからQへ
4. QからLへ

正解：LからQへ

通常の多項式時間多対一還元でL≤pQを示すと、Lの困難さがQへ伝わります。Q∈NPと合わせてNP完全です。

- LからLへ：Qの困難さを示す材料になりません。
- QからQへ：自分への還元では追加の困難さは示せません。
- LからQへ：LをQを使って解けることを示します。
- QからLへ：QがLより難しいことは示せません。

仮難度70：825、b：1.2195。

出典：[Stephen Cook — The P versus NP Problem](https://www.claymath.org/wp-content/uploads/2022/06/pvsnp.pdf)

置換元：informatics-theory-reviewed.json / 10000000-0000-4000-8007-000000000290。原稿関係：revised-concept。

## short-informatics-10｜情報・計算機科学｜レベル7（仮）

Riceの定理で一般に決定不能なのは、非自明な何の性質？

1. 遷移規則の個数
2. 機械が受理する言語
3. 機械の状態数
4. 記述の文字数

正解：機械が受理する言語

Riceの定理は、チューリング機械が認識する言語の非自明な意味的性質を扱います。有限な機械の記述を数える構文的性質とは異なります。

- 遷移規則の個数：与えられた有限の遷移表から数えられます。
- 機械が受理する言語：受理言語の意味的性質です。
- 機械の状態数：有限な記述から数えられます。
- 記述の文字数：与えられた有限の記述から数えられます。

仮難度70：925、b：1.7195。

出典：[MIT 6.045J — Lecture 10: Self-reference and the recursion theorem](https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/2fe1aea3ab4dd67aff81f2a04fc010ef_MIT6_045JS11_lec10.pdf)

置換元：informatics-theory-reviewed.json / 10000000-0000-4000-8005-000000000095。原稿関係：revised-concept。

## short-medical-01｜医歯薬学｜レベル2（仮）

炎症で歯槽骨など歯の支持組織が壊れる病気は？

1. 歯肉炎
2. 歯周炎
3. う蝕
4. 歯髄炎

正解：歯周炎

歯周炎では、歯を支える組織が破壊されます。歯肉に限局する歯肉炎と区別します。

- 歯肉炎：炎症が歯肉に限局し、設問のような支持骨の破壊を伴う病名とは区別します。
- 歯周炎：歯槽骨などの支持組織に及ぶ炎症と破壊を表します。
- う蝕：歯の硬組織が脱灰される病気です。
- 歯髄炎：歯の内部にある歯髄の炎症です。

仮難度70：225、b：-1.7805。

出典：[NIDCR — Periodontal (Gum) Disease](https://www.nidcr.nih.gov/health-info/gum-disease)

置換元：medical-dental-reviewed.json / medical-dental-periodontitis-bone。原稿関係：pilot-rewrite。

## short-medical-02｜医歯薬学｜レベル3（仮）

微生物が細胞外の基質に包まれた集団を何と呼ぶ？

1. 莢膜
2. 芽胞
3. プラスミド
4. バイオフィルム

正解：バイオフィルム

バイオフィルムでは、微生物の集団が細胞外の高分子からなる基質に包まれています。

- 莢膜：個々の細胞の外側を覆う構造です。
- 芽胞：一部の細菌が作る耐久性の高い構造です。
- プラスミド：主な染色体とは別に複製できるDNAです。
- バイオフィルム：微生物の集団と細胞外基質の関係を表します。

仮難度70：375、b：-1.0305。

出典：[OpenStax — Microbiology, §9.1 Biofilm Structure](https://openstax.org/books/microbiology/pages/9-1-how-microbes-grow)

置換元：medical-microbiology-reviewed.json / medical-microbiology-biofilm-matrix。原稿関係：pilot-rewrite。

## short-medical-03｜医歯薬学｜レベル1（仮）

通常の成人で、最も長い骨は？

1. 脛骨
2. 橈骨
3. 大腿骨
4. 上腕骨

正解：大腿骨

太ももの骨である大腿骨が、人体で最も長い骨です。

- 脛骨：下腿にある骨です。
- 橈骨：前腕にある骨です。
- 大腿骨：太ももにある長骨です。
- 上腕骨：上腕の骨です。

仮難度70：100、b：-2.4055。

出典：[OpenStax — Anatomy and Physiology, 8.4 Bones of the Lower Limb](https://openstax.org/books/anatomy-and-physiology/pages/8-4-bones-of-the-lower-limb)

置換元：medical-anatomy-reviewed.json / 10000000-0000-4000-8006-000000000056。原稿関係：revised-concept。

## short-medical-04｜医歯薬学｜レベル1（仮）

血管の傷に集まり、一次止血の栓を作る血球成分は？

1. Bリンパ球
2. 血小板
3. 赤血球
4. 好酸球

正解：血小板

血小板は傷ついた血管に粘着・凝集し、一次止血で血小板血栓を作ります。

- Bリンパ球：抗体を作る細胞への分化等に関わります。
- 血小板：一次止血の中心的な成分です。
- 赤血球：主に酸素を運びます。
- 好酸球：寄生虫への応答やアレルギー等に関わります。

仮難度70：100、b：-2.4055。

出典：[OpenStax Anatomy and Physiology 2e, Hemostasis](https://openstax.org/books/anatomy-and-physiology-2e/pages/18-5-hemostasis)

置換元：medical-pharmacology-reviewed.json / 10000000-0000-4000-8006-000000000044。原稿関係：new-concept。

## short-medical-05｜医歯薬学｜レベル3（仮）

胎盤を通り、母体から胎児へ主に移る抗体クラスは？

1. IgG
2. IgM
3. IgA
4. IgE

正解：IgG

IgGが胎盤を介して移行し、胎児・新生児の受動免疫に寄与します。

- IgG：胎盤移行に重要な抗体クラスです。
- IgM：通常は胎盤を通りにくい大きな抗体です。
- IgA：母乳等の粘膜免疫で重要です。
- IgE：アレルギーや寄生虫応答などに関わります。

仮難度70：375、b：-1.0305。

出典：[OpenStax — Microbiology, 18.1 Overview of Specific Adaptive Immunity](https://openstax.org/books/microbiology/pages/18-1-overview-of-specific-adaptive-immunity)

置換元：medical-immunology-reviewed.json / medical-immunology-placental-igg。原稿関係：revised-concept。

## short-medical-06｜医歯薬学｜レベル4（仮）

分化した細胞型が、別の分化した細胞型へ置き換わる変化は？

1. 肥大
2. 過形成
3. 萎縮
4. 化生

正解：化生

化生は、ある分化した組織の細胞型が別の分化した細胞型へ置き換わる適応性変化です。

- 肥大：個々の細胞が大きくなります。
- 過形成：細胞数が増えます。
- 萎縮：細胞や組織の大きさが減ります。
- 化生：細胞型の置換を指します。

仮難度70：525、b：-0.2805。

出典：[University of Utah — WebPath, Cellular Transformation](https://webpath.med.utah.edu/NEOHTML/NEOPL003.html)

置換元：medical-pathology-reviewed.json / 10000000-0000-4000-8007-000000000145。原稿関係：revised-concept。

## short-medical-07｜医歯薬学｜レベル4（仮）

CFTRの主な分子機能は？

1. 水チャネル
2. 糖輸送体
3. 陰イオンチャネル
4. 陽イオンポンプ

正解：陰イオンチャネル

CFTRは塩化物イオンや重炭酸イオンの輸送に関わるチャネルです。

- 水チャネル：アクアポリン等の主な機能です。
- 糖輸送体：糖を運ぶ輸送体ではありません。
- 陰イオンチャネル：塩化物や重炭酸イオンの輸送に関わります。
- 陽イオンポンプ：ATPによって制御されますが、この陽イオンポンプではありません。

仮難度70：525、b：-0.2805。

出典：[NIH MedlinePlus Genetics — CFTR gene, Normal Function](https://medlineplus.gov/download/genetics/gene/cftr.pdf)

置換元：medical-biochemistry-reviewed.json / medical-biochemistry-cftr-channel。原稿関係：revised-concept。

## short-medical-08｜医歯薬学｜レベル5（仮）

平衡・十分な作動薬濃度で、可逆的競合拮抗による反応曲線の変化は？

1. EC50増・最大反応増
2. EC50増・最大反応同じ
3. EC50同じ・最大反応減
4. EC50減・最大反応同じ

正解：EC50増・最大反応同じ

同じ部位を競い、作動薬を十分増やせる条件なら、曲線は右へ移動し、最大反応は変わりません。

- EC50増・最大反応増：最大反応の増加を起こす関係ではありません。
- EC50増・最大反応同じ：競合を高濃度の作動薬で乗り越えられる条件です。
- EC50同じ・最大反応減：単純な競合拮抗の典型的な変化ではありません。
- EC50減・最大反応同じ：効力が上がる方向の変化ではありません。

仮難度70：675、b：0.4695。

出典：[IUPHAR Pharmacology Education Project — Pharmacodynamics](https://pharmacologyeducation.org/pharmacodynamics/)

置換元：medical-pharmacology-reviewed.json / medical-pharmacology-competitive-antagonist。原稿関係：revised-concept。

## short-medical-09｜医歯薬学｜レベル6（仮）

Fick法で酸素消費360 mL/分、動脈−混合静脈差60 mL/L。心拍出量は？

1. 6 L/分
2. 0.167 L/分
3. 60 L/分
4. 300 L/分

正解：6 L/分

定常状態で心拍出量＝酸素消費量/動脈血と混合静脈血の酸素含量差。360/60＝6 L/分です。

- 6 L/分：消費量を含量差で割ります。
- 0.167 L/分：割る向きが逆です。
- 60 L/分：計算の桁が違います。
- 300 L/分：単位の異なる二つの値を引く計算ではありません。

仮難度70：825、b：1.2195。

出典：[Richard E. Klabunde — CV Physiology, Measurement of Cardiac Output](https://cvphysiology.com/cardiac-function/cf021)

置換元：medical-physiology-reviewed.json / medical-physiology-fick-output。原稿関係：revised-concept。

## short-medical-10｜医歯薬学｜レベル7（仮）

典型的なNLRP3インフラマソームで活性化する酵素は？

1. カスパーゼ3
2. カスパーゼ8
3. カスパーゼ9
4. カスパーゼ1

正解：カスパーゼ1

古典的なNLRP3インフラマソームはカスパーゼ1の活性化を促し、IL-1β等の成熟と炎症性細胞死に関わります。

- カスパーゼ3：アポトーシスの実行酵素として知られます。
- カスパーゼ8：外因性アポトーシス経路等に関わります。
- カスパーゼ9：内因性アポトーシス経路等に関わります。
- カスパーゼ1：古典的インフラマソームの主要なエフェクターです。

仮難度70：925、b：1.7195。

出典：[Mariathasan et al. (2006), Cryopyrin activates the inflammasome in response to toxins and ATP](https://www.nature.com/articles/nature04515)

置換元：medical-immunology-reviewed.json / 10000000-0000-4000-8006-000000000060。原稿関係：new-concept。

## short-humanities-01｜人文社会科学｜レベル1（仮）

物価全体が継続して上がる現象は？

1. インフレーション
2. デノミネーション
3. デフレーション
4. 円高

正解：インフレーション

インフレーションは、物価水準全体の継続的な上昇です。一商品の値上がりとは区別します。

- インフレーション：物価全体の継続的な上昇を指します。
- デノミネーション：通貨の表示単位を変更することです。
- デフレーション：物価水準全体が持続的に下がる現象です。
- 円高：他の通貨に対する円の価値の上昇です。

仮難度70：100、b：-2.4055。

出典：[European Central Bank — Price stability: why is it important for you?](https://www.ecb.europa.eu/home/pdf/students/booklet_en.pdf)

置換元：humanities-economics-reviewed.json / 10000000-0000-4000-8003-000000000092。原稿関係：pilot-rewrite。

## short-humanities-02｜人文社会科学｜レベル3（仮）

対象の暮らしに参加しながら観察する調査法は？

1. 参与観察
2. 質問紙調査
3. 実験法
4. 文献調査

正解：参与観察

参与観察では、対象の生活や活動に参加し、やり取りも経験しながら観察・記録します。

- 参与観察：参加と観察を組み合わせる調査法です。
- 質問紙調査：質問項目への回答を集める調査です。
- 実験法：条件を操作して、その影響を調べる方法です。
- 文献調査：既存の文献や記録を調べる方法です。

仮難度70：375、b：-1.0305。

出典：[OpenStax — Introduction to Anthropology, 2.4 Participant Observation and Interviewing](https://openstax.org/books/introduction-anthropology/pages/2-4-participant-observation-and-interviewing)

置換元：humanities-language-reviewed.json / 10000000-0000-4000-8004-000000000234。原稿関係：pilot-rewrite。

## short-humanities-03｜人文社会科学｜レベル2（仮）

ある言語で、語の意味を区別する音の抽象的な単位は？

1. 音素
2. 形態素
3. 音節
4. 単語

正解：音素

音素は、ある言語で意味の区別に関わる音の対立を捉える単位です。

- 音素：音韻論の単位です。
- 形態素：意味・文法機能に対応する最小の単位です。
- 音節：音のまとまりを表す単位で、音素と同じではありません。
- 単語：語彙としての単位で、音の対立の単位ではありません。

仮難度70：225、b：-1.7805。

出典：[Essentials of Linguistics — 4.1 Phonemes and Contrast](https://ecampusontario.pressbooks.pub/essentialsoflinguistics/chapter/4-2-phonemes-and-contrast/)

置換元：humanities-language-reviewed.json / 10000000-0000-4000-8002-000000000095。原稿関係：revised-concept。

## short-humanities-04｜人文社会科学｜レベル2（仮）

ベルと餌を繰り返し対提示し、ベルで唾液が出る学習は？

1. オペラント条件づけ
2. 観察学習
3. 馴化
4. 古典的条件づけ

正解：古典的条件づけ

ベルが餌と結び付くことを学び、条件刺激として唾液反応を引き起こすようになる例です。

- オペラント条件づけ：行動とその結果の関係による学習です。
- 観察学習：他者の行動の観察による学習です。
- 馴化：反復刺激への反応が弱まることです。
- 古典的条件づけ：刺激間の関連を学ぶ条件づけです。

仮難度70：225、b：-1.7805。

出典：[OpenStax Psychology 2e 6.2 — Classical Conditioning](https://openstax.org/books/psychology-2e/pages/6-2-classical-conditioning)

置換元：humanities-psychology-reviewed.json / 10000000-0000-4000-8003-000000000091。原稿関係：revised-concept。

## short-humanities-05｜人文社会科学｜レベル3（仮）

諦めた代替案のうち、最も価値の高いものの価値を何という？

1. 固定費用
2. 平均費用
3. 機会費用
4. 埋没費用

正解：機会費用

ある選択の機会費用は、それを選ぶことで失う最善の代替案の価値です。

- 固定費用：生産量によらない費用です。
- 平均費用：総費用を生産量で割った値です。
- 機会費用：選択に伴う代替案の犠牲を表します。
- 埋没費用：すでに支出し取り戻せない費用です。

仮難度70：375、b：-1.0305。

出典：[OpenStax Economics 3e 2.1 — The Concept of Opportunity Cost](https://openstax.org/books/principles-economics-3e/pages/2-1-how-individuals-make-choices-based-on-their-budget-constraint)

置換元：humanities-economics-reviewed.json / 10000000-0000-4000-8007-000000000022。原稿関係：revised-concept。

## short-humanities-06｜人文社会科学｜レベル4（仮）

比較優位を判断するのは、相手より低い何の費用？

1. 埋没費用
2. 機会費用
3. 輸送費用
4. 固定費用

正解：機会費用

比較優位は、ある財の生産で諦める他の財等の機会費用が、相手より小さいことです。

- 埋没費用：すでに回収できない費用の大小では定義しません。
- 機会費用：絶対的な生産性とは分けて比較します。
- 輸送費用：貿易の有利さに関わりますが、比較優位の定義ではありません。
- 固定費用：生産量によらない費用の大小では定義しません。

仮難度70：525、b：-0.2805。

出典：[OpenStax Microeconomics 3e 19.1 — Absolute and Comparative Advantage](https://openstax.org/books/principles-microeconomics-3e/pages/19-1-absolute-and-comparative-advantage)

置換元：humanities-economics-reviewed.json / 10000000-0000-4000-8005-000000000009。原稿関係：revised-concept。

## short-humanities-07｜人文社会科学｜レベル5（仮）

集団間の相関を、そのまま個人間にも当てはめる誤りは？

1. 生態学的誤謬
2. 生存者バイアス
3. 測定誤差
4. 出版バイアス

正解：生態学的誤謬

集団単位の関係が、各集団内の個人の関係にも成り立つとは限りません。分析の単位を取り違える誤りです。

- 生態学的誤謬：集計単位と個体単位の取り違えです。
- 生存者バイアス：残った対象に偏る選択の問題です。
- 測定誤差：測定値のずれの問題です。
- 出版バイアス：公表される研究が偏る問題です。

仮難度70：675、b：0.4695。

出典：[Te Grotenhuis et al. — Robinson’s Ecological Correlations: methodological corrections](https://academic.oup.com/ije/article-abstract/40/4/1123/685385)

置換元：humanities-statistics-reviewed.json / humanities-statistics-ecological-fallacy。原稿関係：revised-concept。

## short-humanities-08｜人文社会科学｜レベル5（仮）

デュヘム＝クワイン論題で、理論の検証を共に支える前提は？

1. 多数決
2. 循環論法
3. 権威への訴え
4. 補助仮説

正解：補助仮説

観察予測は理論だけでなく、測定装置等に関する補助仮説にも依存します。予測が外れても、どの前提が誤りかはそれだけでは決まりません。

- 多数決：多数決で観察予測を導くという論題ではありません。
- 循環論法：結論を前提にすることとは異なります。
- 権威への訴え：権威の主張に依存することとは異なります。
- 補助仮説：複数の前提が一緒に試される点に注目します。

仮難度70：675、b：0.4695。

出典：[University of Washington — Experimental Testing: The Rejection of an Hypothesis](https://courses.washington.edu/phil360/Duhem%20Thesis.pdf)

置換元：humanities-statistics-reviewed.json / 10000000-0000-4000-8007-000000000045。原稿関係：revised-concept。

## short-humanities-09｜人文社会科学｜レベル6（仮）

ケルゼンの純粋法学で、法秩序の妥当性の前提となるのは？

1. 一般意志
2. 快楽原理
3. 根本規範
4. 社会契約

正解：根本規範

ケルゼンは、法秩序の妥当性を説明するために根本規範（Grundnorm）を前提とします。

- 一般意志：ルソーの政治思想で重要な概念です。
- 快楽原理：心理学・精神分析の概念との区別が必要です。
- 根本規範：純粋法学の基礎となる概念です。
- 社会契約：社会契約論の考え方との区別が必要です。

仮難度70：825、b：1.2195。

出典：[Cambridge — The Drive towards Substance in Kelsen’s Pure Theory of Law](https://www.cambridge.org/core/books/hans-kelsen-on-constitutional-democracy/drive-towards-substance-in-kelsens-pure-theory-of-law/593367EB78A764E202A3150F8D98FE2F)

置換元：humanities-law-reviewed.json / 10000000-0000-4000-8006-000000000007。原稿関係：revised-concept。

## short-humanities-10｜人文社会科学｜レベル7（仮）

操作変数法のLATEで、単調性が除外する応答型は？

1. never-taker
2. defier
3. complier
4. always-taker

正解：defier

二値の操作変数と処置の標準的設定では、単調性は操作変数に対し逆向きに処置を変えるdefierがいないという条件です。

- never-taker：操作変数によらず処置を受けない型です。
- defier：操作変数への逆向きの応答をする型です。
- complier：操作変数に従って処置を変える型です。
- always-taker：操作変数によらず処置を受ける型です。

仮難度70：925、b：1.7195。

出典：[Imbens and Angrist, Identification and Estimation of Local Average Treatment Effects](https://www.nber.org/papers/t0118)、[Abadie and Cattaneo (2018), Econometric Methods for Program Evaluation, §6.2](https://economics.mit.edu/sites/default/files/publications/ARE-typo-Fig4-corrected.pdf)

置換元：humanities-statistics-reviewed.json / 10000000-0000-4000-8007-000000000050。原稿関係：new-concept。
