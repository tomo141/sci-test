import { NextResponse } from "next/server";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";
import { toQuestionCatalogEntry } from "@/src/lib/exam/publicQuestion";

export async function GET() {
  const questions = await getPublishedQuestions();
  const catalog = questions.map(toQuestionCatalogEntry);
  return NextResponse.json({
    questions: catalog,
    count: catalog.length,
    note: "Use /api/exam/next or /api/training/next for question delivery."
  });
}
