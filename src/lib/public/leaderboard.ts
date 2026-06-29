import { createServiceRoleClient } from "@/src/lib/supabase/server";
import { rankTitle } from "@/src/lib/scoring/rank";

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

  if (!error && data?.length) {
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

  const { data: histories, error: historyError } = await supabase
    .from("score_history")
    .select("user_id, score, answer_count, created_at, profiles(nickname)")
    .order("score", { ascending: false })
    .order("answer_count", { ascending: false })
    .limit(limit * 3);

  if (historyError || !histories?.length) return [];

  const seen = new Set<string>();
  return histories
    .filter((row) => {
      if (seen.has(row.user_id)) return false;
      seen.add(row.user_id);
      return true;
    })
    .slice(0, limit)
    .map((row, index) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const score = Number(row.score);
      return {
        rank: index + 1,
        nickname: profile?.nickname || `参加者 ${index + 1}`,
        score,
        answerCount: Number(row.answer_count),
        diagnosticAccuracy: null,
        bestDomain: null,
        title: rankTitle(score)
      };
    });
}
