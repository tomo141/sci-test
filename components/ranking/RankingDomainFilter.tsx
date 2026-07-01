"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppCard } from "@/components/ui/AppCard";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { DomainIcon } from "@/components/ui/DomainIcon";

type FilterValue = "総合" | ScienceDomain;

export function RankingDomainFilter({ active }: { active: FilterValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const select = (value: FilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "総合") {
      params.delete("domain");
    } else {
      params.set("domain", value);
    }
    const query = params.toString();
    router.push(query ? `/ranking?${query}` : "/ranking");
  };

  const buttonClass = (value: FilterValue) =>
    value === active
      ? "min-w-0 rounded-xl border border-[var(--color-primary-700)] bg-[var(--color-primary-50)] p-3 text-sm font-bold text-[var(--color-primary-800)]"
      : "flex min-w-0 items-center gap-2 rounded-xl border border-[var(--color-border)] p-2 text-left text-xs font-bold hover:bg-[var(--color-primary-50)]";

  return (
    <AppCard>
      <h2 className="mb-4 text-xl font-black">分野選択</h2>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => select("総合")} className={buttonClass("総合")}>
          総合
        </button>
        {domains.map((domain) => (
          <button key={domain} type="button" onClick={() => select(domain)} className={buttonClass(domain)}>
            <DomainIcon domain={domain} size="sm" />
            <span className="min-w-0 break-words">{domain}</span>
          </button>
        ))}
      </div>
    </AppCard>
  );
}
