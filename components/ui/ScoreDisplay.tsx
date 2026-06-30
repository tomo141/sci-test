import { scoringConfig } from "@/src/lib/scoring/config";

export function ScoreDisplay({ score, suffix = `/ ${scoringConfig.maxScore}` }: { score: number; suffix?: string }) {
  return (
    <p className="text-5xl font-black leading-none text-[var(--color-primary-800)] md:text-6xl">
      {score}
      <span className="ml-2 text-2xl font-bold text-[var(--color-primary-900)]">{suffix}</span>
    </p>
  );
}
