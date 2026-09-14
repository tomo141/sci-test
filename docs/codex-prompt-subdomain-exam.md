# 【Codex実装依頼】小分野スコア受験の実装

以下をそのままCodexに渡すプロンプトとして使う。

---

## ゴール

理科検定アプリ(Next.js App Router + Supabase)に、既存の「総合スコア受験」「分野スコア受験」に加えて **「小分野スコア受験」** を実装する。10大分野それぞれを10小分野に分割し(計100小分野)、既存のフリーテキスト `subdomain` を解体して新タクソノミーに再割当する。作問(問題バンク拡充)は本タスクのスコープ外。

**必読**: `docs/subdomain-exam-proposal.md` — 確定済みの要件・100小分野タクソノミー草案・旧ラベル→新小分野マッピング表(§5)・migration草案(§3.3)が書いてある。本プロンプトと矛盾したら本プロンプトを優先。

## 現状アーキテクチャ(実装前に必ず読むファイル)

- タクソノミー: `src/lib/data/taxonomy.ts` — `domains`(10大分野), `abilityAxes`(5能力軸)
- 問題型: `src/lib/data/questions.ts` — `Question.subdomain: string`(現状フリーテキスト367種)
- 問題データ: `src/lib/data/knowledgeQuestions*.ts`(計1,340問, 各オブジェクトに `domain`/`subdomain`)
- DB問題マッピング: `src/lib/data/mapDbQuestion.ts`, ロード: `src/lib/data/loadQuestions.ts`
- スコアリング: `src/lib/scoring/` — `config.ts`(パラメータ), `ability.ts`(Eloライク推定。回答ごとに総合/大分野/能力軸を並行更新), `estimate.ts`(回答列→Estimate), `coverage.ts`(`ExamPlan`, `createExamPlan`, `createDomainExamPlan`, 20問サイクル), `domainScore.ts`(内部10–990→カルテ表示1–99変換), `adaptive.ts`(出題選択)
- 受験セッション: `src/lib/exam/session.ts`(`loadOrCreateExamPlan` 等), `config.ts`(20問/サイクル, 10問で速報), `persistEstimates.ts`(proficiency_estimates書込), `persistAnswer.ts`
- DB: `supabase/migrations/0004_exam_modes_and_score_kinds.sql` — `exam_sessions.exam_mode in ('overall','domain')`, `exam_sessions.target_domain`, `score_history.score_kind in ('overall','domain')`, `score_history.domain`
- UI: `app/exam/page.tsx`(受験), `app/result/`(結果), `app/karte/`(カルテ), `app/ranking/page.tsx`, `app/mypage/page.tsx`, リーダーボード: `src/lib/public/leaderboard.ts`
- テスト: vitest(`src/lib/**/*.test.ts`)。`pnpm test` / `pnpm lint` / `pnpm build` が通ること

**直近コミット `d3b4805` で分野受験(20問フロー+分野スコア)が実装済み。小分野受験はこの分野受験の実装パターンを忠実に踏襲すること。** 分野受験のコードを読み、overall/domain の分岐がある箇所すべてに subdomain を加えるイメージ。

## 確定済み要件(インタビュー済み・変更不可)

1. **出題数**: 小分野受験も20問1サイクル(総合・分野と同一。`examConfig` を共用)
2. **スコアレンジ**: 小分野受験の結果スコアは**10–990**(総合スコアと同スケール。分野スコアの1–99とは別スケール、確定済み)。`internalToDomainScore`(1–99変換)は小分野には適用しない。内部推定値(総合・分野と共通の内部レンジ)をそのまま10–990の表示レンジにマップする(`scoringConfig.minScore`/`maxScore` をそのまま使う想定。総合スコアの表示変換ロジックと同じ関数を再利用できないか検討する)
3. **スコア構成ロジック**: 現行の総合↔分野の関係を踏襲。回答ごとに大分野推定と小分野推定を**並行更新**(大分野=小分野の平均ではない)。総合・分野受験の回答も小分野推定に蓄積される
4. **タクソノミー**: `docs/subdomain-exam-proposal.md` §5 の100小分野・マッピング表を採用
5. **既存問題の再割当**: マッピング表をスクリプトで一括適用。表にない/曖昧なラベルは意味が最も近い小分野に割当て、判断に迷ったものは一覧をレポート出力
6. **プール不足対応**: 小分野の問題数が20問未満でも受験は**ブロックしない**。サイクル内で**問題の重複出題を許容**して20問を埋める(選択不可のゲートは設けない)
7. **公開範囲の制御**: コード・DB・UIは**全100小分野をフル実装**する。ただし小分野選択UIでの一覧表示は**公開フラグ**で制御し、作問が進んだ小分野から運用者が順次公開できるようにする(実装方式は下記タスク3参照)
8. **過去回答履歴**: 既存の `answers` / `proficiency_estimates` にある旧subdomainラベル付きレコードは**遡及変換しない**。小分野スコアの集計はリリース後の**新規回答のみ**を対象にする。総合・分野スコアの既存集計ロジック・データには一切手を加えない
9. **UI露出範囲**: (a)受験フロー+結果 (b)カルテに小分野内訳 (c)ランキング対応 (d)マイページ履歴 — すべて実装

