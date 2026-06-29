import { cn } from "@/src/lib/utils";

export function AppCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card", className)}>{children}</section>;
}
