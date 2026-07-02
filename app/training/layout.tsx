import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "トレーニング",
  description: "分野指定やランダム出題で、科学力をコツコツ伸ばせるトレーニングページです。",
  alternates: {
    canonical: "/training"
  },
  openGraph: {
    title: "トレーニング | 全分野科学検定 β版",
    description: "分野指定やランダム出題で科学力を伸ばせます。",
    url: "/training"
  }
};

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
