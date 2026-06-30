import bank from "../../../supabase/seed/generated/questions-basic-v1.json";
import { knowledgeQuestions } from "./knowledgeQuestions";
import { knowledgeQuestionsV2 } from "./knowledgeQuestionsV2";
import type { AbilityAxis, ScienceDomain } from "./taxonomy";

export type CognitiveType =
  | "用語・定義"
  | "原理・因果"
  | "基本的な適用"
  | "比較・分類"
  | "誤解・境界";

export type QuestionStatistics = {
  answerCount: number;
  correctRate: number | null;
  averageResponseTimeMs: number | null;
  goodCount: number;
  badCount: number;
  goodWeight: number;
  badWeight: number;
  highScorerBadWeight: number;
};

export type BankQuestion = {
  id: string;
  title: string;
  question_text: string;
  choices: string[];
  correct_choice_index: number;
  short_explanation: string;
  detailed_explanation: string;
  domain: ScienceDomain;
  subdomain: string;
  ability_axis: AbilityAxis;
  cognitive_type: CognitiveType;
  learning_objective?: string;
  difficulty_initial: number;
  difficulty_continuous?: number;
  distractor_rationales: string[];
  common_misconception?: string;
  basic_terms?: string;
  source_url: string;
  source_note: string;
  currentness_type: "evergreen" | "current";
  expires_at: string | null;
  tags: string[];
  status?: string;
};

export type Question = {
  id: string;
  title: string;
  question: string;
  choices: string[];
  correctIndex: number;
  shortExplanation: string;
  detailedExplanation: string;
  domain: ScienceDomain;
  subdomain: string;
  abilityAxis: AbilityAxis;
  cognitiveType: CognitiveType;
  learningObjective: string;
  difficultyInitial: number;
  difficulty: number;
  discrimination: number;
  statistics: QuestionStatistics;
  published: boolean;
  qualityScore: number;
  sourceUrl: string;
  sourceNote: string;
  evidenceMemo: string;
  distractorRationales: string[];
  commonMisconception: string;
  basicTerms: string;
  currentnessType: "evergreen" | "current";
  expiresAt: string | null;
  tags: string[];
};

function defaultStatistics(): QuestionStatistics {
  return {
    answerCount: 0,
    correctRate: null,
    averageResponseTimeMs: null,
    goodCount: 0,
    badCount: 0,
    goodWeight: 0,
    badWeight: 0,
    highScorerBadWeight: 0
  };
}

function toQuestion(record: BankQuestion): Question {
  const difficulty = record.difficulty_continuous ?? record.difficulty_initial;
  return {
    id: record.id,
    title: record.title,
    question: record.question_text,
    choices: [...record.choices],
    correctIndex: record.correct_choice_index,
    shortExplanation: record.short_explanation,
    detailedExplanation: record.detailed_explanation,
    domain: record.domain,
    subdomain: record.subdomain,
    abilityAxis: record.ability_axis,
    cognitiveType: record.cognitive_type,
    learningObjective: record.learning_objective ?? "",
    difficultyInitial: record.difficulty_initial,
    difficulty,
    discrimination: 1,
    statistics: defaultStatistics(),
    published: record.status !== "draft" && record.status !== "archived",
    qualityScore: record.status === "draft" ? 0.7 : 0.9,
    sourceUrl: record.source_url ?? "",
    sourceNote: record.source_note,
    evidenceMemo: record.detailed_explanation,
    distractorRationales: [...record.distractor_rationales],
    commonMisconception: record.common_misconception ?? "",
    basicTerms: record.basic_terms ?? "",
    currentnessType: record.currentness_type === "current" ? "current" : "evergreen",
    expiresAt: record.expires_at,
    tags: [...record.tags]
  };
}

export const questions: Question[] = [...(bank as BankQuestion[]), ...knowledgeQuestions, ...knowledgeQuestionsV2].map(toQuestion);
