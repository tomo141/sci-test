import { createServiceRoleClient } from "@/src/lib/supabase/server";

export type AdminDashboardData = {
  state: "available"; observedAt: string;
  sessions: number; profiles: number; consents: number; answers: number;
} | { state: "unavailable"; observedAt: string };

// Call only after authorizing an administrator. Counts are not conversion rates.
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const observedAt = new Date().toISOString();
  const supabase = createServiceRoleClient();
  if (!supabase) return { state: "unavailable", observedAt };
  const results = await Promise.all([
    supabase.from("exam_sessions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("marketing_consents").select("id", { count: "exact", head: true }).eq("consented", true),
    supabase.from("exam_answers").select("id", { count: "exact", head: true })
  ]);
  if (results.some((result) => result.error || result.count === null)) return { state: "unavailable", observedAt };
  return { state: "available", observedAt,
    sessions: results[0].count!, profiles: results[1].count!,
    consents: results[2].count!, answers: results[3].count! };
}
