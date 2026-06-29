import Image from "next/image";
import { SiteHeaderWithAuth } from "@/components/layout/SiteHeaderWithAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { KarteResultClient } from "@/components/karte/KarteResultClient";

export default function KartePage() {
  return (
    <>
      <SiteHeaderWithAuth />
      <main className="page-container py-8">
        <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <p className="text-sm font-black text-[var(--color-primary-700)]">腕試しカルテ ＞ 結果</p>
            <h1 className="mt-4 text-3xl font-black md:text-5xl">あなたの科学力カルテ</h1>
            <p className="mt-3 font-bold text-[var(--color-ink-soft)]">全50問の腕試しが完了しました！あなたの科学力を診断したよ。</p>
          </div>
          <div className="relative min-h-32 rounded-3xl bg-[var(--color-primary-50)] p-5">
            <p className="max-w-[220px] rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm font-bold leading-7">すばらしい挑戦だったよ！知ることは、未来をつくる力になるよ！</p>
            <Image src="/characters/riketokuo/sheet.png" alt="りけとくお" width={140} height={140} className="absolute bottom-0 right-2 h-32 w-32 rounded-full object-cover object-[68%_14%]" />
          </div>
        </div>
        <KarteResultClient />
        <p className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-50)] p-4 text-center text-sm font-bold text-[var(--color-primary-900)]">
          本スコアは全分野科学検定独自の推定基準です。学位の保有、採用、進学、資格等を保証・証明するものではありません。
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
