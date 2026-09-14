"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { ExperimentTable } from "./ExperimentTable";
import { AppCard } from "@/components/ui/AppCard";
import { scienceApi, type RequestError } from "@/src/lib/science/client";
import type { AdminData } from "@/src/lib/science/admin";
import type { Content } from "@/src/lib/science/types";
const field="mt-2 block min-h-12 w-full rounded-xl border p-3";
function Question({content}:{content:Content}){return <div className="mt-4 text-sm leading-7"><p className="whitespace-pre-wrap font-bold">{content.question}</p><ol className="mt-3 list-decimal pl-6">{content.choices.map((c,i)=><li key={i}>{c}{i===content.correctIndex?"（正解）":""}<p className="text-[var(--color-muted)]">{content.distractorRationales?.[i]}</p></li>)}</ol><p className="mt-3 whitespace-pre-wrap">{content.explanation}</p>{content.sources?.map((s,i)=><p key={i}>{s.url&&/^https?:\/\//.test(s.url)?<a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a>:s.title}</p>)}</div>;}
function Submission({draft,reload}:{draft:AdminData["submissions"][number];reload:()=>Promise<void>}){
  const [reason,setReason]=useState(""),[decision,setDecision]=useState("lab"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [checks,setChecks]=useState({rights:false,source:false,uniqueAnswer:false,explanation:false});
  const checkLabels={rights:"投稿者の利用許諾と第三者の権利を確認",source:"信頼できる出典と本文の対応を確認",uniqueAnswer:"正解が一つで、選択肢に曖昧さがない",explanation:"解説と各選択肢の根拠が正しい"};
  return <AppCard><p className="text-xs">{draft.domain} · {draft.state} · {draft.id}</p><Question content={draft.content}/>
    <fieldset disabled={busy} className="mt-5">{(Object.keys(checks) as (keyof typeof checks)[]).map(key=><label key={key} className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={checks[key]} onChange={e=>setChecks({...checks,[key]:e.target.checked})}/>{checkLabels[key]}</label>)}
    <label className="mt-5 block text-sm font-bold">判断<select className={field} value={decision} onChange={e=>setDecision(e.target.value)}><option value="lab">ラボで公開</option><option value="adopted">正式問題への採用候補にする</option><option value="changes_requested">修正を依頼</option><option value="rejected">見送る</option></select></label>
    <label className="mt-5 block text-sm font-bold">根拠・作者への説明<textarea className={field} value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000} rows={3}/></label></fieldset>
    <p className="mt-3 text-xs leading-6">正式試験への出題は、次の問題バンク公開時に行います。自分の作問を自分で採用することはできません。</p>
    {error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}
    <AppButton className="mt-4" disabled={busy||reason.trim().length<5||(["lab","adopted"].includes(decision)&&Object.values(checks).some(v=>!v))} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("submission",{draftId:draft.id,decision,reason,checks},"science-admin");await reload();}catch(e){setError((e as RequestError).message);}finally{setBusy(false);}}}>審査を記録</AppButton>
  </AppCard>;
}
function Feedback({report,reload}:{report:AdminData["feedback"][number];reload:()=>Promise<void>}){
  const [reason,setReason]=useState(""),[state,setState]=useState("accepted"),[quality,setQuality]=useState("none"),[hold,setHold]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  return <AppCard><p className="text-xs">{report.category} · {report.created_at}</p><Question content={report.science_items.content}/><blockquote className="mt-4 whitespace-pre-wrap rounded-xl bg-[var(--color-page)] p-4">{report.body}<p className="mt-3">{report.evidence}</p></blockquote>
    <fieldset disabled={busy} className="mt-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">報告への判断<select className={field} value={state} onChange={e=>{setState(e.target.value);setQuality("none");}}><option value="accepted">採用</option><option value="rejected">不採用</option></select></label><label className="text-sm font-bold">報告の品質評価<select className={field} value={quality} onChange={e=>setQuality(e.target.value)}><option value="none">信頼スコアは変更しない</option>{state==="accepted"?<option value="positive">根拠のある良質な報告</option>:<option value="negative">意図的な虚偽・繰り返す不適切な報告</option>}</select></label></div>
    <label className="mt-4 flex gap-3 text-sm"><input type="checkbox" checked={hold} onChange={e=>setHold(e.target.checked)}/>この問題を新しい出題から保留する</label><label className="mt-4 block text-sm font-bold">判断根拠<textarea className={field} value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={2000}/></label></fieldset>
    <p className="mt-3 text-xs leading-6">単なる勘違いや不採用だけでは信頼スコアを下げません。問題の保留は過去の回答・結果を書き換えません。</p>
    {error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}
    <AppButton className="mt-4" disabled={busy||reason.trim().length<5} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("feedback",{id:report.id,state,quality,hold,reason},"science-admin");await reload();}catch(e){setError((e as RequestError).message);}finally{setBusy(false);}}}>判断を記録</AppButton>
  </AppCard>;
}
export function AdminClient(){
  const [data,setData]=useState<AdminData|null>(null),[error,setError]=useState("");
  const load=useCallback(async()=>{setError("");try{setData(await scienceApi<AdminData>("list",{},"science-admin"));}catch(e){setError((e as RequestError).message);}},[]);
  useEffect(()=>{void load();},[load]);
  return <main className="page-container max-w-6xl py-10"><Link href="/" className="text-sm underline">全分野科学検定</Link><h1 className="mt-6 text-3xl font-black">運営と改善</h1>
    {error&&<AppCard className="mt-5"><p role="alert">{error}</p><div className="mt-4 flex gap-3"><AppButton onClick={()=>void load()}>再読み込み</AppButton><AppButton href="/login?next=%2Fadmin" variant="secondary">ログイン</AppButton></div></AppCard>}
    {data&&<><p className="mt-4 text-sm">実DBの全期間の件数。取得時刻 {new Date(data.observedAt).toLocaleString("ja-JP")}</p><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.metrics.map(m=><AppCard key={m.label}><h2 className="text-sm">{m.label}</h2><p className="mt-3 text-3xl font-black">{m.value}</p></AppCard>)}</div>
      <ExperimentTable experiment={data.experiment}/>
      <h2 className="mt-10 text-2xl font-black">投稿の審査</h2><p className="mt-3 text-sm leading-7">古い順に最大50件。ここで答えを確認した問題は、あなたの新しい実力測定には出題されません。</p><div className="mt-5 grid gap-5">{data.submissions.map(d=><Submission key={d.id+":"+d.state} draft={d} reload={load}/>)}{!data.submissions.length&&<p>確認待ちの投稿はありません。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">改善報告</h2><div className="mt-5 grid gap-5">{data.feedback.map(f=><Feedback key={f.id} report={f} reload={load}/>)}{!data.feedback.length&&<p>確認待ちの改善報告はありません。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">自動処理の実行履歴</h2><AppButton className="mt-4" variant="secondary" onClick={async()=>{try{await scienceApi("run_jobs",{},"science-admin");await load();}catch(e){setError((e as RequestError).message);}}}>未処理分を実行・再試行</AppButton><div className="mt-5 grid gap-3">{data.jobs.map(j=><AppCard key={j.id}><p className="font-bold">{j.kind} · {j.state}</p><p className="mt-2 text-xs">開始 {j.started_at} / 完了 {j.finished_at??"未完了"}</p><pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(j.summary,null,2)}</pre></AppCard>)}{!data.jobs.length&&<p>実行記録はまだありません。</p>}</div>
    </>}
  </main>;
}
