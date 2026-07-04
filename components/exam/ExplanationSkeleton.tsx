export function ExplanationSkeleton() {
  return (
    <div className="mt-6 grid animate-pulse gap-4" aria-hidden="true">
      <div className="h-20 rounded-2xl bg-[var(--color-primary-50)]" />
      <div className="grid gap-3">
        <div className="h-4 w-24 rounded bg-[var(--color-primary-50)]" />
        <div className="h-4 w-full rounded bg-[var(--color-primary-50)]" />
        <div className="h-4 w-5/6 rounded bg-[var(--color-primary-50)]" />
        <div className="h-4 w-4/6 rounded bg-[var(--color-primary-50)]" />
      </div>
    </div>
  );
}
