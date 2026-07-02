import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "腕試し受験",
  description: "10の科学分野であなたの科学力を腕試しできる受験ページです。",
  alternates: {
    canonical: "/exam"
  },
  openGraph: {
    title: "腕試し受験 | 全分野科学検定 β版",
    description: "ログインなしで始められる腕試し受験ページです。",
    url: "/exam"
  }
};

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return children;
}
