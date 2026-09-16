import Link from "next/link";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppCard } from "@/components/ui/AppCard";
import { knowledgeDescriptions } from "@/src/lib/science/knowledge-levels";
export const metadata={title:"検定について"};
export default function AboutPage(){return <><SiteHeaderWithAuth/><main className="page-container max-w-4xl py-10"><h1 className="text-3xl font-black">科学の広さを、楽しむ検定。</h1><p className="mt-6 leading-8">全分野科学検定は、専門の外にも好奇心を広げるための検定です。10分野の知識に触れ、結果を共有し、次の学びへ。問題そのものも、みんなの回答と改善報告で育てていきます。</p><div className="mt-8 grid gap-5">{[
  ["何を測る？","初期は知識の4択問題です。実験技能、論述、研究の遂行などは測定範囲に含みません。数学・物理・化学・生物・地学・工学・農学・情報・計算機科学・医歯薬学・人文社会科学を扱います。"],
  ["総合スコアと分野スコア","分野ごとの参考スコアは1〜99、総合は10分野を同じ重みで足した10〜990です。未測定の分野を0点に置き換えません。難しい問題を含む受験同士を比べるため、正答数とは別に推定します。"],
  ["知識の段階と点数",`知識の広がりは「${knowledgeDescriptions.join("」「")}」の5段階を目安に説明します。各段階と点数帯の対応は、実際の回答から検証を進めています。今の点数を学歴・学位に換算するものではありません。`],
  ["作問と自己評価の共通の目安","小学校・中学校の修了直後、高校の該当科目・大学の専門基礎の履修直後、該当分野の学士号・修士号取得直後、該当分野の博士号を持つ現役研究者の7種類の人物像を使います。大分野全体と小分野を区別し、人物像の間隔を一定の点数には置き換えません。結果画面の自己評価は任意・非公開で、得点を変更しません。"],
  ["あなたに合わせた一問","正答率を必ず半分にするのではなく、実力を見分ける情報が増える問題を選びます。問題の検証に必要な出題枠と、10分野を同じ数ずつ測る条件も組み合わせます。"],
  ["記録・現在の推定・自己ベスト","受験ごとの結果は測定時の版と一緒に保存します。現在の推定は、各分野の直近100問までを使い、30問前の回答の重みを半分にします。未校正の参考値として推定の幅と回答数を併記します。自己ベストは同じ種類・問題数・計算方法の記録から表示します。"],
  ["みんなで良問をつくる","誰でも下書きを作り、受付開始後は投稿規約に同意して審査を依頼できます。出典・権利・正解を確認した問題は、みんなの出題ラボで検証。信頼スコアは独立した品質確認を主な根拠にし、初投稿にも出題機会を残します。"],
  ["旧版を受けた方へ","同じメールアドレスの確認コードでログインしてください。アカウントと取得済みの利用権を引き継ぎます。旧版の結果は旧版の尺度として保存し、新版と混ぜません。旧版の途中受験は新版へ変換せず、保存済みの回答を保持します。"]
].map(([title,body])=><AppCard key={title}><h2 className="text-xl font-black">{title}</h2><p className="mt-4 leading-8">{body}</p></AppCard>)}</div><p className="mt-8 leading-8">制作「理系とーく 川村智祥」 · <Link href="/lab" className="underline">みんなの出題ラボへ</Link></p></main><SiteFooter/></>;}
