import Link from "next/link";

type Props = {
  showAdminLink?: boolean;
};

export function SiteFooter({ showAdminLink = false }: Props) {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-white py-8">
      <div className="page-container flex flex-col gap-3 text-sm text-[var(--color-muted)] md:flex-row md:items-center md:justify-between">
        <p>© 2026 全分野科学検定 β版</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/terms">利用規約</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          {showAdminLink ? <Link href="/admin">管理画面</Link> : null}
        </div>
      </div>
    </footer>
  );
}
