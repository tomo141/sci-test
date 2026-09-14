import { createHash,createHmac, randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/src/lib/supabase/server";
import type { Visitor, ReleaseConfig } from "./types";

export class ScienceError extends Error {
  constructor(message: string, public status = 400, public code = "invalid_request", public extra?: Record<string, unknown>) { super(message); }
}
export function service() {
  const client = createServiceRoleClient();
  if (!client) throw new ScienceError("現在、保存先に接続できません。時間を置いてお試しください。", 503, "unavailable");
  return client;
}
export function checked<T>(response: { data: T | null; error: { code?: string; message?: string } | null }): NonNullable<T> {
  if (response.error || response.data === null) {
    const message = response.error?.message;
    if (response.error?.code === "40001" || message === "already_seen") throw new ScienceError("進捗が更新されています。再読み込みして続けてください。", 409, "conflict");
    if (response.error?.code === "P0002") throw new ScienceError("受験が見つかりません。", 404, "not_found");
    if (message === "week_closed") throw new ScienceError("この週の受付は終了しました。今週の10問へお進みください。", 409, "week_closed");
    if (message === "independent_review_required") throw new ScienceError("作者・報告者とは別の管理者が確認してください。",403,"independent_review_required");
    if (message === "submission_not_open") throw new ScienceError("投稿受付の条件を確認中です。下書きは保存されています。",409,"submission_not_open");
    throw new ScienceError("データを保存・取得できませんでした。時間を置いて再試行してください。", 503, "database_error");
  }
  return response.data as NonNullable<T>;
}

export type Context = { db: ReturnType<typeof service>; visitor: Visitor; userId: string | null; tokenHash: string };
const cookieName = "science-visitor-v2";

export async function context(create = false, refShare?: string): Promise<Context> {
  const db = service();
  const auth = await createServerSupabaseClient();
  const userResponse = await auth?.auth.getUser();
  if(userResponse?.error && (userResponse.error.name==="AuthRetryableFetchError"||(userResponse.error.status??0)>=500))throw new ScienceError("ログイン状態を確認できません。通信の回復後に再試行してください。",503,"auth_unavailable");
  const user = userResponse?.data.user;
  const userId = user?.email_confirmed_at ? user.id : null;
  const jar = await cookies();
  let token = jar.get(cookieName)?.value;
  let tokenHash = token ? createHash("sha256").update(token).digest("hex") : "";
  let visitor: Visitor | null = null;
  if (token && /^[0-9a-f]{64}$/.test(token)) {
    const result = await db.from("science_visitors").select("id,user_id,route_group,experiment,full_length,ref_share,created_at").eq("token_hash", tokenHash).maybeSingle();
    if (result.error) checked(result);
    visitor = result.data as Visitor | null;
    if (visitor?.user_id && visitor.user_id !== userId) visitor = null;
  }
  if (!visitor) {
    if (!create) throw new ScienceError("受験を始めた端末から開くか、ログインしてください。", 401, "identity_required");
    token = randomBytes(32).toString("hex");
    tokenHash = createHash("sha256").update(token).digest("hex");
    const config = await releaseConfig(db);
    let canonical: Visitor | null = null;
    if (userId) {
      const result = await db.from("science_visitors").select("*").eq("user_id", userId).order("created_at").limit(1).maybeSingle();
      if (result.error) checked(result);
      canonical = result.data;
    }
    let attribution: string | null = null;
    if (refShare && /^[a-f0-9-]{36}$/i.test(refShare)) {
      const link = await db.from("science_shares").select("id,science_attempts!inner(user_id)").eq("id", refShare).eq("enabled", true).maybeSingle();
      if (link.error) checked(link);
      const record = link.data as unknown as { id: string; science_attempts: { user_id: string | null } } | null;
      if (record && (!userId || record.science_attempts.user_id !== userId)) attribution = record.id;
    }
    visitor = checked(await db.from("science_visitors").insert({ token_hash: tokenHash, route_group: canonical?.route_group ?? ["A", "B", "C", "D"][randomInt(4)], full_length: canonical?.full_length ?? config.fullLength, experiment: canonical?.experiment ?? config.experiment, ref_share: attribution }).select("*").single()) as Visitor;
    jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 365 * 24 * 3600 });
  }
  if (userId && !visitor.user_id) {
    if (!create) return { db, visitor, userId, tokenHash };
    checked(await db.rpc("science_claim_visitor", { p_visitor: visitor.id, p_hash: tokenHash, p_user: userId }));
    visitor = checked(await db.from("science_visitors").select("*").eq("id", visitor.id).single()) as Visitor;
  }
  return { db, visitor, userId, tokenHash };
}

export async function releaseConfig(db = service()): Promise<ReleaseConfig> {
  const record = checked<{ value: ReleaseConfig }>(await db.from("science_config").select("value").eq("key", "release").single());
  return record.value as ReleaseConfig;
}

export function requireUser(ctx: Context) {
  if (!ctx.userId) throw new ScienceError("確認コードでメールアドレスを確認すると利用できます。", 401, "registration_required");
  return ctx.userId;
}

export async function requireAdmin(ctx: Context) {
  const userId = requireUser(ctx);
  const result = await ctx.db.from("science_admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (result.error) checked(result);
  if (!result.data) throw new ScienceError("管理者権限が必要です。", 403, "forbidden");
  return userId;
}

export async function rateLimit(ctx: Context, action: string, limit: number, seconds = 60) {
  const ok = checked(await ctx.db.rpc("science_rate_limit", { p_key: `${action}:${ctx.userId ?? ctx.visitor.id}`, p_seconds: seconds, p_limit: limit }));
  if (!ok) throw new ScienceError("操作が続いています。少し待ってからお試しください。", 429, "rate_limited");
}

export async function endpoint(request: NextRequest, fn: () => Promise<unknown>) {
  try {
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      if (!origin || origin !== new URL(request.url).origin) throw new ScienceError("画面を再読み込みして操作してください。", 403, "origin_required");
      if (Number(request.headers.get("content-length")) > 32_768) throw new ScienceError("入力が長すぎます。", 413);
      const ip=(request.headers.get("x-vercel-forwarded-for")??request.headers.get("x-forwarded-for")??"unknown").split(",")[0].trim();
      const digest=createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY??"local-unconfigured").update(ip).digest("hex");
      const allowed=checked(await service().rpc("science_rate_limit",{p_key:`request:${digest}`,p_seconds:60,p_limit:240}));
      if(!allowed)throw new ScienceError("操作が集中しています。少し待ってからお試しください。",429,"rate_limited");
    }
    return NextResponse.json(await fn(), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof ScienceError) return NextResponse.json({ error: error.message, code: error.code, ...error.extra }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "入力内容を確認してください。", code: "invalid_input" }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "送信内容を確認してください。", code: "invalid_json" }, { status: 400 });
    const id = randomBytes(8).toString("hex");
    console.error("science_request_failed", { id, type: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: `処理を完了できませんでした。再試行してください。（確認番号 ${id}）`, code: "internal_error" }, { status: 500 });
  }
}
