export function QuestionCardSkeleton({ showDifficulty = false }: { showDifficulty?: boolean }) {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card md:p-6" aria-busy="true" aria-label="問題を読み込み中">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="h-8 w-20 rounded-full bg-[var(--color-primary-50)]" />
        <div className="h-8 w-16 rounded-full bg-[var(--color-primary-50)]" />
        {showDifficulty ? <div className="h-8 w-24 rounded-full bg-[var(--color-primary-50)]" /> : null}
      </div>
      <div className="mb-6 grid gap-3">
        <div className="h-6 w-full rounded bg-[var(--color-primary-50)]" />
        <div className="h-6 w-11/12 rounded bg-[var(--color-primary-50)]" />
        <div className="h-6 w-4/5 rounded bg-[var(--color-primary-50)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-[var(--color-primary-50)]" />
        ))}
      </div>
    </div>
  );
}
