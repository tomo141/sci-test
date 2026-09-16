"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { CorrectionEditor } from "./CorrectionEditor";
import { ExperimentTable } from "./ExperimentTable";
import { AppCard } from "@/components/ui/AppCard";
import { scienceApi, type RequestError } from "@/src/lib/science/client";
import type { AdminData } from "@/src/lib/science/admin";
import type { MyaspConnectionCheck } from "@/src/lib/science/myasp";
import type { Content } from "@/src/lib/science/types";
import { knowledgeLevels, scopeLabel } from "@/src/lib/science/knowledge-levels";
const field="mt-2 block min-h-12 w-full rounded-xl border p-3";
function Question({content}:{content:Content}){return <div className="mt-4 text-sm leading-7"><p className="whitespace-pre-wrap font-bold">{content.question}</p><ol className="mt-3 list-decimal pl-6">{content.choices.map((c,i)=><li key={i}>{c}{i===content.correctIndex?"（正解）":""}<p className="text-[var(--color-muted)]">{content.distractorRationales?.[i]}</p></li>)}</ol><p className="mt-3 whitespace-pre-wrap">{content.explanation}</p>{content.sources?.map((s,i)=><p key={i}>{s.url&&/^https?:\/\//.test(s.url)?<a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a>:s.title}</p>)}</div>;}
function Submission({draft,reload}:{draft:AdminData["submissions"][number];reload:()=>Promise<void>}){
  const [reason,setReason]=useState(""),[decision,setDecision]=useState("lab"),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [checks,setChecks]=useState({rights:false,source:false,uniqueAnswer:false,explanation:false});
  const checkLabels={rights:"投稿者の利用許諾と第三者の権利を確認",source:"信頼できる出典と本文の対応を確認",uniqueAnswer:"正解が一つで、選択肢に曖昧さがない",explanation:"解説と各選択肢の根拠が正しい"};
  return <AppCard><p className="text-xs">{draft.domain} · {draft.state} · {draft.id}</p><Question content={draft.content}/>
    {draft.level_reference&&<p className="mt-4 rounded-xl bg-[var(--color-page)] p-4 text-sm leading-7">作問者の見積もり · {scopeLabel(draft)}<br/>{knowledgeLevels(draft).find(l=>l.key===draft.level_reference?.level)?.description??"段階は判断できない"} · 目標正答率70%<br/>自信：{{confident:"ある",uncertain:"少し迷う",unknown:"判断できない"}[draft.level_reference.confidence]}。実測難度や学位の申告とは区別して確認してください。</p>}
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
    <CorrectionEditor revisionId={report.revision_id} original={report.science_items.content} reload={reload}/>
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
      {data.repeats && data.repeats.length > 0 && <AppCard className="mt-6 border-amber-300 bg-amber-50"><div role="alert"><h2 className="text-xl font-black">未見問題の不足による再出題があります</h2><p className="mt-3 text-sm leading-7">ともよしさんの運営アカウントだけに表示しています。再出題も受験スコアに含めています。答えの記憶で高く出る可能性があるため、該当分野の問題追加を検討してください。再出題の回答は問題難度の自動学習から除外します。</p></div><ul className="mt-4 grid gap-3 text-sm">{data.repeats.map(r=><li key={r.attempt_id}><p className="font-bold">{r.domains}：再出題 {r.repeat_count} / 提示済み {r.presented_count}問（{Math.round(100*r.repeat_count/r.presented_count)}%）</p><p className="mt-1 break-all">受験 {r.attempt_id} · {r.kind} · 最大{r.max_presentation_count}回目 · 最終 {new Date(r.last_repeat_at).toLocaleString("ja-JP")}</p></li>)}</ul><p className="mt-3 text-xs">新しい順に最大30受験。一般の受験・結果・共有ページには表示しません。</p></AppCard>}
      <MailConnection/>
      <h2 className="mt-10 text-2xl font-black">自動で見つかった確認候補</h2><p className="mt-3 text-sm leading-7">出題された人のデータ内での傾向です。集団全体の正答率や、誤問の確定ではありません。期限を過ぎた問題は出題対象から外れます。その他の候補は根拠を確認して判断します。</p><div className="mt-5 grid gap-5">{data.quality.map(q=><QualityCard key={q.id} signal={q} reload={load}/>)}{!data.quality.length&&<p>未解決の確認候補はありません。検知を実行した時刻と件数は下の実行履歴で確認できます。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">投稿の審査</h2><p className="mt-3 text-sm leading-7">古い順に最大50件。ここで答えを確認した問題は、あなたの新しい実力測定には出題されません。</p><div className="mt-5 grid gap-5">{data.submissions.map(d=><Submission key={d.id+":"+d.state} draft={d} reload={load}/>)}{!data.submissions.length&&<p>確認待ちの投稿はありません。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">改善報告</h2><div className="mt-5 grid gap-5">{data.feedback.map(f=><Feedback key={f.id} report={f} reload={load}/>)}{!data.feedback.length&&<p>確認待ちの改善報告はありません。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">修正版の確認</h2><div className="mt-5 grid gap-5">{data.corrections.map(c=><CorrectionApproval key={c.id} correction={c} reload={load}/>)}{!data.corrections.length&&<p>確認待ちの修正版はありません。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">保留中の問題</h2><p className="mt-3 text-sm leading-7">最大50件。訂正済みの旧版は表示しません。問題が正しいと確認できた場合は元の公開範囲へ戻せます。修正が必要な場合は、新しい版を別の管理者へ提出します。</p><div className="mt-5 grid gap-5">{data.holds.map(q=><HeldItem key={q.id} item={q} reload={load}/>)}{!data.holds.length&&<p>確認が必要な保留問題はありません。</p>}</div>
      <h2 className="mt-10 text-2xl font-black">自動処理の実行履歴</h2><AppButton className="mt-4" variant="secondary" onClick={async()=>{try{await scienceApi("run_jobs",{},"science-admin");await load();}catch(e){setError((e as RequestError).message);}}}>未処理分を実行・再試行</AppButton><div className="mt-5 grid gap-3">{data.jobs.map(j=><AppCard key={j.id}><p className="font-bold">{j.kind} · {j.state}</p><p className="mt-2 text-xs">開始 {j.started_at} / 完了 {j.finished_at??"未完了"}</p><pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(j.summary,null,2)}</pre></AppCard>)}{!data.jobs.length&&<p>実行記録はまだありません。</p>}</div>
    </>}
  </main>;
}
function MailConnection(){
  const [check,setCheck]=useState<MyaspConnectionCheck|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  return <AppCard className="mt-8"><h2 className="text-xl font-black">案内メールの接続</h2><p className="mt-3 text-sm leading-7">MyASPの全分野科学検定シナリオへの接続と、同期用12項目の設定を確認します。読者情報の更新やメール送信は行いません。確認コードのResend接続と、案内の実受信は別に確認します。</p>
    <AppButton className="mt-4" variant="secondary" disabled={busy} onClick={async()=>{setBusy(true);setError("");setCheck(null);try{setCheck(await scienceApi<MyaspConnectionCheck>("check_mail",{},"science-admin"));}catch(e){setError((e as RequestError).message);}finally{setBusy(false);}}}>{busy?"接続を確認中…":"MyASPの接続を確認"}</AppButton>
    {check&&<div className="mt-4 text-sm leading-7" role="status"><p>{check.state==="connected"?"対象シナリオへの接続を確認しました。":check.state==="not_configured"?"この環境の接続設定が不足しています。":"接続を確認できませんでした。設定とサービスの状態を確認してください。"}</p><p>確認時刻：{new Date(check.observedAt).toLocaleString("ja-JP")}</p><p>受験情報の同期：{check.syncEnabled?"有効":"停止中"} ／ 案内配信の許可：{check.deliveryEnabled?"有効":"停止中"}</p>{check.errorCode&&<p>エラーコード：{check.errorCode}</p>}<p>この確認は、読者の同期・配信条件・実際の到達の成功を示すものではありません。</p></div>}
    {check?.fields && <details className="mt-4"><summary className="cursor-pointer text-sm font-bold">同期用項目の設定を見る</summary>{check.fields.length ? <ul className="mt-3 grid gap-2 text-xs">{check.fields.map(f => <li key={f.key}>{f.key}：{f.label ?? "項目なし"} ／ 形式 {f.type ?? "未取得"} ／ 編集{f.editable ? "可" : "不可"} ／ {f.ready ? "準備済み" : "設定確認が必要"}</li>)}</ul> : <p className="mt-3 text-sm">設定を確認できる有効な読者がまだいません。</p>}</details>}
    {error&&<p role="alert" className="mt-4 text-sm">{error}</p>}
  </AppCard>;
}
function QualityCard({signal:q,reload}:{signal:AdminData["quality"][number];reload:()=>Promise<void>}){
  const labels:Record<string,string>={rare_distractor:"ほぼ選ばれない誤答肢",negative_discrimination:"実力が高い群ほど正答が少ない",unexpected_errors:"予測よりも誤答が多い",report_burst:"7日間に複数人からの報告",evidence_report:"根拠付きの正解・権利の報告",source_expired:"出典の確認期限を超過",source_due:"出典の確認期限が近い",similar_stem:"本文が似ている別の問題族"};
  const [reason,setReason]=useState(""),[hold,setHold]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  return <AppCard><h3 className="font-bold">{q.science_items.domain} · {labels[q.code]??q.code}</h3><p className="mt-2 text-xs">最終検知 {new Date(q.last_observed_at).toLocaleString("ja-JP")} · {q.state==="acknowledged"?"判断記録あり・検知条件は継続":"未確認"}</p><details className="mt-4"><summary>問題・解説・出典</summary><Question content={q.science_items.content}/></details><details className="mt-4"><summary>検知したデータ</summary><pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(q.evidence,null,2)}</pre></details>{q.review_note&&<p className="mt-4 text-sm">前の判断：{q.review_note}</p>}
    <fieldset disabled={busy} className="mt-5"><label className="flex gap-3 text-sm"><input type="checkbox" checked={hold} onChange={e=>setHold(e.target.checked)}/>確認のため、新しい出題から保留する</label><label className="mt-4 block text-sm font-bold">確認した根拠・次の対応<textarea className={field} value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={2000}/></label></fieldset>
    <AppButton className="mt-4" disabled={busy||reason.trim().length<5} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("quality",{id:q.id,reason,hold},"science-admin");await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>確認を記録</AppButton>{error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}
    <CorrectionEditor revisionId={q.revision_id} original={q.science_items.content} reload={reload}/>
  </AppCard>;
}
function CorrectionApproval({correction:c,reload}:{correction:AdminData["corrections"][number];reload:()=>Promise<void>}){
  const [checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[reason,setReason]=useState("");
  return <AppCard><h3 className="font-bold">{c.source.domain} · {c.mode==="exclude"?"全員の旧問題を採点から除外":"解説・出典の更新"}</h3><p className="mt-4 whitespace-pre-wrap">{c.reason}</p><details className="mt-4"><summary>修正前の問題</summary><Question content={c.source.content}/></details><h4 className="mt-5 font-bold">修正版</h4><Question content={c.replacement.content}/>
    {c.canApprove?<><label className="mt-5 flex gap-3"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span>出典・権利、正解の一意性、解説と選択肢の根拠を独立して確認しました。</span></label><AppButton className="mt-4" disabled={!checked||busy} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("approve_correction",{id:c.id,checks:{rights:true,source:true,uniqueAnswer:true,explanation:true}},"science-admin");await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>訂正を確定して、成績の再計算へ</AppButton></>:<p className="mt-5 text-sm">作問または修正版の作成に関わっているため、別の管理者による確認を待っています。</p>}
    <details className="mt-5"><summary>この案を見送る・取り下げる</summary><label className="mt-4 block text-sm font-bold">見送り・取り下げの理由<textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000} rows={3} className={field}/></label><p className="mt-3 text-sm">案と理由を履歴に残します。元の問題が保留中の場合は、保留を維持します。</p><AppButton variant="secondary" className="mt-4" disabled={busy||reason.trim().length<5} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("reject_correction",{id:c.id,reason},"science-admin");await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>この案の見送りを記録</AppButton></details>
    <CorrectionEditor revisionId={c.source.id} original={c.source.content} proposal={{id:c.id,content:c.replacement.content,mode:c.mode,reason:c.reason}} reload={reload}/>
    {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
  </AppCard>;
}
function HeldItem({item:q,reload}:{item:AdminData["holds"][number];reload:()=>Promise<void>}){
  const [reason,setReason]=useState(""),[checked,setChecked]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  return <AppCard><h3 className="font-bold">{q.domain} · 保留中</h3><p className="mt-2 text-xs">保留開始 {q.held_at?new Date(q.held_at).toLocaleString("ja-JP"):"未取得"}</p><Question content={q.content}/>
    {q.canReopen?<fieldset disabled={busy} className="mt-5"><label className="flex gap-3 text-sm"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span>出典・権利、正解の一意性、解説・選択肢を確認し、元の問題のまま出題できると判断しました。</span></label><label className="mt-4 block text-sm font-bold">保留解除の根拠<textarea className={field} value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={2000}/></label><AppButton className="mt-4" disabled={busy||!checked||reason.trim().length<5} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("reopen_item",{revisionId:q.id,reason,checks:{rights:true,source:true,uniqueAnswer:true,explanation:true}},"science-admin");await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>確認を記録し、{q.held_from_status==="lab"?"ラボ":"元の出題対象"}へ戻す</AppButton></fieldset>:<p className="mt-5 text-sm leading-7">{q.pending_correction?"確認待ちの修正版があります。上の修正版の確認欄で対応してください。":!q.held_from_status?"保留前の公開状態を確認できません。公開履歴の確認が必要です。":"自分が作問した問題です。別の管理者の確認が必要です。"}</p>}
    {!q.pending_correction&&<CorrectionEditor revisionId={q.id} original={q.content} reload={reload}/>}{error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
  </AppCard>;
}