## 実装タスク

### 1. タクソノミー定義
- `src/lib/data/taxonomy.ts` に追加:
  - `export const subdomainsByDomain: Record<ScienceDomain, readonly string[]>`(各10件, §5の太字名)
  - `export type ScienceSubdomain`(全100件のユニオン or string型+バリデータ。既存コードの型スタイルに合わせる)
  - `export function isSubdomainOf(domain, subdomain): boolean` 等のガード
- 100小分野の名称は `docs/subdomain-exam-proposal.md` §5 の太字をそのまま使う

### 2. 既存問題の再割当
- `scripts/remap-subdomains.ts`(既存scriptsの書き方に合わせる)を作成:
  - §5のマッピング表を `(domain, 旧subdomain) → 新subdomain` の辞書としてコード化
  - `src/lib/data/knowledgeQuestions*.ts` 全ファイルの `subdomain` を書き換え(コード変換 or 正規表現置換。ファイルのフォーマットを崩さない)
  - マッピング表にないラベルは近い小分野に割当てた上で `docs/subdomain-remap-report.md` に「問題ID / 旧ラベル → 新小分野」を出力
- 実行後、全1,340問の `subdomain` が100小分野のいずれかに正規化されていることをテストで保証(`src/lib/data/questions.test.ts` 系に追加)
- DB側の問題(既存の本番投入パイプライン)も同期が必要: 既存の投入スクリプト(`scripts/` 内)を確認し、DB上の問題の subdomain を更新するSQL/スクリプトを用意する

### 3. DB migration
- `supabase/migrations/0005_subdomain_exam.sql` を作成(`docs/subdomain-exam-proposal.md` §3.3 の草案どおり):
  - `exam_sessions.exam_mode` の check制約を `('overall','domain','subdomain')` に拡張、`target_subdomain text` 追加
  - `score_history.score_kind` の check制約を `('overall','domain','subdomain')` に拡張、`subdomain text` 追加
  - `score_history (score_kind, domain, subdomain, score desc, answer_count desc)` のindex追加
  - 0004の書き方(check制約の付け方・naming)を踏襲。既存制約のdrop→再addの順序に注意
  - **公開フラグ用テーブル**を追加: `public.subdomain_release_status (domain text, subdomain text, is_released boolean not null default false, updated_at timestamptz not null default now(), primary key (domain, subdomain))`。初期データは全100小分野を `is_released=false` で投入する `insert` 文をmigrationに含める(運用者がSupabase上のテーブル編集 or 管理画面から true に切り替えて公開する想定)
- RLS/grants: 0002/0003を確認し、新カラム・新テーブルに追加対応が必要なら含める(`subdomain_release_status` は読み取りは公開、書き込みはservice_role限定などexam_sessions等の既存方針に合わせる)

### 4. スコアリング
- `src/lib/scoring/types.ts` / `ability.ts`: `AbilityState` に `subdomains: Record<string, TrackState>` を追加(キーは `"${domain}/${subdomain}"` 推奨。全100件を初期化するか遅延生成かは既存domains実装に合わせて判断)。`updateAbilityState` で回答の subdomain のトラックも並行更新(大分野・軸と同じK/減衰ロジック)
- `AnswerRecord` に `subdomain` を追加(既存の生成箇所すべてに伝播)
- `estimate.ts`: `Estimate` に小分野スコア・counts・uncertainties を追加。表示変換は要件2で確認したスケールに合わせる
- `blendedAbilityForQuestion`: subdomainモード時の出題選択で小分野トラックを効かせる。config に `subdomainAbilityBlend` を追加し、既存3項(0.35/0.4/0.25)との整合を保つ(subdomain受験時のみ4項ブレンド、overall/domain受験時は現行3項のまま、が最も安全)
- `coverage.ts`: `createSubdomainExamPlan(targetDomain, targetSubdomain, sessionSeed?)` を追加。`ExamPlan` に `mode: 'subdomain'` と `targetSubdomain` を追加。20問すべて対象小分野から出題(`getDomainOrderForBlock`/`getCoverageSlot` の domain分岐を踏襲し、出題候補フィルタを subdomain 一致にする)
- `adaptive.ts`: 候補フィルタに subdomain 条件を追加。**同一小分野の問題のみ**を出題対象とし、他大分野・他小分野へのフォールバックは行わない。同小分野内の未出題問題が尽きた場合は**出題済み問題を再度候補に含めて重複出題を許容**する(ランダム性や難易度バンドのロジックは既存を踏襲しつつ、候補プールが空にならないようにする)。テストで「プール<20問でも20問埋まる」「重複を許すのは同一小分野内の問題のみ」を担保

