import { allocationCheck,wilson } from "@/src/lib/science/experiment";
import type { AdminData } from "@/src/lib/science/admin";
import { AppCard } from "@/components/ui/AppCard";
const percent=(p:number)=>`${(p*100).toFixed(1)}%`;
export function ExperimentTable({experiment}:{experiment:AdminData["experiment"]}){
  const srm=allocationCheck(experiment.rows.map(r=>Number(r.starters)));
  return <AppCard className="mt-8"><h2 className="text-2xl font-black">4導線の比較</h2><p className="mt-3 text-sm leading-7">対象：過去28日間に初めて腕試しを始めた新規の端末・アカウント。比較率は開始後7日が経過した人だけを分母にします。登録は「メール確認済み、7日時点で科学メールへの同意あり」。同じアカウントの端末を統合し、既存会員を除きます。</p><p className="mt-3 text-xs">実験 {experiment.id} · {experiment.from} 〜 {experiment.to}</p>
    <div className="mt-5 overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead><tr>{["群","開始","7日経過","確認済み","有効登録","登録率（95%区間）","共有経由登録","腕試し完了","共有リンク作成","配信停止","複数群"] .map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{experiment.rows.map(r=>{const interval=wilson(Number(r.registrations_7d),Number(r.mature_starters));return <tr key={r.route_group} className="border-t"><td className="p-3 font-bold">{r.route_group}</td>{[r.starters,r.mature_starters,r.verified_7d,r.registrations_7d].map((n,i)=><td key={i} className="p-3">{n}</td>)}<td className="p-3">{interval?`${percent(interval.rate)} (${percent(interval.low)}〜${percent(interval.high)})`:"集計待ち"}</td>{[r.share_registrations_7d,r.completions_7d,r.shared_7d,r.withdrawn,r.mixed_assignment].map((n,i)=><td key={i} className="p-3">{n}</td>)}</tr>;})}</tbody></table></div>
    <p className="mt-4 text-sm leading-7">共有経由の登録は、有効登録の内数です。共有リンク作成数は、SNSへの投稿完了数ではありません。配信停止と複数群への接触は、対象者の取得時点までの記録です。</p><p className={`mt-4 text-sm ${srm?.alert?"font-bold text-red-700":""}`}>{!srm?"割当比の検査は20件以上から。":`割当比の検査 p=${srm.p.toPrecision(3)}。${srm.alert?"偏りを検出しました。追跡・割当を確認し、勝者判定を止めてください。":"偏りの警告なし。"}`}</p><p className="mt-3 text-sm leading-7">現在は基準値の収集段階です。必要人数・最小改善幅・比較期間を決めるまでは勝者を確定せず、流入配分も自動変更しません。区間は各群の参考値で、群間の有意差を示すものではありません。</p>
  </AppCard>;
}
