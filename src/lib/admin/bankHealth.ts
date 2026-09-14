import { readFile } from "node:fs/promises";
import { join } from "node:path";

type GapRow = {
  domain: string;
  subdomain: string;
  current: number;
  target: number;
  gap: number;
  levels: Record<string, number>;
  statuses: Record<string, number>;
};

type GapReport = {
  generated_at: string;
  total_gap: number;
  total_subdomains: number;
  subdomains_below_target: number;
  rows: GapRow[];
};

export async function getBankHealthData() {
  try {
    const raw = await readFile(join(process.cwd(), "supabase/seed/generated/subdomain-gaps.json"), "utf8");
    const report = JSON.parse(raw) as GapReport;
    const rows = report.rows ?? [];
    const complete = rows.filter((row) => row.gap === 0).length;
    const thinPublished = rows.filter((row) => (row.statuses?.published ?? 0) > 0 && row.current < row.target).length;
    return {
      generatedAt: report.generated_at,
      totalGap: report.total_gap,
      totalSubdomains: report.total_subdomains,
      belowTarget: report.subdomains_below_target,
      complete,
      thinPublished,
      worstRows: rows.slice().sort((a, b) => b.gap - a.gap).slice(0, 12)
    };
  } catch {
    return {
      generatedAt: null,
      totalGap: 0,
      totalSubdomains: 0,
      belowTarget: 0,
      complete: 0,
      thinPublished: 0,
      worstRows: [] as GapRow[]
    };
  }
}
