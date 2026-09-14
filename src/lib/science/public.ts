import { z } from "zod";
import { checked, service } from "./server";
import type { AttemptResult } from "./types";
import type { ScienceProfile } from "./account";

export type SharedResult = { id: string; nickname: string; result: AttemptResult; completedAt: string; competitive: boolean };
export async function getSharedResult(id: string): Promise<SharedResult | null> {
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = service();
  const link = await db.from("science_shares").select("id,nickname,attempt_id").eq("id", id).eq("enabled", true).maybeSingle();
  if (link.error) checked(link);
  if (!link.data) return null;
  const attempt = await db.from("science_attempts").select("result,completed_at,competitive").eq("id", link.data.attempt_id).eq("state", "completed").maybeSingle();
  if (attempt.error) checked(attempt);
  if (!attempt.data?.result) return null;
  return { id: link.data.id, nickname: link.data.nickname, result: attempt.data.result as AttemptResult, completedAt: attempt.data.completed_at, competitive: attempt.data.competitive };
}

export async function getPublicProfile(id: string) {
  if (!z.string().uuid().safeParse(id).success) return null;
  const db = service();
  const response = await db.from("science_profiles").select("user_id,public_id,nickname,bio,interests").eq("public_id", id).eq("is_public", true).maybeSingle();
  if (response.error) checked(response);
  if (!response.data) return null;
  const profile = response.data as ScienceProfile & { user_id: string };
  const shares = checked(await db.from("science_shares").select("id,nickname,created_at,science_attempts!inner(user_id,result)").eq("enabled", true).eq("science_attempts.user_id", profile.user_id).order("created_at", { ascending: false }).limit(20)) as unknown as { id: string; science_attempts: { result: AttemptResult } }[];
  return { nickname: profile.nickname, bio: profile.bio, interests: profile.interests, shares: shares.map((s) => ({ id: s.id, label: s.science_attempts.result.definition.label })) };
}