### 5. 受験フロー
- `src/lib/exam/session.ts`: `loadOrCreateExamPlan` で subdomainプランの永続化/復元(localStorage内のプラン検証。不正な subdomain なら作り直し)
- `app/exam/page.tsx`: 受験開始UIに「小分野受験」を追加。フロー: 大分野選択 → 小分野選択(10件のうち `subdomain_release_status.is_released=true` の小分野のみ表示。未公開は非表示、disabledでの見せ方は不要) → 20問受験(プール不足でも重複ありで成立)。受験中のヘッダ/ナビ表示は分野受験と同様に対象小分野名を表示。グローバルナビ常時表示(コミット `06e66b6` の方針)を維持
- `exam_sessions` への書込: `exam_mode='subdomain'`, `target_domain`, `target_subdomain`
- `persistEstimates.ts`: `proficiency_estimates` に `scope='subdomain'`, `scope_key='${domain}/${subdomain}'` の行を追加(answer_count>0のみ、既存フィルタ踏襲)
- 受験完了時 `score_history` へ `score_kind='subdomain'`, `domain`, `subdomain`, スコア(要件2のスケール)を保存(分野受験の保存処理を踏襲)

### 6. 結果・カルテ・ランキング・マイページ
- **結果画面**(`app/result/`): 小分野受験の結果を分野受験と同フォーマットで表示(スコア、レンジ、正答率、講評)。`feedback.ts`/`explanation.ts` に分野名を出す箇所があれば小分野名に対応
- **カルテ**(`app/karte/`): 各大分野の行を展開すると10小分野のスコア内訳が見える(小分野は10–990表示、大分野の1–99表示とスケールが異なる点をUI上で紛らわしくないようにする。例: 小分野バーは大分野バーとは別の目盛り/ラベルにする)。回答数0の小分野は「—」表示。データ源は `proficiency_estimates` の scope='subdomain'
- **ランキング**(`app/ranking/page.tsx`, `src/lib/public/leaderboard.ts`): score_kind='subdomain' のリーダーボードを追加。UIは 大分野選択→小分野選択 のフィルタで既存の分野ランキングUIを踏襲
- **マイページ**(`app/mypage/page.tsx`): スコア履歴に小分野受験(種別バッジ+「大分野/小分野」名)を表示

### 7. テスト・品質
- 追加/更新するテスト:
  - taxonomy: 100小分野がちょうど10×10であること、名称重複なし
  - remap: 全問題の subdomain が正規小分野に含まれる
  - coverage: `createSubdomainExamPlan` が20問すべて対象小分野を指すこと、プラン復元
  - ability/estimate: 回答で小分野トラックが更新されること、大分野と独立に動くこと
  - adaptive: subdomainフィルタと、プール<20問時の重複出題(他小分野へのフォールバックが発生しないこと)
  - release: `subdomain_release_status` が false の小分野は選択UIに出ないこと
  - scoring表示: 小分野スコアのスケール変換(既存 `domainScore.test.ts` に準拠)
- `pnpm lint && pnpm test && pnpm build` がすべて通ること
- Playwright(`tests/`)に既存の受験フローE2Eがあれば、小分野受験の開始→20問→結果のE2Eを1本追加

## スコープ外(やらないこと)

- 新規問題の作問・投入(別タスク。各小分野30問への拡充は後続バッチで実施)
- 既存の総合・分野受験のスコアロジック変更(小分野トラック追加による回帰がないこと)
- 能力軸(abilityAxes)の変更

## 受け入れ基準

1. 全1,340問の `subdomain` が100小分野に正規化され、レポートが `docs/subdomain-remap-report.md` に出力されている
2. `subdomain_release_status` で公開済みの小分野は、プールが20問未満でも(重複出題ありで)受験開始→20問回答→結果表示(10–990スコア)→`score_history`/`exam_sessions`/`proficiency_estimates` に正しく保存、まで一気通貫で動く
3. 未公開(`is_released=false`)の小分野は選択UIに出ない
4. カルテで大分野→小分野内訳が見え、未回答小分野は「—」
5. ランキングに小分野リーダーボード、マイページ履歴に小分野受験が表示される
6. 総合受験・分野受験の挙動・スコアが変わらない(既存テストがすべてグリーン)。既存の `answers`/`proficiency_estimates` データは変更・移行されない
7. `pnpm lint && pnpm test && pnpm build` 成功
