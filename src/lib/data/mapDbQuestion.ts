import type { CognitiveType, Question, QuestionStatistics } from "./questions";
import type { AbilityAxis, ScienceDomain } from "./taxonomy";

type DbChoiceRow = {
  choice_index: number;
  choice_text: string;
  is_correct: boolean;
};

type DbSourceRow = {
  source_url: string | null;
  source_note: string | null;
  evidence_memo: string | null;
};

type DbStatisticsRow = {
  answer_count: number;
  correct_rate: number | null;
  average_response_time_ms: number | null;
  good_count: number;
  bad_count: number;
  good_weight: number;
  bad_weight: number;
  high_scorer_bad_weight: number;
} | null;

export type DbQuestionRow = {
  id: string;
  title: string;
  question_text: string;
  domain: string;
  ability_axis: string;
  difficulty_initial: number;
  difficulty_internal: number;
  discrimination: number;
  status: string;
  quality_score: number;
  currentness_type: string | null;
  expires_at: string | null;
  question_choices: DbChoiceRow[];
  question_sources: DbSourceRow | DbSourceRow[] | null;
  question_statistics: DbStatisticsRow | DbStatisticsRow[];
};

type EvidenceMemo = {
  short_explanation?: string;
  detailed_explanation?: string;
  distractor_rationales?: string[];
  common_misconception?: string;
  subdomain?: string;
  cognitive_type?: CognitiveType;
  learning_objective?: string;
  basic_terms?: string;
  tags?: string[];
  difficulty_continuous?: number;
};

const COGNITIVE_TYPES = new Set<CognitiveType>([
  "用語・定義",
  "原理・因果",
  "基本的な適用",
  "比較・分類",
  "誤解・境界"
]);

function parseEvidenceMemo(raw: string | null | undefined): EvidenceMemo {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as EvidenceMemo;
  } catch {
    return { detailed_explanation: raw };
  }
}

function parseSubdomainFromSourceNote(sourceNote: string | null | undefined) {
  if (!sourceNote) return "";
  const match = sourceNote.match(/小テーマ:\s*([^/]+)/);
  return match?.[1]?.trim() ?? "";
}

function parseCognitiveTypeFromSourceNote(sourceNote: string | null | undefined): CognitiveType {
  if (!sourceNote) return "用語・定義";
  const match = sourceNote.match(/問題タイプ:\s*([^/]+)/);
  const value = match?.[1]?.trim() ?? "用語・定義";
  return COGNITIVE_TYPES.has(value as CognitiveType) ? (value as CognitiveType) : "用語・定義";
}

function toStatistics(row: DbStatisticsRow): QuestionStatistics {
  if (!row) {
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
  return {
    answerCount: row.answer_count,
    correctRate: row.correct_rate,
    averageResponseTimeMs: row.average_response_time_ms,
    goodCount: row.good_count,
    badCount: row.bad_count,
    goodWeight: row.good_weight,
    badWeight: row.bad_weight,
    highScorerBadWeight: row.high_scorer_bad_weight
  };
}

export function mapDbQuestionRow(row: DbQuestionRow): Question {
  const source = Array.isArray(row.question_sources)
    ? row.question_sources[0]
    : row.question_sources;
  const statistics = Array.isArray(row.question_statistics)
    ? row.question_statistics[0] ?? null
    : row.question_statistics;
  const evidence = parseEvidenceMemo(source?.evidence_memo);
  const choices = [...(row.question_choices ?? [])].sort((a, b) => a.choice_index - b.choice_index);
  const correctIndex = choices.findIndex((choice) => choice.is_correct);
  const difficulty = evidence.difficulty_continuous ?? row.difficulty_internal ?? row.difficulty_initial;

  return {
    id: row.id,
    title: row.title,
    question: row.question_text,
    choices: choices.map((choice) => choice.choice_text),
    correctIndex: correctIndex >= 0 ? correctIndex : 0,
    shortExplanation: evidence.short_explanation ?? "",
    detailedExplanation: evidence.detailed_explanation ?? evidence.short_explanation ?? "",
    domain: row.domain as ScienceDomain,
    subdomain: evidence.subdomain || parseSubdomainFromSourceNote(source?.source_note),
    abilityAxis: row.ability_axis as AbilityAxis,
    cognitiveType: evidence.cognitive_type || parseCognitiveTypeFromSourceNote(source?.source_note),
    learningObjective: evidence.learning_objective ?? "",
    difficultyInitial: row.difficulty_initial,
    difficulty,
    discrimination: row.discrimination,
    statistics: toStatistics(statistics),
    published: row.status === "published" || row.status === "reduced",
    qualityScore: row.quality_score,
    sourceUrl: source?.source_url ?? "",
    sourceNote: source?.source_note ?? "",
    evidenceMemo: evidence.detailed_explanation ?? "",
    distractorRationales: evidence.distractor_rationales ?? [],
    commonMisconception: evidence.common_misconception ?? "",
    basicTerms: evidence.basic_terms ?? "",
    currentnessType: row.currentness_type === "current" ? "current" : "evergreen",
    expiresAt: row.expires_at,
    tags: evidence.tags ?? []
  };
}
