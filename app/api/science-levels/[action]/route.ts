import { NextRequest } from "next/server";
import { z } from "zod";
import { context, endpoint, rateLimit, ScienceError } from "@/src/lib/science/server";
import { assessmentInput } from "@/src/lib/science/knowledge-levels";
import { assessmentData, saveAssessment } from "@/src/lib/science/knowledge-assessments";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  return endpoint(request, async () => {
    const action = z.enum(["load", "save"]).parse((await params).action);
    const raw = await request.text();
    if (raw.length > 4096) throw new ScienceError("入力が長すぎます。", 413);
    const body = JSON.parse(raw), ctx = await context(true);
    await rateLimit(ctx, "knowledge_assessment", 30);
    if (action === "load") return assessmentData(ctx, z.object({ attemptId: z.string().uuid() }).strict().parse(body).attemptId);
    return saveAssessment(ctx, assessmentInput.parse(body));
  });
}
