import { createServiceRoleClient } from "@/src/lib/supabase/server";
import { displayDomainScore } from "@/src/lib/scoring/domainScore";
import { domainRankTitle, rankTitle } from "@/src/lib/scoring/rank";
import type { ScienceDomain } from "@/src/lib/data/taxonomy";

export type PublicLeaderboardRow = {
  rank: number;
  nickname: string;
  score: number;
  answerCount: number;
  bestDomain: string | null;
  title: string | null;
};

type ProfileRef = { nickname: string | null } | { nickname: string | null }[] | null;

function readNickname(profile: ProfileRef, fallbackIndex: number) {
  const row = Array.isArray(profile) ? profile[0] : profile;
  return row?.nickname || `参加者 ${fallbackIndex + 1}`;
}

function dedupeBestPerUser(
  rows: Array<{ user_id: string; ability: number; answer_count: number; profiles: ProfileRef }>,
  limit: number
) {
  const bestByUser = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const current = bestByUser.get(row.user_id);
    if (!current || row.ability > current.ability) {
      bestByUser.set(row.user_id, row);
    }
  }
  return [...bestByUser.values()]
    .sort((a, b) => b.ability - a.ability || b.answer_count - a.answer_count)
    .slice(0, limit);
}

async function getDomainLeaderboard(domain: ScienceDomain, limit: number): Promise<PublicLeaderboardRow[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data: estimates, error: estimateError } = await supabase
    .from("proficiency_estimates")
    .select("user_id, ability, answer_count, profiles(nickname)")
    .eq("scope", "domain")
    .eq("scope_key", domain)
    .not("user_id", "is", null)
    .gt("answer_count", 0)
    .order("ability", { ascending: false })
    .limit(limit * 5);

  if (!estimateError && estimates?.length) {
    const bestRows = dedupeBestPerUser(
      estimates.map((row) => ({
        user_id: row.user_id as string,
        ability: displayDomainScore(Number(row.ability)),
        answer_count: Number(row.answer_count),
        profiles: row.profiles as ProfileRef
      })),
      limit
    );

    return bestRows.map((row, index) => ({
      rank: index + 1,
      nickname: readNickname(row.profiles, index),
      score: row.ability,
      answerCount: row.answer_count,
      bestDomain: domain,
      title: domainRankTitle(row.ability)
    }));
  }

  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("rank, public_nickname, score, answer_count, best_domain, title")
    .eq("kind", "分野別")
    .eq("domain", domain)
    .order("rank", { ascending: true })
    .limit(limit);

  if (!error && data?.length) {
    return data.map((row, index) => {
      const score = displayDomainScore(Number(row.score));
      return {
        rank: row.rank ?? index + 1,
        nickname: row.public_nickname,
        score,
        answerCount: Number(row.answer_count),
        bestDomain: row.best_domain,
        title: domainRankTitle(score)
      };
    });
  }

  return [];
}

async function getOverallLeaderboard(limit: number): Promise<PublicLeaderboardRow[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data: histories, error: historyError } = await supabase
    .from("score_history")
    .select("user_id, score, answer_count, created_at, profiles(nickname)")
    .order("score", { ascending: false })
    .order("answer_count", { ascending: false })
    .limit(limit * 3);

  if (!historyError && histories?.length) {
    const seen = new Set<string>();
    return histories
      .filter((row) => {
        if (seen.has(row.user_id)) return false;
        seen.add(row.user_id);
        return true;
      })
      .slice(0, limit)
      .map((row, index) => {
        const score = Number(row.score);
        return {
          rank: index + 1,
          nickname: readNickname(row.profiles as ProfileRef, index),
          score,
          answerCount: Number(row.answer_count),
          bestDomain: null,
          title: rankTitle(score)
        };
      });
  }

  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("rank, public_nickname, score, answer_count, best_domain, title")
    .eq("kind", "総合")
    .order("rank", { ascending: true })
    .limit(limit);

  if (!error && data?.length) {
    return data.map((row, index) => ({
      rank: row.rank ?? index + 1,
      nickname: row.public_nickname,
      score: Number(row.score),
      answerCount: Number(row.answer_count),
      bestDomain: row.best_domain,
      title: row.title
    }));
  }

  return [];
}

export async function getPublicLeaderboard(
  limit = 100,
  domain: ScienceDomain | "総合" = "総合"
): Promise<PublicLeaderboardRow[]> {
  if (domain !== "総合") {
    return getDomainLeaderboard(domain, limit);
  }
  return getOverallLeaderboard(limit);
}
