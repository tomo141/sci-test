import { NextResponse } from "next/server";
import { getPublishedQuestions } from "@/src/lib/data/loadQuestions";

export async function GET() {
  const questions = await getPublishedQuestions();
  return NextResponse.json({ questions, count: questions.length });
}
