import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"),
  title: "全分野科学検定 β版",
  description: "科学好きのための、全分野科学力の成長可視化・トレーニングができる検定。",
  applicationName: "全分野科学検定 β版",
  openGraph: {
    type: "website",
    siteName: "全分野科学検定 β版",
    title: "全分野科学検定 β版",
    description: "10の科学分野で科学力を可視化する、科学好きのための腕試し検定。",
    images: [{ url: "/ogp.svg", width: 1200, height: 630, alt: "全分野科学検定 β版" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "全分野科学検定 β版",
    description: "10の科学分野で科学力を可視化する、科学好きのための腕試し検定。",
    images: ["/ogp.svg"]
  },
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
