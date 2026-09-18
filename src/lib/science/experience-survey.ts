import { z } from "zod";

export const EXPERIENCE_SURVEY_VERSION = "exam-experience-v1";
export const experienceQuestions = [
  { key: "difficulty", label: "問題の難易度", choices: [
    ["very_easy", "簡単すぎた"], ["easy", "やや簡単だった"], ["about_right", "ちょうどよかった"],
    ["hard", "やや難しかった"], ["very_hard", "難しすぎた"]] },
  { key: "tempo", label: "回答テンポ", choices: [
    ["smooth", "さくさく進めた"], ["some_wait", "少し待ち時間が気になった"],
    ["much_wait", "待ち時間がかなり気になった"], ["unsure", "判断できない"]] }
] as const;
export const experienceResponseSchema = z.object({
  version: z.literal(EXPERIENCE_SURVEY_VERSION),
  difficulty: z.enum(["very_easy", "easy", "about_right", "hard", "very_hard"]),
  tempo: z.enum(["smooth", "some_wait", "much_wait", "unsure"]),
  comment: z.string().trim().max(2000).default("")
}).strict();
export type ExperienceResponse = z.infer<typeof experienceResponseSchema>;
export type ExperienceContext = {
  kind: "trial" | "full"; questionCount: number; definitionVersion: string;
  selectionPolicy: string; releaseId: string | null; modelVersion: string;
  resultRevision: number; answerCount: number; correctCount: number;
  score: number | null; low: number | null; high: number | null;
};
export type ExperienceRecord = { response: ExperienceResponse; context: ExperienceContext; submittedAt: string };
export type ExperiencePage = { rows: (ExperienceRecord & { id: string })[]; hasMore: boolean; page: number };
export const experienceLabel = (key: typeof experienceQuestions[number]["key"], value: string) =>
  experienceQuestions.find(q => q.key === key)?.choices.find(c => c[0] === value)?.[1] ?? "未取得";
