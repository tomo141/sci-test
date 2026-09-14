"use client";
import { useEffect, useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { nextKind } from "@/src/lib/science/definition";
import { RequestError, scienceApi } from "@/src/lib/science/client";
import type { Content, ExamState, PublicAttempt } from "@/src/lib/science/types";
import { ResultVersionHistory } from "./ResultVersionHistory";
import type { RevisionUpdate } from "@/src/lib/science/corrections";
import { ResultSummary } from "./ResultSummary";
import { shareCopy } from "@/src/lib/science/share-copy";

type Review = { attempt: PublicAttempt; rows: { ordinal: number; revisionId: string; domain: string; content: Content; selectedIndex: number; correct: boolean; creditName?:string; update?:RevisionUpdate|null }[] };

export function ResultClient({ attemptId }: { attemptId: string }) {
  const [state,setState] = useState<ExamState | null>(null);
  const [error,setError] = useState("");
  const [nickname,setNickname] = useState("科学好き");
  const [sharePath,setSharePath] = useState<string | null>(null);
  const [review,setReview] = useState<Review | null>(null);
  const [reviewPage,setReviewPage] = useState(0);
  const [domain,setDomain] = useState<ScienceDomain>("数学");
  const [busy,setBusy] = useState(false);
  const [note,setNote] = useState("");
  const [reportOrdinal,setReportOrdinal] = useState<number | null>(null);
  async function load() {
    setError("");
    try {
      const next = await scienceApi<ExamState&{share:{id:string;enabled:boolean;nickname:string}|null}>("result", {attemptId}); setState(next);
      if(next.share){setNickname(next.share.nickname);setSharePath(next.share.enabled?`/s/${next.share.id}`:null);}
      if (next.attempt.result) {
        const best = domains.filter((d) => next.attempt.result!.domains[d].score!==null).sort((a,b) => next.attempt.result!.domains[b].score! - next.attempt.result!.domains[a].score!)[0];
        if (best) setDomain(best);
        void scienceApi("event", {attemptId,name:"result_viewed",operationId:crypto.randomUUID()}).catch(() => {});
      }
    } catch(e) {setError((e as Error).message);}
  }
  useEffect(() => { void load(); /* One owner-scoped result per URL. */ // eslint-disable-next-line react-hooks/exhaustive-deps
  },[attemptId]);

  async function publish(enabled: boolean) {
    setBusy(true);setError("");setNote("");
    try {
      const link = await scienceApi<{path:string}>("share",{attemptId,nickname,enabled});
      setSharePath(enabled ? link.path : null);setNote(enabled ? "共有ページを公開しました。" : "共有ページの公開を取り消しました。");
    } catch(e) {setError((e as Error).message);} finally {setBusy(false);}
  }
  async function share() {
    if (!sharePath||!state?.attempt.result) return;
    const url=new URL(sharePath,window.location.origin).href;
    void scienceApi("event",{attemptId,name:"share_button_clicked",operationId:crypto.randomUUID()}).catch(() => {});
    try {
      if(navigator.share) await navigator.share({title:"全分野科学検定",text:shareCopy(state.attempt.result,nickname).text,url});
      else {await navigator.clipboard.writeText(url);setNote("共有URLをコピーしました。");}
    } catch(e) {if((e as Error).name!=="AbortError")setNote(`このURLをコピーできます：${url}`);}
  }
  if(!state) return <main className="page-container max-w-4xl py-10"><AppCard><h1 className="text-2xl font-black">受験結果</h1><p role="status" className="mt-4">{error||"保存済みの結果を読み込んでいます…"}</p>{error&&<AppButton onClick={() => void load()} className="mt-4">再読み込み</AppButton>}</AppCard></main>;
  const result=state.attempt.result;
  if(!result)return <main className="page-container max-w-4xl py-10"><AppCard><h1 className="text-2xl font-black">この受験は完了していません</h1><p className="mt-4">{state.attempt.ordinal}問の回答が保存されています。</p><AppButton href={state.attempt.state==="abandoned"?"/mypage":`/exam?attempt=${attemptId}`} className="mt-5">{state.attempt.state==="abandoned"?"マイページへ":"受験を再開する"}</AppButton></AppCard></main>;
  const next=nextKind(state.group,result.definition.kind);
  const copy=shareCopy(result,nickname);
  return <main className="page-container max-w-4xl py-8">
    <ResultSummary result={result}/>
    {(!!result.corrections?.count||!!result.identityAdjustments?.excludedCount)&&<ResultVersionHistory attemptId={attemptId}/>}
    {result.definition.kind==="weekly"&&!state.attempt.competitive&&<p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-7">参考参加の記録です。締切後の完了、再挑戦、作問・事前閲覧がある記録は競争順位へ加えません。</p>}
    <AppCard className="mt-6"><h2 className="text-2xl font-black">この結果を、科学好きな人へ</h2><p className="mt-3 leading-7">ニックネームとこの受験結果だけを公開します。メールアドレスや個別の回答、問題の正解は公開しません。あとで公開を取り消せます。</p>
      <label className="mt-4 block text-sm font-bold">公開するニックネーム<input value={nickname} onChange={(e)=>setNickname(e.target.value)} maxLength={30} className="mt-2 block min-h-12 w-full rounded-xl border p-3"/></label>
      <div className="mt-5 rounded-xl bg-[var(--color-primary-50)] p-5"><p className="text-sm">公開内容のプレビュー</p><p className="mt-2 text-xl font-black">{nickname}さん · {result.definition.label}</p><p className="mt-2">{copy.metric}</p><p className="mt-2 text-sm">{copy.subtitle} · 制作「理系とーく 川村智祥」</p></div>
      <div className="mt-4 flex flex-wrap gap-3"><AppButton disabled={busy||!nickname.trim()} onClick={()=>void publish(true)}>{sharePath?"公開内容を更新":"この内容で共有ページを作る"}</AppButton>{sharePath&&<><AppButton onClick={()=>void share()} variant="secondary">SNSへ共有・URLをコピー</AppButton><AppButton href={sharePath} variant="ghost">公開ページを見る</AppButton><AppButton disabled={busy} onClick={()=>void publish(false)} variant="ghost">公開を取り消す</AppButton></>}</div>
      <p role="status" className="mt-3 text-sm">{note}</p>
    </AppCard>
    <AppCard className="mt-6"><h2 className="text-2xl font-black">次は、どこまでわかる？</h2><p className="mt-3 leading-7">{next==="domain"?"気になる分野をもう20問。今回の結果から、もう一歩掘り下げてみましょう。":"10分野の本試験へ。新しい受験で、科学マップを詳しく見てみましょう。"}</p>
      <label className="mt-4 block text-sm font-bold">深掘りする分野<select value={domain} onChange={(e)=>setDomain(e.target.value as ScienceDomain)} className="mt-2 block min-h-12 w-full rounded-xl border p-3">{domains.map((d)=><option key={d}>{d}</option>)}</select></label>
      <div className="mt-4 flex flex-wrap gap-3"><AppButton href={next==="domain"?`/exam?kind=domain&domain=${encodeURIComponent(domain)}`:"/exam?kind=full"}>{next==="domain"?`${domain}をもう20問`:"総合本試験へ"}</AppButton><AppButton href={next==="domain"?"/exam?kind=full":`/exam?kind=domain&domain=${encodeURIComponent(domain)}`} variant="secondary">{next==="domain"?"総合本試験へ":`${domain}をもう20問`}</AppButton><AppButton href="/exam?kind=weekly" variant="ghost">今週の10問</AppButton></div>
      {!state.signedIn&&<p className="mt-4 text-sm leading-7">受験の種類によって無料登録をご案内します。メールの確認コードで登録すると、履歴を別の端末でも見られます。</p>}
    </AppCard>
    <AppCard className="mt-6"><h2 className="text-2xl font-black">解説・出典を読む</h2><p className="mt-3">間違えた問題や気になる問題を、少しずつ復習できます。</p><AppButton variant="secondary" className="mt-4" onClick={async()=>{try{setReview(await scienceApi<Review>("review",{attemptId}));setError("");}catch(e){setError((e as Error).message);}}}>解説を開く</AppButton>
      {review&&review.rows.slice(reviewPage*10,reviewPage*10+10).map((row)=><section key={row.ordinal} className="mt-6 border-t pt-5"><p className="text-sm font-bold">第{row.ordinal+1}問 · {row.domain} · {row.update?.excluded?"採点対象外":row.correct?"正解":"不正解"}</p>{row.update&&<p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm whitespace-pre-wrap">訂正：{row.update.reason}<br/>以下は受験当時の記録です。現在の問題と解説は下に表示します。</p>}<h3 className="mt-2 whitespace-pre-wrap font-bold leading-8">{row.content.question}</h3><p className="mt-3">あなたの回答：{row.content.choices[row.selectedIndex]}</p><p className="mt-2 font-bold">{row.update?"受験時の正解キー":"正解"}：{row.content.choices[row.content.correctIndex]}</p><p className="mt-3 whitespace-pre-wrap leading-8">{row.content.explanation}</p>
        {row.creditName&&<p className="mt-3 text-xs">作問：{row.creditName}</p>}
        {row.update&&<div className="mt-5 rounded-xl border p-4"><h4 className="font-bold">訂正後の問題・解説</h4><p className="mt-3 whitespace-pre-wrap leading-8">{row.update.content.question}</p><ol className="mt-3 list-decimal pl-6">{row.update.content.choices.map((c,i)=><li key={i}>{c}{i===row.update!.content.correctIndex&&"（正解）"}</li>)}</ol><p className="mt-3 whitespace-pre-wrap leading-8">{row.update.content.explanation}</p>{row.update.content.sources.map((s,i)=><p key={i} className="mt-2 text-sm">{s.url&&/^https?:\/\//.test(s.url)?<a href={s.url} rel="noreferrer" target="_blank" className="underline">{s.title}</a>:s.title}</p>)}</div>}
        <ul className="mt-3 list-inside list-disc text-sm">{row.content.sources.map((s,i)=><li key={i}>{s.url&&/^https?:\/\//.test(s.url)?<a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a>:s.title}</li>)}</ul>
        <div className="mt-3 flex flex-wrap gap-2"><AppButton variant="ghost" onClick={async()=>{try{await scienceApi("bookmark",{attemptId,revisionId:row.revisionId,enabled:true});setNote("復習用に保存しました。");}catch(e){const issue=e as RequestError;setError(issue.code==="registration_required"?"ブックマークは無料登録後に利用できます。":issue.message);}}}>復習用に保存</AppButton><AppButton variant="ghost" onClick={()=>setReportOrdinal(row.ordinal)}>問題の改善を提案</AppButton></div>
        {reportOrdinal===row.ordinal&&<form className="mt-4 grid gap-3 rounded-xl border p-4" onSubmit={async(e)=>{e.preventDefault();const form=new FormData(e.currentTarget);try{await scienceApi("feedback",{attemptId,ordinal:row.ordinal,category:form.get("category"),body:form.get("body"),evidence:form.get("evidence")});setNote("改善提案を保存しました。ありがとうございます。");setReportOrdinal(null);}catch(issue){setError((issue as Error).message);}}}><label>気づいたこと<select name="category" className="mt-2 block w-full rounded border p-3">{[["answer","正解が違う"],["ambiguous","複数の答えに解釈できる"],["explanation","解説について"],["source","出典について"],["rights","権利について"],["typo","誤字・表記"],["good","良い問題だった"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>具体的な内容<textarea name="body" maxLength={2000} className="mt-2 block min-h-24 w-full rounded border p-3"/></label><label>根拠・出典（任意）<textarea name="evidence" maxLength={2000} className="mt-2 block w-full rounded border p-3"/></label><AppButton type="submit">提案を送信する</AppButton></form>}
      </section>)}
      {review&&<div className="mt-5 flex gap-3"><AppButton variant="ghost" disabled={reviewPage===0} onClick={()=>setReviewPage(p=>p-1)}>前の10問</AppButton><AppButton variant="ghost" disabled={(reviewPage+1)*10>=review.rows.length} onClick={()=>setReviewPage(p=>p+1)}>次の10問</AppButton></div>}
    </AppCard>{error&&<p role="alert" className="mt-4 rounded-xl bg-amber-50 p-4">{error}</p>}<AppButton href="/mypage" className="mt-6" variant="secondary">マイページへ</AppButton>
  </main>;
}
