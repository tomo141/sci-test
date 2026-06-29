export function ProgressBar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="w-full">
      <div className="h-3 overflow-hidden rounded-full bg-[var(--color-disabled)]">
        <div className="h-full rounded-full bg-[var(--color-primary-700)]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {label ? <p className="mt-2 text-xs font-bold text-[var(--color-muted)]">{label}</p> : null}
    </div>
  );
}
