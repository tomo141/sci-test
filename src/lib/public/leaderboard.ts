import { createServiceRoleClient } from "@/src/lib/supabase/server";

export type PublicLeaderboardRow = {
  rank: number;
  nickname: string;
  score: number;
  answerCount: number;
  diagnosticAccuracy: number | null;
  bestDomain: string | null;
  title: string | null;
};

export async function getPublicLeaderboard(limit = 100): Promise<PublicLeaderboardRow[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("rank, public_nickname, score, answer_count, diagnostic_accuracy, best_domain, title")
    .eq("kind", "総合")
    .order("rank", { ascending: true })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row, index) => ({
    rank: row.rank ?? index + 1,
    nickname: row.public_nickname,
    score: Number(row.score),
    answerCount: Number(row.answer_count),
    diagnosticAccuracy: row.diagnostic_accuracy == null ? null : Number(row.diagnostic_accuracy),
    bestDomain: row.best_domain,
    title: row.title
  }));
}
