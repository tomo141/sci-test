import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AppCard } from "@/components/ui/AppCard";
import { siteConfig } from "@/src/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "全分野科学検定 β版で取得する情報、利用目的、外部サービス、Cookie等の扱いを説明します。",
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "プライバシーポリシー | 全分野科学検定 β版",
    description: "取得情報や利用目的、外部サービス、Cookie等の扱いを確認できます。",
    url: "/privacy"
  }
};

const sections = [
  {
    title: "1. 取得する情報",
    body: [
      "本サービスは、メールアドレス、パスワード、ニックネーム、本名（任意）、最終学歴（任意）、専門分野（任意）、メルマガ同意状況、回答履歴、正誤、回答時間、スコア、分野別推定値、問題評価、問い合わせ内容を取得する場合があります。",
      "また、匿名受験ID、セッション情報、アクセスログ、端末・ブラウザ情報、エラー情報等を、サービス提供と安全運用のために取得する場合があります。"
    ]
  },
  {
    title: "2. 利用目的",
    body: [
      "取得した情報は、本人確認、アカウント管理、受験履歴保存、スコア計算、カルテ表示、ランキング表示、トレーニング機能提供、問題難度・品質改善、問い合わせ対応、不正利用防止、障害調査、サービス改善のために利用します。",
      "メルマガ同意者の情報は、全分野科学検定の更新情報、科学イベント、理系とーくラボ等の案内を送付する目的で利用します。"
    ]
  },
  {
    title: "3. パスワードと認証情報",
    body: [
      "パスワードは、認証基盤であるSupabase Authを通じて管理されます。運営者が利用者のパスワードを平文で閲覧することはありません。",
      "アカウント確認、ログイン、パスワード再設定等の認証メールは、Supabase Authの機能を利用して送信されます。"
    ]
  },
  {
    title: "4. メルマガ同意とMyASP",
    body: [
      "メルマガ同意は任意であり、アカウント登録とは別に管理されます。",
      "メルマガ配信にはMyASPを利用する予定です。管理者は、同意者のメールアドレス、同意日時、ニックネーム、本名（入力がある場合）、最新推定スコア、得意分野、回答数、最終学歴、専門分野をCSVとして出力し、MyASPへ手動で取り込む場合があります。",
      "メルマガ解除は、配信メール内の解除方法その他運営者が定める方法により行えます。メルマガ解除とアカウント削除は別の手続きです。"
    ]
  },
  {
    title: "5. ランキングで公開される情報",
    body: [
      "ランキングには、ニックネーム、公開用スコア、回答数、診断精度、得意分野、称号等が表示される場合があります。",
      "メールアドレス、本名、詳細な教育情報、問い合わせ内容はランキングに表示しません。"
    ]
  },
  {
    title: "6. 回答データ・問題評価の利用",
    body: [
      "回答履歴、正誤、回答時間、問題評価、Bad理由、コメント等は、問題の難度推定、品質改善、出題頻度調整、統計分析、サービス改善に利用します。",
      "アカウント削除後も、個人を直接識別できない形に加工した統計情報や品質改善用データを保持する場合があります。"
    ]
  },
  {
    title: "7. 外部サービスの利用",
    body: [
      "本サービスは、ホスティングにVercel、データベース・認証にSupabase、メール配信にMyASPを利用する場合があります。",
      "これらの外部サービスには、サービス提供に必要な範囲で情報が保存または処理される場合があります。"
    ]
  },
  {
    title: "8. 第三者提供",
    body: [
      "運営者は、法令に基づく場合、本人の同意がある場合、生命・身体・財産の保護のために必要な場合、サービス運営上必要な業務委託先に必要最小限の範囲で提供する場合を除き、個人情報を第三者に提供しません。"
    ]
  },
  {
    title: "9. 安全管理措置",
    body: [
      "運営者は、アクセス制御、Row Level Security、管理者権限の制限、必要最小限の権限付与、通信の暗号化、監査ログ等により、個人情報の漏えい、滅失、毀損、不正アクセスの防止に努めます。",
      "ただし、インターネット上のサービスである性質上、完全な安全性を保証するものではありません。"
    ]
  },
  {
    title: "10. Cookie・ローカルストレージ",
    body: [
      "本サービスは、ログイン状態の維持、匿名受験IDの保持、受験途中の回答履歴保存、表示改善のため、Cookieまたはブラウザのローカルストレージを使用する場合があります。",
      "ブラウザ設定によりCookie等を制限した場合、一部機能が利用できないことがあります。"
    ]
  },
  {
    title: "11. 開示・訂正・削除等",
    body: [
      "利用者は、法令に基づき、自己の個人情報の開示、訂正、利用停止、削除等を求めることができます。",
      "請求を希望する場合は、本人確認に必要な情報を添えて問い合わせ先までご連絡ください。法令に従い合理的な範囲で対応します。"
    ]
  },
  {
    title: "12. 未成年者の情報",
    body: [
      "13歳未満の方が本サービスを利用する場合、保護者の同意を得てください。未成年者からの情報について、必要に応じて保護者からの問い合わせや削除依頼に対応します。"
    ]
  },
  {
    title: "13. プライバシーポリシーの変更",
    body: [
      "運営者は、法令の改正、サービス内容の変更、運用改善等に応じて、本ポリシーを変更することがあります。重要な変更がある場合、サービス上の表示その他適切な方法で周知します。"
    ]
  },
  {
    title: "14. 問い合わせ先",
    body: [`個人情報の取り扱いに関するお問い合わせは、${siteConfig.legal.contactEmail} までご連絡ください。`]
  }
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-10">
        <AppCard>
          <h1 className="text-3xl font-black">プライバシーポリシー</h1>
          <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">
            運営者：{siteConfig.legal.businessName} / 代表者：{siteConfig.legal.representativeName} / 最終更新：{siteConfig.legal.lastUpdated}
          </p>
          <div className="mt-8 grid gap-7">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-black">{section.title}</h2>
                <div className="mt-3 grid gap-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="leading-8 text-[var(--color-ink-soft)]">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </AppCard>
      </main>
      <SiteFooter />
    </>
  );
}
