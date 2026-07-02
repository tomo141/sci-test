import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ヘルプ",
  description: "全分野科学検定 β版の使い方、受験、トレーニング、アカウントに関する案内です。",
  alternates: {
    canonical: "/help"
  },
  openGraph: {
    title: "ヘルプ | 全分野科学検定 β版",
    description: "困ったときの案内とお問い合わせ先です。",
    url: "/help"
  }
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
