"use client";
import Link from "next/link";
import { useCallback,useEffect,useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { scienceApi, type RequestError } from "@/src/lib/science/client";
import type { Content } from "@/src/lib/science/types";
type Card={revision_id:string;attempt_id:string;ordinal:number;domain:string;content:Content;correction?:string|null;bookmarked:boolean;total:number};
function ReviewCard({card,reload}:{card:Card;reload:()=>Promise<void>}){
  const [answer,setAnswer]=useState<number|null>(null),[revealed,setRevealed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [operation,setOperation]=useState<string|null>(null),[remembered,setRemembered]=useState<boolean|null>(null);
  async function mark(value:boolean){setBusy(true);setError("");const op=operation??crypto.randomUUID(),choice=remembered??value;setOperation(op);setRemembered(choice);try{await scienceApi("mark_review",{revisionId:card.revision_id,remembered:choice,operationId:op});await reload();}catch(e){setError((e as RequestError).message);}finally{setBusy(false);}}
  return <AppCard><p className="text-xs font-bold">{card.domain}</p><h2 className="mt-3 whitespace-pre-wrap text-xl font-bold leading-8">{card.content.question}</h2><fieldset disabled={revealed} className="mt-5 grid gap-3"><legend className="sr-only">答えを選ぶ</legend>{card.content.choices.map((c,i)=><label key={i} className="flex gap-3 rounded-xl border p-3"><input type="radio" name={card.revision_id} checked={answer===i} onChange={()=>setAnswer(i)}/><span>{c}</span></label>)}</fieldset>
    {card.correction&&<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm whitespace-pre-wrap">訂正後の問題で復習しています。{card.correction}</p>}
    {!revealed?<AppButton className="mt-5" variant="secondary" onClick={()=>setRevealed(true)}>解説を確認する</AppButton>:<><p className="mt-5 font-bold">{answer===null?"正解を確認":answer===card.content.correctIndex?"正解！":"もう一度、覚えておこう"}：{card.content.choices[card.content.correctIndex]}</p><p className="mt-4 whitespace-pre-wrap leading-8">{card.content.explanation}</p><div className="mt-3 text-sm">{card.content.sources.map((s,i)=><p key={i}>{s.url&&/^https?:\/\//.test(s.url)?<a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a>:s.title}</p>)}</div><div className="mt-5 flex flex-wrap gap-3"><AppButton disabled={busy} onClick={()=>void mark(true)}>{operation?"保存を再確認する":"理解できた"}</AppButton>{!operation&&<AppButton disabled={busy} variant="secondary" onClick={()=>void mark(false)}>明日もう一度</AppButton>}</div></>}
    <div className="mt-5 flex flex-wrap gap-5 text-sm"><Link href={`/result?attempt=${card.attempt_id}`} className="underline">受験記録・改善報告へ</Link><button className="underline" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{await scienceApi("bookmark",{attemptId:card.attempt_id,revisionId:card.revision_id,enabled:!card.bookmarked});await reload();}catch(e){setError((e as RequestError).message);}finally{setBusy(false);}}}>{card.bookmarked?"ブックマークを外す":"ブックマークする"}</button></div>{error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
  </AppCard>;
}
export function ReviewClient(){
  const [mode,setMode]=useState<"mistakes"|"bookmarks">("mistakes"),[page,setPage]=useState(0),[cards,setCards]=useState<Card[]|null>(null),[error,setError]=useState<RequestError|null>(null);
  const load=useCallback(async()=>{setError(null);try{const d=await scienceApi<{rows:Card[]}>("review_collection",{mode,page});setCards(d.rows);}catch(e){setError(e as RequestError);}},[mode,page]);
  useEffect(()=>{setCards(null);void load();},[load]);
  return <main className="page-container max-w-4xl py-10"><Link href="/mypage" className="text-sm underline">マイページへ</Link><h1 className="mt-6 text-3xl font-black">科学を、5問ずつ復習。</h1><p className="mt-5 leading-8">間違えた問題と、残しておきたい問い。解説と出典を確かめ、少しずつ自分の知識に。復習の正誤は実力スコアへ加えません。</p><div className="mt-6 flex gap-3">{(["mistakes","bookmarks"] as const).map(m=><AppButton key={m} variant={mode===m?"primary":"secondary"} onClick={()=>{setMode(m);setPage(0);}}>{m==="mistakes"?"間違いから復習":"ブックマーク"}</AppButton>)}</div>
    {error&&<div role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">{error.message}{error.code==="registration_required"?<AppButton className="mt-4" href="/login?next=%2Ftraining">ログインして復習</AppButton>:<AppButton className="mt-4" onClick={()=>void load()}>再読み込み</AppButton>}</div>}
    <div className="mt-6 grid gap-6">{cards?.map(c=><ReviewCard key={c.revision_id} card={c} reload={load}/>)}{cards&&!cards.length&&<AppCard><p>{mode==="mistakes"?"いま復習待ちの問題はありません。理解した問題は、数日あけてまた登場します。":"保存した問題はまだありません。受験結果からブックマークできます。"}</p><AppButton className="mt-4" href="/exam">次の受験へ</AppButton></AppCard>}</div>
    <div className="mt-6 flex gap-3">{page>0&&<AppButton variant="secondary" onClick={()=>setPage(page-1)}>前の5問</AppButton>}{cards&&Number(cards[0]?.total??0)>(page+1)*5&&<AppButton variant="secondary" onClick={()=>setPage(page+1)}>次の5問</AppButton>}</div>
  </main>;
}
