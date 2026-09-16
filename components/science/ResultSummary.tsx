import { isP70, scoreCeiling } from "@/src/lib/science/versions";
import { AppCard } from "@/components/ui/AppCard";
import { domains } from "@/src/lib/data/taxonomy";
import type { AttemptResult } from "@/src/lib/science/types";
import { ScienceMap } from "./ScienceMap";

export function ResultSummary({ result, nickname }: { result: AttemptResult; nickname?: string }) {
  const measured = domains.filter((d) => result.domains[d].score !== null).sort((a,b) => result.domains[b].score! - result.domains[a].score!);
  return <AppCard>
    <p className="text-sm font-bold text-[var(--color-primary-700)]">{nickname ? `${nickname}さんの` : "今回の"}{result.definition.label}</p>
    <h1 className="mt-3 text-3xl font-black">{result.definition.formal ? "あなたの科学マップ" : `${result.correctCount} / ${result.answerCount}問 正解`}</h1>
    {!!result.corrections?.count && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-7">問題の訂正を反映した成績です。{result.corrections.excludedCount ? `${result.originalAnswerCount}問中${result.corrections.excludedCount}問を全員の採点から除外しています。` : "解説を更新しています。"}元の受験記録は保存しています。</p>}
    {!!result.identityAdjustments?.excludedCount&&<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-7">履歴の統合により、以前に見た問題が{result.identityAdjustments.excludedCount}問あると分かりました。回答と正答数は残し、実力スコアの推定材料からは除外しています。この受験は参考参加です。</p>}
    {result.total !== null && <p className="mt-6"><strong className="text-5xl font-black tabular-nums">{result.total}</strong><span className="ml-2">/ {scoreCeiling(result.version)}点</span></p>}
    {result.definition.formal ? <>
      <p className="mt-3 text-sm text-[var(--color-muted)]">参考スコア · {result.answerCount}問完了{result.total !== null && ` · 総合の参考幅 ${result.low}–${result.high}点`}</p>
      <ScienceMap result={result} />
      {isP70(result.version) && <p className="mt-4 text-xs leading-6 text-[var(--color-muted)]">70%基準の参考スコアです。分野点を10倍した値と同じ難易度の問題は、その分野の推定実力では約70%正解する関係です。丸め前・上限処理前のモデル上の対応で、受験全体の正答率ではありません。旧採点版の受験とは分けて比較します。</p>}
      {measured.length>0 && <p className="mt-6 leading-7">今回、最も高く推定されたのは<strong>{measured[0]}</strong>でした。少数の回答では幅が広く、ほかの分野と差があるとはまだ言い切れません。気になる分野を、もう少し掘り下げてみましょう。</p>}
      <p className="mt-4 text-xs leading-6 text-[var(--color-muted)]">4択の知識問題で測った参考推定です。難度や推定幅の検証を進めています。研究力・学位・職務能力を示すものではありません。総合は10分野を同じ重みで合計し、未測定の分野がある場合は総合点を表示しません。</p>
    </> : <p className="mt-4 leading-7">{result.definition.kind === "weekly" ? "みんなと同じ10問に挑戦した記録です。順位は初回の正答数で決まり、同点は同順位です。" : "投稿問題の試し解き、ありがとうございます。気づいたことを伝えて、良問に育てましょう。この回答は正式スコアに加えません。"}</p>}
    <p className="mt-5 text-xs text-[var(--color-muted)]">制作「理系とーく 川村智祥」</p>
  </AppCard>;
}
