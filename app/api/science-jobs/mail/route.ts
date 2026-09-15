import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runMailJobs } from "@/src/lib/science/mail-job";
import { inspectMyaspConfiguration } from "@/src/lib/science/myasp-connection";
import { service } from "@/src/lib/science/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: "job_not_configured" }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`), given = Buffer.from(request.headers.get("authorization") ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const check = new URL(request.url).searchParams.get("check");
    if (check !== null) {
      if (check !== "fields") return NextResponse.json({ error: "invalid_check" }, { status: 400 });
      const result = await inspectMyaspConfiguration(service());
      return NextResponse.json(result, { status: result.state === "connected" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
    }
    const result = await runMailJobs();
    return NextResponse.json(result, { status: ["myasp_not_configured", "myasp_sync_failed"].includes(result.state) ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "mail_job_failed" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
