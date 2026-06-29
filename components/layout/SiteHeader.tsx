import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/auth/actions";
import { AppButton } from "@/components/ui/AppButton";
import { SiteMobileMenu } from "@/components/layout/SiteMobileMenu";

const nav: [string, string][] = [
  ["トップ", "/"],
  ["検定について", "/terms"],
  ["受験する", "/exam"],
  ["トレーニング", "/training"],
  ["ランキング", "/ranking"],
  ["マイページ", "/mypage"],
  ["ヘルプ", "/privacy"]
];

type Props = {
  compact?: boolean;
  isLoggedIn?: boolean;
};

export function SiteHeader({ compact = false, isLoggedIn = false }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
      <div className="page-container relative flex min-h-16 items-center justify-between gap-4 py-3 md:min-h-[72px]">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[var(--color-border-strong)] bg-white">
            <Image src="/characters/riketokuo/sheet.png" alt="りけとくお" fill className="object-cover object-[68%_14%]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-lg md:text-2xl">全分野科学検定</strong>
              <span className="rounded-md bg-[var(--color-primary-700)] px-2 py-1 text-xs font-bold text-white">β版</span>
            </div>
            <p className="hidden text-xs font-bold text-[var(--color-muted)] sm:block">科学を、もっと楽しく、もっと身近に。</p>
          </div>
        </Link>
        {!compact ? (
          <>
            <nav className="hidden items-center gap-6 text-sm font-bold text-[var(--color-primary-900)] lg:flex">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className="hover:text-[var(--color-primary-700)]">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              {isLoggedIn ? (
                <form action={logoutAction}>
                  <AppButton type="submit" variant="secondary">
                    ログアウト
                  </AppButton>
                </form>
              ) : (
                <>
                  <AppButton href="/login" variant="secondary">
                    ログイン
                  </AppButton>
                  <AppButton href="/signup" variant="secondary">
                    新規登録
                  </AppButton>
                </>
              )}
            </div>
            <SiteMobileMenu nav={nav} isLoggedIn={isLoggedIn} />
          </>
        ) : null}
      </div>
    </header>
  );
}
