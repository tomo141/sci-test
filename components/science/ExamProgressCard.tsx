import { AppCard } from "@/components/ui/AppCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ExamState } from "@/src/lib/science/types";

export function ExamProgressCard({ state }: { state: ExamState }) {
  const { attempt, progress } = state;
  const percent = Math.round(100 * attempt.ordinal / attempt.definition.count);
  const score = progress?.score;
  return <AppCard className="mb-6 grid gap-5 md:grid-cols-3">
    <div><p className="mb-3 text-sm font-bold text-[var(--color-ink-soft)]">進捗</p><ProgressBar value={percent} />
      <p className="mt-2 text-sm font-bold">{attempt.ordinal} / {attempt.definition.count}問 保存済み <span className="ml-2 text-[var(--color-muted)]">{percent}%</span></p>
    </div>
    <div><p className="text-sm font-bold text-[var(--color-ink-soft)]">正答数 / 回答数（正答率）</p>
      <p className="mt-3 text-2xl font-black">{progress ? `${progress.correctCount} / ${progress.answerCount}` : "確認中"}
        {progress && progress.answerCount > 0 && <span className="ml-2 text-base">（{Math.round(100 * progress.correctCount / progress.answerCount)}%）</span>}
      </p>
    </div>
    {attempt.definition.formal ? <div aria-live="polite"><p className="text-sm font-bold text-[var(--color-ink-soft)]">{attempt.definition.kind === "domain" ? "推定分野スコア" : "推定総合スコア"}（暫定）</p>
      {score ? <><p className="mt-2 text-3xl font-black text-[var(--color-primary-800)]">{score.value}<span className="ml-2 text-sm font-bold">/ {score.scale === "domain" ? 99 : 990}</span></p>
        <p className="mt-1 text-sm">推定幅 {score.low}〜{score.high}</p>
        <p className="mt-2 text-xs leading-6 text-[var(--color-muted)]">今回の回答から推定。{score.unmeasuredDomains > 0 ? `未測定の${score.unmeasuredDomains}分野は仮推定を含みます。` : "回答が増えると更新されます。"}</p>
      </> : <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{attempt.ordinal === 0 ? "1問目の回答後から表示します。" : progress ? "採点対象の回答が揃うと表示します。" : "スコアを確認できません。再読み込みで確認できます。"}</p>}
    </div> : <div><p className="text-sm font-bold text-[var(--color-ink-soft)]">一問ずつ、科学を楽しもう</p><p className="mt-3 text-sm leading-7">{attempt.definition.kind === "weekly" ? "今週の10問は正答数で競います。" : "ラボでは解いて、良問づくりに参加できます。"}</p></div>}
  </AppCard>;
}
