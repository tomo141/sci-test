import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { siteConfig } from "@/src/lib/site-config";
export default function HelpPage(){return <><SiteHeaderWithAuth/><main className="page-container max-w-4xl py-10"><h1 className="text-3xl font-black">使い方・困ったとき</h1><div className="mt-8 grid gap-4">{[
  ["途中で閉じても大丈夫？","確定した回答はサーバーに保存されます。同じ端末のマイページから再開できます。登録後は別の端末でもログインして再開できます。未登録のままCookieを削除すると、本人の記録として開けなくなるため、残したい結果は登録して保存してください。"],
  ["回答を送信できなかった","通信が戻ったら「同じ回答を再送する」を押してください。同じ回答を二重に数えません。別のタブで進んだときは、最新の進捗を読み直してください。"],
  ["メールが届かない","迷惑メールフォルダと入力したアドレスを確認してください。確認コードには有効期限があります。送信間隔をあけて再送し、最後に届いたコードを使います。届かない状態が続く場合は運営へご連絡ください。"],
  ["登録するとメールも必須？","アカウント登録と案内メールへの同意は別です。配信内容と頻度を確認して、自分で選べます。配信停止後もアカウント・受験の利用権は残ります。"],
  ["ランキングの条件は？","今週の10問は月曜0時から次の月曜0時まで（日本時間）。初回完了時の正答数で競い、同点は同順位です。本試験は日・週・月ごとの初回完了スコアで、問題数や計算方法が同じ記録を比較します。どちらも本人が掲載を選んだ場合に表示されます。時間の速さは使いません。"],
  ["検索やAIを使っていい？","実力を測る受験では、検索・AI・ほかの人の助けを使わず答えてください。時間制限はありません。完了後の復習や出題ラボの作問では、出典を確認しながら学べます。"],
  ["公開した結果を取り消したい","受験した端末、またはログインしたアカウントから結果を開き、公開を取り消せます。公開プロフィールとランキング掲載はマイページで設定します。外部SNSに保存された画像や転載は、各SNS側でも取り消してください。"],
  ["問題に間違いを見つけた","結果の復習から問題を開き、改善報告を送ってください。どこが、なぜ問題か、確認できる出典があると助かります。運営が確認し、保留・修正・採用を記録します。"],
  ["退会・個人情報の開示や削除","登録したメールアドレスから運営へご連絡ください。本人確認のうえ対応します。配信だけを止める場合は、マイページの配信設定をお使いください。"]
].map(([q,a])=><details key={q} className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-bold">{q}</summary><p className="mt-4 leading-8">{a}</p></details>)}</div><p className="mt-8 leading-8"><Link href="/mypage" className="underline">マイページ</Link> · お問い合わせ：<a href={`mailto:${siteConfig.legal.contactEmail}`} className="underline">{siteConfig.legal.contactEmail}</a></p></main><SiteFooter/></>;}
