import Link from "next/link";
import { rankings } from "@/src/lib/science/rankings";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
export const dynamic="force-dynamic";
export default async function RankingPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const p=await searchParams;
  const kind=p.kind==="full"?"full":"weekly";
  const period=p.period==="day"?"day":p.period==="month"?"month":"week";
  const length=p.length==="100"?100:50;
  let data:Awaited<ReturnType<typeof rankings>>|null=null;
  try{data=await rankings(kind,period,length);}catch{/* Display failed retrieval separately from zero results. */}
  return <><SiteHeaderWithAuth/><main className="page-container max-w-4xl py-10">
    <h1 className="text-3xl font-black">みんなの科学チャレンジ</h1>
    <div className="mt-6 flex flex-wrap gap-3"><AppButton href="/ranking" variant={kind==="weekly"?"primary":"secondary"}>今週の10問</AppButton><AppButton href="/ranking?kind=full" variant={kind==="full"?"primary":"secondary"}>本試験の参考ランキング</AppButton></div>
    <AppCard className="mt-6"><h2 className="text-2xl font-black">{kind==="weekly"?"今週の10問 · 正答数ランキング":`総合本試験 ${length}問 · 参考スコア`}</h2>
    <p className="mt-3 leading-8">{kind==="weekly"?"全員が同じ10問に挑戦。日本時間の月曜0時から日曜24時まで、初回完了の正答数で競います。問題を事前に知っている人は参考参加です。":"出題は一人ずつ異なります。同じ問題数・採点版で、期間内の最初の対象受験を掲載します。スコアの比較精度は検証中です。"} 同点は同じ順位。解く速さで順位は変わりません。</p>
    {kind==="full"&&<div className="mt-4 flex flex-wrap gap-3">{([["day","日"],["week","週"],["month","月"]] as const).map(([v,l])=><AppButton key={v} href={`/ranking?kind=full&period=${v}&length=${length}`} variant={period===v?"primary":"ghost"}>{l}別</AppButton>)}{([50,100] as const).map(n=><AppButton key={n} href={`/ranking?kind=full&period=${period}&length=${n}`} variant={length===n?"secondary":"ghost"}>{n}問</AppButton>)}</div>}
    {data?<><p className="mt-5 text-sm text-[var(--color-muted)]">対象期間（日本時間）：{new Date(data.bounds.start).toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"})}〜{new Date(new Date(data.bounds.end).getTime()-1).toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"})} · 上位100件</p>
      {data.rows.length===0?<p className="mt-6">掲載を許可した完了記録はまだありません。</p>:<table className="mt-5 w-full text-left"><thead><tr><th className="py-3">順位</th><th>ニックネーム</th><th>{kind==="weekly"?"正答数":"参考スコア"}</th><th><span className="sr-only">記録</span></th></tr></thead><tbody>{data.rows.map((r,i)=><tr key={i} className="border-t"><td className="py-4 font-bold">{r.place}位</td><td className="max-w-48 break-words">{r.profile_id?<Link className="underline" href={`/u/${r.profile_id}`}>{r.nickname}</Link>:r.nickname}</td><td>{r.score}{kind==="weekly"?"/10問":"点"}</td><td>{r.share_id&&<Link className="text-sm underline" href={`/s/${r.share_id}`}>結果</Link>}</td></tr>)}</tbody></table>}
    </>:<p role="alert" className="mt-6 rounded-xl bg-amber-50 p-4">ランキングを取得できませんでした。しばらくして再読み込みしてください。</p>}
    <div className="mt-6 flex flex-wrap gap-3"><AppButton href={kind==="weekly"?"/exam?kind=weekly":"/exam?kind=full"}>自分も挑戦する</AppButton><AppButton href="/mypage" variant="secondary">ランキングの掲載設定</AppButton></div><p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">ランキングへの掲載は任意です。無料登録後、マイページで掲載を選べます。あとで取り消せます。</p>
    </AppCard></main></>;
}
