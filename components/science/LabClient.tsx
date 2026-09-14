"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { domains, subdomainsByDomain, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { scienceApi, type RequestError } from "@/src/lib/science/client";
import type { CommunityData, Draft } from "@/src/lib/science/community";

const states:Record<string,string>={draft:"下書き",submitted:"確認待ち",changes_requested:"修正のお願い",lab:"ラボで出題中",adopted:"正式問題に採用",rejected:"見送り"};
const inputClass="mt-2 block min-h-12 w-full rounded-xl border border-[var(--color-border-strong)] bg-white p-3 font-normal";
function emptyDraft():Draft{return {id:crypto.randomUUID(),revision:0,domain:"数学",subdomain:"数と代数",content:{question:"",choices:["","","",""],correctIndex:0,explanation:"",distractorRationales:["","","",""],sources:[{title:"",url:""}]},state:"draft",review_note:null,revision_id:null,updated_at:new Date().toISOString(),author_credit:"",ai_assisted:false};}

export function LabClient(){
  const [data,setData]=useState<CommunityData|null>(null),[draft,setDraft]=useState<Draft|null>(null);
  const [error,setError]=useState(""),[note,setNote]=useState(""),[busy,setBusy]=useState(false);
  const [rights,setRights]=useState(false),[guardian,setGuardian]=useState(false);
  const load=useCallback(async()=>{setError("");try{setData(await scienceApi<CommunityData>("list",{},"science-community"));}catch(e){setError((e as RequestError).message);}},[]);
  useEffect(()=>{void load();},[load]);
  const editable=!!draft&&["draft","changes_requested"].includes(draft.state);
  function changeContent(patch:Partial<Draft["content"]>){if(draft){setDraft({...draft,content:{...draft.content,...patch}});setNote("");}}
  function open(d:Draft){setDraft(structuredClone(d));setRights(false);setGuardian(false);setNote("");setError("");}
  async function save(submit=false){
    if(!draft)return;setBusy(true);setError("");setNote("");
    try{
      const saved=await scienceApi<{id:string;revision:number}>("save",{id:draft.id,revision:draft.revision,domain:draft.domain,subdomain:draft.subdomain,content:draft.content,creditName:draft.author_credit,aiAssisted:draft.ai_assisted},"science-community");
      setDraft({...draft,revision:saved.revision});
      if(submit){await scienceApi("submit",{id:saved.id,revision:saved.revision,licenseVersion:data?.licenseVersion,rights,adultOrGuardianConsent:guardian},"science-community");setDraft(null);setNote("投稿しました。運営の確認後にラボへ登場します。");}
      else setNote("下書きを保存しました。");
      await load();
    }catch(e){setError((e as RequestError).message);}finally{setBusy(false);}
  }
  return <main className="page-container max-w-5xl py-10">
    <Link href="/" className="text-sm font-bold text-[var(--color-primary-700)]">全分野科学検定</Link>
    <p className="mt-8 text-sm font-bold text-[var(--color-primary-700)]">解く人も、つくる人も、研究仲間。</p>
    <h1 className="mt-3 text-3xl font-black md:text-5xl">みんなの出題ラボ</h1>
    <p className="mt-5 max-w-3xl leading-8">とっておきの科学を、ひとつの問いに。投稿された問題を解いて、気づきを返して、次の良問を一緒につくりましょう。</p>
    <div className="mt-7 flex flex-wrap gap-3"><AppButton href="/exam?kind=lab">みんなの問題を10問解く</AppButton>{data?.signedIn?<AppButton variant="secondary" onClick={()=>open(emptyDraft())}>問題をつくる</AppButton>:<AppButton variant="secondary" href="/signup?next=%2Flab">無料登録して作問する</AppButton>}</div>
    {data&&<p className="mt-4 text-sm text-[var(--color-muted)]">現在、公開中の投稿問題は{data.questionCount}問。ラボの成績は実力スコアと本試験ランキングには加えません。</p>}
    {error&&<div role="alert" className="mt-5 rounded-xl bg-amber-50 p-4">{error}<button className="ml-4 underline" onClick={()=>void load()}>一覧を再読み込み</button></div>}
    {note&&<p role="status" className="mt-5 rounded-xl bg-green-50 p-4">{note}</p>}
    {data&&!data.open&&<p className="mt-6 rounded-xl border bg-white p-4 text-sm leading-7">投稿受付の開始を準備しています。登録すると下書きを保存できます。受付条件が整い次第、このページから投稿できるようになります。</p>}
    {draft&&<AppCard className="mt-8"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{states[draft.state]} · あなたの科学の問い</h2><button onClick={()=>setDraft(null)} className="shrink-0 underline">閉じる</button></div>
      {draft.review_note&&<p className="mt-4 rounded-xl bg-amber-50 p-4 whitespace-pre-wrap">運営から：{draft.review_note}</p>}
      <fieldset disabled={!editable||busy} className="mt-6 grid gap-5">
        <label className="font-bold">表示する作者名（空欄は匿名）<input value={draft.author_credit} maxLength={30} className={inputClass} onChange={e=>setDraft({...draft,author_credit:e.target.value})}/></label><label className="flex gap-3"><input type="checkbox" checked={draft.ai_assisted} onChange={e=>setDraft({...draft,ai_assisted:e.target.checked})}/>作問にAIの補助を使用しました</label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="font-bold">大分野<select value={draft.domain} className={inputClass} onChange={e=>{const domain=e.target.value as ScienceDomain;setDraft({...draft,domain,subdomain:subdomainsByDomain[domain][0]});}}>{domains.map(d=><option key={d}>{d}</option>)}</select></label><label className="font-bold">小分野<select value={draft.subdomain} className={inputClass} onChange={e=>setDraft({...draft,subdomain:e.target.value})}>{subdomainsByDomain[draft.domain].map(d=><option key={d}>{d}</option>)}</select></label></div>
        <label className="font-bold">問題文<textarea value={draft.content.question} maxLength={2000} rows={4} className={inputClass} onChange={e=>changeContent({question:e.target.value})}/></label>
        <div><p className="font-bold">4つの選択肢と、それぞれの根拠</p><p className="mt-1 text-sm leading-7">正解はひとつ。誤った選択肢がなぜ違うのかも書くと、良い問題になります。</p><div className="mt-3 grid gap-4 sm:grid-cols-2">{draft.content.choices.map((choice,i)=><div key={i} className="rounded-xl border p-4"><label className="flex items-center gap-2 text-sm font-bold"><input type="radio" name="correct" checked={draft.content.correctIndex===i} onChange={()=>changeContent({correctIndex:i})}/>選択肢{i+1}を正解にする</label><label className="mt-3 block text-sm">選択肢{i+1}<input value={choice} maxLength={500} className={inputClass} onChange={e=>changeContent({choices:draft.content.choices.map((c,j)=>j===i?e.target.value:c)})}/></label><label className="mt-3 block text-sm">正しい・誤っている根拠<textarea rows={2} value={draft.content.distractorRationales[i]} maxLength={1000} className={inputClass} onChange={e=>changeContent({distractorRationales:draft.content.distractorRationales.map((c,j)=>j===i?e.target.value:c)})}/></label></div>)}</div></div>
        <label className="font-bold">解説<textarea value={draft.content.explanation} maxLength={4000} rows={5} className={inputClass} onChange={e=>changeContent({explanation:e.target.value})}/></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="font-bold">出典の名称<input value={draft.content.sources[0]?.title??""} maxLength={300} className={inputClass} onChange={e=>changeContent({sources:[{title:e.target.value,url:draft.content.sources[0]?.url??""}]})}/></label><label className="font-bold">出典のURL<input type="url" value={draft.content.sources[0]?.url??""} className={inputClass} onChange={e=>changeContent({sources:[{title:draft.content.sources[0]?.title??"",url:e.target.value}]})}/></label></div>
      </fieldset>
      {editable&&<><AppButton className="mt-6" variant="secondary" disabled={busy} onClick={()=>void save()}>下書きを保存</AppButton>
        {data?.open&&data.licenseVersion&&<div className="mt-6 rounded-xl bg-[var(--color-page)] p-5"><p className="text-sm leading-7">著作権はあなたに残ります。<Link href="/contribution-terms" target="_blank" className="underline">投稿規約</Link>に基づき、理系とーくが公開・改善・商用提供することを許可して投稿します。</p><label className="mt-4 flex gap-3"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/><span>投稿規約を確認し、この内容を投稿・利用許諾できる権利を持っていることを確認しました。</span></label><label className="mt-4 flex gap-3"><input type="checkbox" checked={guardian} onChange={e=>setGuardian(e.target.checked)}/><span>18歳以上、または保護者の同意を得ています。</span></label><AppButton className="mt-5" disabled={busy||!rights||!guardian} onClick={()=>void save(true)}>{busy?"保存中…":"確認を依頼して投稿する"}</AppButton></div>}
      </>}
    </AppCard>}
    {data?.signedIn&&<><h2 className="mt-12 text-2xl font-black">あなたの作問ノート</h2><div className="mt-5 grid gap-3">{data.drafts.map(d=><button key={d.id} onClick={()=>open(d)} className="rounded-xl border bg-white p-5 text-left hover:border-[var(--color-primary-700)]"><span className="text-xs font-bold text-[var(--color-primary-700)]">{states[d.state]} · {d.domain}</span><p className="mt-2 font-bold">{d.content.question||"まだ題名のない問い"}</p></button>)}{!data.drafts.length&&<p className="text-[var(--color-muted)]">あなたの最初の問いをお待ちしています。</p>}</div>
      <h2 className="mt-12 text-2xl font-black">良問づくりの実績</h2><p className="mt-4 text-sm leading-7">別の人が確認した作問・改善報告を主に評価します。信頼スコアは分野ごとに50から始まり、確認済みの根拠が増えるほど出題の重みに反映します。数だけを増やしても上がりません。</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{data.trust.map(({domain,score})=><AppCard key={domain}><p className="text-sm font-bold">{domain}</p><p className="mt-3 text-2xl font-black">{score.score}<span className="ml-2 text-xs font-normal">/ 100</span></p><p className="mt-2 text-xs">独立した確認 {score.count}件</p></AppCard>)}</div></>}
    <AppCard className="mt-12"><h2 className="text-xl font-black">一緒に育てる、科学の問題バンク</h2><p className="mt-4 leading-8">投稿 → 出典・権利・正解の確認 → ラボで出題 → 回答と改善報告の検証 → 正式問題へ。作者本人や、すでに答えを見た人の回答は、新しい実力の測定には使いません。</p><p className="mt-3 text-sm leading-7">良質な改善報告、ラボの参加、採用された作問を記録します。理系とーくバーで「解こう＆作問しようBar」などの企画も予定しています。開催日は決まり次第ご案内します。</p></AppCard>
    <p className="mt-10 text-sm text-[var(--color-muted)]">制作「理系とーく 川村智祥」</p>
  </main>;
}
