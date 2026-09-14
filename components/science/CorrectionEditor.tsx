"use client";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { scienceApi } from "@/src/lib/science/client";
import type { Content } from "@/src/lib/science/types";
const field="mt-2 block w-full rounded-xl border p-3";
export function CorrectionEditor({revisionId,original,reload,proposal}:{revisionId:string;original:Content;reload:()=>Promise<void>;proposal?:{id:string;content:Content;mode:"exclude"|"explanation";reason:string}}){
  const [open,setOpen]=useState(false),[content,setContent]=useState<Content>(structuredClone(proposal?.content??original)),[mode,setMode]=useState(proposal?.mode??"exclude"),[reason,setReason]=useState(proposal?.reason??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  if(!open)return <AppButton className="mt-4" variant="secondary" onClick={()=>setOpen(true)}>{proposal?"修正して再提出する":"この問題の修正版を用意する"}</AppButton>;
  return <div className="mt-6 border-t pt-5"><h3 className="text-xl font-bold">修正版をつくる</h3><p className="mt-3 text-sm leading-7">元の問題・回答は保存します。別の管理者が確認すると、新しい出題から旧問題を外し、影響する成績を訂正します。新版は次の問題バンクへ加える候補になります。</p>
    {proposal&&<p className="mt-3 text-sm leading-7">提出済みの案は履歴に残し、新しい版として再提出します。変更した人とは別の管理者が確認します。</p>}
    <fieldset disabled={busy} className="mt-4 grid gap-4"><label>訂正の範囲<select value={mode} className={field} onChange={e=>{const next=e.target.value as "exclude"|"explanation";setMode(next);if(next==="explanation")setContent({...content,question:original.question,choices:[...original.choices],correctIndex:original.correctIndex});}}><option value="exclude">正誤に影響する訂正（旧問題は全員の採点から除外）</option><option value="explanation">解説・出典だけの訂正（点数は維持）</option></select></label>
      <label>訂正理由<textarea value={reason} onChange={e=>setReason(e.target.value)} className={field} rows={3} maxLength={2000}/></label>
      <label>問題文<textarea value={content.question} onChange={e=>setContent({...content,question:e.target.value})} disabled={mode==="explanation"} className={field} rows={3}/></label>
      <div className="grid gap-3 sm:grid-cols-2">{content.choices.map((c,i)=><div key={i} className="rounded-xl border p-3"><label className="flex gap-2"><input type="radio" name={`correction-${revisionId}`} checked={content.correctIndex===i} disabled={mode==="explanation"} onChange={()=>setContent({...content,correctIndex:i})}/>選択肢{i+1}を正解にする</label><label className="mt-3 block">選択肢<input className={field} value={c} disabled={mode==="explanation"} onChange={e=>setContent({...content,choices:content.choices.map((v,j)=>i===j?e.target.value:v)})}/></label><label className="mt-3 block">正しい・誤っている根拠<textarea className={field} rows={2} value={content.distractorRationales?.[i]??""} onChange={e=>setContent({...content,distractorRationales:Array.from({length:4},(_,j)=>i===j?e.target.value:content.distractorRationales?.[j]??"")})}/></label></div>)}</div>
      <label>解説<textarea value={content.explanation} className={field} rows={4} onChange={e=>setContent({...content,explanation:e.target.value})}/></label>
      {(content.sources.length?content.sources:[{title:"",url:""}]).map((s,i)=><div key={i} className="grid gap-3 sm:grid-cols-2"><label>出典の名称<input className={field} value={s.title} onChange={e=>setContent({...content,sources:content.sources.length?content.sources.map((v,j)=>i===j?{...v,title:e.target.value}:v):[{title:e.target.value,url:""}]})}/></label><label>出典URL<input type="url" className={field} value={s.url??""} onChange={e=>setContent({...content,sources:content.sources.length?content.sources.map((v,j)=>i===j?{...v,url:e.target.value}:v):[{title:"",url:e.target.value}]})}/></label></div>)}
    </fieldset>
    {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
    <div className="mt-4 flex gap-3"><AppButton disabled={busy||reason.trim().length<5} onClick={async()=>{setBusy(true);setError("");try{await scienceApi(proposal?"revise_correction":"propose_correction",{...(proposal?{id:proposal.id}:{revisionId}),content,mode,reason},"science-admin");setOpen(false);await reload();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>別の管理者へ確認を依頼</AppButton><AppButton disabled={busy} variant="ghost" onClick={()=>setOpen(false)}>閉じる</AppButton></div>
  </div>;
}
