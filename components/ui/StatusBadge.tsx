import { cn } from "@/src/lib/utils";

export function StatusBadge({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "yellow" | "green" | "red" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
        tone === "blue" && "border-[var(--color-border-strong)] bg-[var(--color-primary-100)] text-[var(--color-primary-800)]",
        tone === "yellow" && "border-yellow-300 bg-[var(--color-accent-yellow-100)] text-[var(--color-warning-700)]",
        tone === "green" && "border-green-200 bg-[var(--color-success-100)] text-[var(--color-success-700)]",
        tone === "red" && "border-red-200 bg-[var(--color-danger-100)] text-[var(--color-danger-700)]"
      )}
    >
      {children}
    </span>
  );
}
