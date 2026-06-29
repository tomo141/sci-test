"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { AppButton } from "@/components/ui/AppButton";

type Props = {
  nav: [string, string][];
  isLoggedIn: boolean;
};

export function SiteMobileMenu({ nav, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="rounded-xl border border-[var(--color-border)] p-3"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-full border-b border-[var(--color-border)] bg-white shadow-card">
          <nav className="page-container flex flex-col gap-1 py-4">
            {nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-xl px-3 py-3 text-sm font-bold text-[var(--color-primary-900)] hover:bg-[var(--color-primary-50)]"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
              {isLoggedIn ? (
                <form action={logoutAction}>
                  <AppButton type="submit" variant="secondary" className="w-full">
                    ログアウト
                  </AppButton>
                </form>
              ) : (
                <>
                  <AppButton href="/login" variant="secondary" className="w-full">
                    ログイン
                  </AppButton>
                  <AppButton href="/signup" className="w-full">
                    新規登録
                  </AppButton>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
