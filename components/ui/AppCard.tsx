import { cn } from "@/src/lib/utils";

type Props = React.ComponentPropsWithoutRef<"section">;

export function AppCard({ children, className, ...props }: Props) {
  return <section className={cn("rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card", className)} {...props}>{children}</section>;
}
