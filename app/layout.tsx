import type { Metadata } from "next";
import { siteConfig } from "@/src/lib/site-config";
import "./globals.css";
import { ScienceVisit } from "@/components/science/ScienceVisit";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || siteConfig.productionUrl),
  title: {
    default: "全分野科学検定 β版",
    template: "%s | 全分野科学検定 β版"
  },
  description: "科学好きのための、全分野科学力の成長可視化・トレーニングができる検定。",
  applicationName: "全分野科学検定 β版",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    siteName: "全分野科学検定 β版",
    title: "全分野科学検定 β版",
    description: "10の科学分野で科学力を可視化する、科学好きのための腕試し検定。",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "全分野科学検定 β版" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "全分野科学検定 β版",
    description: "10の科学分野で科学力を可視化する、科学好きのための腕試し検定。",
    images: ["/opengraph-image"]
  },
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}<ScienceVisit /></body>
    </html>
  );
}
