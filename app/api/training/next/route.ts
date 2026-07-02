import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";
import { seededShuffleChoices, toPublicQuestion } from "@/src/lib/exam/publicQuestion";
import { enforceRateLimit, rateLimitPolicies } from "@/src/lib/security/rateLimit";

const nextSchema = z.object({
  mode: z.enum(["domain", "random"]),
  domain: z.string().optional(),
  questionIndex: z.number().int().nonnegative().default(0),
  sessionSeed: z.string().default("training")
});

function shuffleQuestionIds(questionIds: string[], sessionSeed: string) {
  const ids = [...questionIds];
  let hash = 0;
  for (let index = 0; index < sessionSeed.length; index += 1) {
    hash = (hash * 31 + sessionSeed.charCodeAt(index)) >>> 0;
  }

  for (let index = ids.length - 1; index > 0; index -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const swapIndex = Math.floor((hash / 0x100000000) * (index + 1));
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }

  return ids;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit("training-next", "training-next", rateLimitPolicies.trainingNext, request);
  if (limited) return limited;

  const parsed = nextSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid training next payload" }, { status: 400 });

  const published = (await getPublishedQuestions()).filter((question) => question.published);
  const pool =
    parsed.data.mode === "domain"
      ? published.filter((question) => question.domain === parsed.data.domain)
      : shuffleQuestionIds(
          published.map((question) => question.id),
          parsed.data.sessionSeed
        ).map((id) => published.find((question) => question.id === id)).filter((question) => question !== undefined);

  if (!pool.length) return NextResponse.json({ error: "no question available" }, { status: 404 });

  const question = pool[parsed.data.questionIndex % pool.length];
  const shuffled = seededShuffleChoices(question.id, `${parsed.data.sessionSeed}:${parsed.data.mode}`, question);

  return NextResponse.json({
    question: toPublicQuestion(question, shuffled.choices),
    domain: question.domain,
    poolSize: pool.length
  });
}
