"use client";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-container grid min-h-screen place-items-center py-10">
      <AppCard className="max-w-xl text-center">
        <h1 className="text-3xl font-black">読み込みに失敗しました</h1>
        <p className="mt-3 leading-8 text-[var(--color-ink-soft)]">通信状況を確認して、もう一度お試しください。</p>
        <AppButton onClick={reset} className="mt-6">再試行する</AppButton>
      </AppCard>
    </main>
  );
}
