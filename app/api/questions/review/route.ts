import { NextResponse } from "next/server";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",").map((id) => id.trim()).filter(Boolean) || [];
  if (!ids.length) return NextResponse.json({ questions: [] });

  const uniqueIds = [...new Set(ids)].slice(0, 50);
  const bank = await getPublishedQuestions();
  const byId = new Map(bank.map((question) => [question.id, question]));

  const questions = uniqueIds
    .map((id) => byId.get(id))
    .filter((question) => question !== undefined)
    .map((question) => ({
      id: question.id,
      domain: question.domain,
      question: question.question,
      shortExplanation: question.shortExplanation
    }));

  return NextResponse.json({ questions });
}
