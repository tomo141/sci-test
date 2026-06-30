import type { SupabaseClient } from "@supabase/supabase-js";
import { domains } from "@/src/lib/data/taxonomy";
import type { Estimate } from "@/src/lib/scoring/types";

export async function persistProficiencyEstimates(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string | null,
  estimate: Estimate
) {
  await supabase.from("proficiency_estimates").delete().eq("session_id", sessionId);

  const rows = [
    {
      user_id: userId,
      session_id: sessionId,
      scope: "overall",
      scope_key: "overall",
      ability: estimate.overall,
      answer_count: estimate.counts.overall,
      standard_error: estimate.standardError,
      updated_at: new Date().toISOString()
    },
    ...domains.map((domain) => ({
      user_id: userId,
      session_id: sessionId,
      scope: "domain",
      scope_key: domain,
      ability: estimate.domains[domain],
      answer_count: estimate.counts.domains[domain],
      standard_error: estimate.uncertainties.domains[domain],
      updated_at: new Date().toISOString()
    }))
  ].filter((row) => row.answer_count > 0);

  if (!rows.length) return;
  await supabase.from("proficiency_estimates").insert(rows);
}
