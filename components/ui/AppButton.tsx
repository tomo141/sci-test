import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Props = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
};

export function AppButton({ children, href, variant = "primary", className, disabled, type = "button", onClick }: Props) {
  const classes = cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline",
    variant === "primary" && "bg-[var(--color-accent-yellow-500)] text-[var(--color-ink)] shadow-card hover:bg-[var(--color-accent-yellow-100)]",
    variant === "secondary" && "border border-[var(--color-primary-700)] bg-white text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]",
    variant === "ghost" && "text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]",
    disabled && "pointer-events-none bg-[var(--color-disabled)] text-[var(--color-muted)]",
    className
  );
  const content = (
    <>
      {children}
      {variant !== "ghost" ? <ChevronRight aria-hidden size={20} /> : null}
    </>
  );
  if (href) return <Link className={classes} href={href}>{content}</Link>;
  return <button className={classes} disabled={disabled} type={type} onClick={onClick}>{content}</button>;
}
