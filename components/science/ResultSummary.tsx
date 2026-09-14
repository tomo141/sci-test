import { AppCard } from "@/components/ui/AppCard";
import { domains } from "@/src/lib/data/taxonomy";
import type { AttemptResult } from "@/src/lib/science/types";
import { ScienceMap } from "./ScienceMap";

export function ResultSummary({ result, nickname }: { result: AttemptResult; nickname?: string }) {
  const measured = domains.filter((d) => result.domains[d].score !== null).sort((a,b) => result.domains[b].score! - result.domains[a].score!);
  return <AppCard>
    <p className="text-sm font-bold text-[var(--color-primary-700)]">{nickname ? `${nickname}さんの` : "今回の"}{result.definition.label}</p>
    <h1 className="mt-3 text-3xl font-black">{result.definition.formal ? "あなたの科学マップ" : `${result.correctCount} / ${result.answerCount}問 正解`}</h1>
    {result.total !== null && <p className="mt-6"><strong className="text-5xl font-black tabular-nums">{result.total}</strong><span className="ml-2">/ 1,000点</span></p>}
    {result.definition.formal ? <>
      <p className="mt-3 text-sm text-[var(--color-muted)]">参考スコア · {result.answerCount}問完了{result.total !== null && ` · 総合の参考幅 ${result.low}–${result.high}点`}</p>
      <ScienceMap result={result} />
      {measured.length>0 && <p className="mt-6 leading-7">今回、最も高く推定されたのは<strong>{measured[0]}</strong>でした。少数の回答では幅が広く、ほかの分野と差があるとはまだ言い切れません。気になる分野を、もう少し掘り下げてみましょう。</p>}
      <p className="mt-4 text-xs leading-6 text-[var(--color-muted)]">4択の知識問題で測った参考推定です。難度や推定幅の検証を進めています。研究力・学位・職務能力を示すものではありません。総合は10分野を同じ重みで合計し、未測定の分野がある場合は総合点を表示しません。</p>
    </> : <p className="mt-4 leading-7">{result.definition.kind === "weekly" ? "みんなと同じ10問に挑戦した記録です。順位は初回の正答数で決まり、同点は同順位です。" : "投稿問題の試し解き、ありがとうございます。気づいたことを伝えて、良問に育てましょう。この回答は正式スコアに加えません。"}</p>}
    <p className="mt-5 text-xs text-[var(--color-muted)]">制作「理系とーく 川村智祥」</p>
  </AppCard>;
}
