"use client";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { scienceApi } from "@/src/lib/science/client";
import { experienceQuestions, experienceLabel, type ExperiencePage } from "@/src/lib/science/experience-survey";

export function ExperienceSurveyAdmin() {
  const [data, setData] = useState<ExperiencePage | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function load(page: number) { setBusy(true); setError(""); try { setData(await scienceApi<ExperiencePage>("experiences", { page }, "science-admin")); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  return <AppCard className="mt-6"><h2 className="text-xl font-black">受験後のアンケート</h2><p className="mt-3 text-sm leading-7">腕試し・総合本試験の感想を新しい順に20件ずつ表示します。回答した人の感想であり、受験者全体の評価とは限りません。問題の難度や点数へ自動反映しません。</p>
    <AppButton className="mt-4" variant="secondary" disabled={busy} onClick={() => void load(0)}>{busy ? "確認しています…" : "アンケートを確認"}</AppButton>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    {data && <div className="mt-5 grid gap-4">{!data.rows.length && <p>このページに回答はありません。</p>}{data.rows.map(row => <section key={row.id} className="rounded-xl border p-4 text-sm leading-7">
      <h3 className="font-bold">{row.context.kind === "trial" ? "腕試し" : "総合本試験"} · {row.context.questionCount}問 · {new Date(row.submittedAt).toLocaleString("ja-JP")}</h3>
      <p>正解 {row.context.correctCount} / {row.context.answerCount}問 · スコア {row.context.score ?? "未取得"}（推定幅 {row.context.low ?? "未取得"}〜{row.context.high ?? "未取得"}）</p>
      <ul className="mt-2">{experienceQuestions.map(q => <li key={q.key}>{q.label}：{experienceLabel(q.key, row.response[q.key])}</li>)}</ul>
      {row.response.comment && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--color-page)] p-3">{row.response.comment}</p>}
      <details className="mt-3"><summary>比較するときの条件</summary><p className="break-all">出題方針：{row.context.selectionPolicy}<br />受験版：{row.context.definitionVersion}<br />問題バンク：{row.context.releaseId ?? "未取得"}<br />採点版：{row.context.modelVersion}<br />アンケート版：{row.response.version}</p></details>
    </section>)}<div className="flex gap-3"><AppButton variant="ghost" disabled={busy || data.page === 0} onClick={() => void load(data.page - 1)}>前の20件</AppButton><AppButton variant="ghost" disabled={busy || !data.hasMore} onClick={() => void load(data.page + 1)}>次の20件</AppButton></div></div>}
  </AppCard>;
}
