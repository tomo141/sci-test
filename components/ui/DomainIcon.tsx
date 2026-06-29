import {
  Atom,
  Binary,
  Dna,
  FlaskConical,
  Globe2,
  HeartPulse,
  Leaf,
  Settings,
  Shapes,
  UsersRound
} from "lucide-react";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import { domainIconLabels } from "@/src/lib/data/taxonomy";

const iconMap = {
  数学: Shapes,
  物理: Atom,
  化学: FlaskConical,
  生物: Dna,
  地学: Globe2,
  工学: Settings,
  農学: Leaf,
  "情報・計算機科学": Binary,
  医歯薬学: HeartPulse,
  人文社会科学: UsersRound
} satisfies Record<ScienceDomain, typeof Shapes>;

const toneMap = {
  数学: "text-emerald-700 bg-emerald-50 border-emerald-200",
  物理: "text-indigo-700 bg-indigo-50 border-indigo-200",
  化学: "text-amber-700 bg-amber-50 border-amber-200",
  生物: "text-rose-700 bg-rose-50 border-rose-200",
  地学: "text-sky-700 bg-sky-50 border-sky-200",
  工学: "text-slate-700 bg-slate-50 border-slate-200",
  農学: "text-lime-700 bg-lime-50 border-lime-200",
  "情報・計算機科学": "text-blue-700 bg-blue-50 border-blue-200",
  医歯薬学: "text-red-700 bg-red-50 border-red-200",
  人文社会科学: "text-violet-700 bg-violet-50 border-violet-200"
} satisfies Record<ScienceDomain, string>;

type Props = {
  domain: ScienceDomain;
  size?: "sm" | "md" | "lg";
};

export function DomainIcon({ domain, size = "md" }: Props) {
  const Icon = iconMap[domain];
  const sizeClass = size === "sm" ? "h-9 w-9" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const iconSize = size === "sm" ? 18 : size === "lg" ? 32 : 24;

  return (
    <span
      aria-label={`${domain}（${domainIconLabels[domain]}）`}
      className={`inline-grid ${sizeClass} place-items-center rounded-2xl border ${toneMap[domain]}`}
      title={`${domain}（${domainIconLabels[domain]}）`}
    >
      <Icon size={iconSize} strokeWidth={2.4} />
    </span>
  );
}
