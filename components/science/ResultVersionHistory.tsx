"use client";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { scienceApi } from "@/src/lib/science/client";
import type { AttemptResult } from "@/src/lib/science/types";
type Row={revision:number;result:AttemptResult;created_at:string};
export function ResultVersionHistory({attemptId}:{attemptId:string}){
  const [rows,setRows]=useState<Row[]|null>(null),[error,setError]=useState("");
  return <AppCard className="mt-6"><h2 className="text-xl font-bold">成績の訂正履歴</h2><p className="mt-3 text-sm leading-7">共有ページとランキングは訂正後の記録を表示します。訂正前の点数は、あなたの確認用に保存しています。</p><AppButton className="mt-4" variant="secondary" onClick={async()=>{try{setRows((await scienceApi<{rows:Row[]}>("result_history",{attemptId})).rows);setError("");}catch(e){setError((e as Error).message);}}}>訂正前の記録を見る</AppButton>
    {rows&&<ul className="mt-4 divide-y">{rows.map(r=><li key={r.revision} className="py-3"><p className="font-bold">第{r.revision}版 · {r.result.definition?.formal?(r.result.total??(r.result.definition.domain?r.result.domains[r.result.definition.domain].score:"—"))+"点":`${r.result.correctCount}/${r.result.answerCount}問 正解`}</p><p className="mt-2 text-sm">{new Date(r.created_at).toLocaleString("ja-JP")} · {r.result.corrections?.excludedCount??0}問を採点から除外</p></li>)}</ul>}{error&&<p role="alert" className="mt-4">{error}</p>}
  </AppCard>;
}
