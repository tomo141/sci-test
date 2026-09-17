import { checked, rateLimit, type Context } from "./server";

export async function recordScienceVisit(ctx: Context, now = new Date()) {
  await rateLimit(ctx, "visit", 60);
  const hour = now.toISOString().slice(0, 13);
  checked(await ctx.db.from("science_events").upsert({
    dedupe_key: `visit:${ctx.visitor.id}:${hour}`, event_name: "site_visit",
    visitor_id: ctx.visitor.id, user_id: ctx.userId,
    payload: { version: "hourly-site-visit-v1" }
  }, { onConflict: "dedupe_key", ignoreDuplicates: true }).select("id"));
  return { saved: true };
}
