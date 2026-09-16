import type { ScienceDomain } from "@/src/lib/data/taxonomy";
import type { ExamDefinition, ExamKind, RouteGroup } from "./definition";
import type { Parameters, ScienceResult } from "./model";

export type Content = { question: string; choices: string[]; correctIndex: number; explanation: string; distractorRationales: string[]; sources: { title: string; url?: string }[] };
export type Item = { id: string; family_id: string; domain: ScienceDomain; subdomain: string; content: Content; author_id: string | null; status: string; quality_passed: boolean; rights_checked: boolean; expires_at: string | null; created_at: string };
export type Visitor = { id: string; user_id: string | null; route_group: RouteGroup; experiment: string; full_length: 50 | 100; ref_share: string | null; created_at: string };
export type AttemptResult = ScienceResult & { answerCount: number; correctCount: number; definition: ExamDefinition; originalAnswerCount?:number; correctionEpoch?:number; identityAdjustments?:{excludedCount:number}; corrections?:{count:number;excludedCount:number;updatedAt:string|null} };
export type Attempt = { id: string; visitor_id: string; user_id: string | null; definition: ExamDefinition; kind: ExamKind; total: number; domain: ScienceDomain | null; release_id: string | null; model_version: string; week_id: string | null; state: "active" | "completed" | "abandoned"; ordinal: number; competitive: boolean; started_at: string; completed_at: string | null; result: AttemptResult | null; result_revision:number; needs_recalculation:boolean };
export type Issued = { attempt_id: string; ordinal: number; revision_id: string; family_id: string; token: string; choice_order: number[]; snapshot: Parameters & { domain: ScienceDomain; subdomain: string; content: Content; authorId: string | null; creditName?:string; aiAssisted?:boolean }; eligible: boolean; exclusion_reason: string | null; issued_at: string };
export type Answer = { attempt_id: string; ordinal: number; operation_id: string; selected_index: number | null; is_correct: boolean | null; skip_reason: "question_withdrawn" | null; answered_at: string };
export type ReleaseConfig = { newAttempts: boolean; fullLength: 50 | 100; experiment: string; labSubmissions: boolean; licenseVersion: string | null; mailDelivery: boolean; myaspSync?:boolean; automaticCalibration?:boolean };
export type PublicAttempt = Pick<Attempt, "id" | "definition" | "ordinal" | "state" | "competitive" | "completed_at" | "result">;
export type PublicQuestion = { ordinal: number; token: string; domain: string; subdomain: string; question: string; choices: string[]; level: number; creditName?:string; aiAssisted?:boolean; withdrawn?:boolean };
export type AnswerExplanation = { ordinal: number; correct: boolean | null; selectedAnswer: string; correctAnswer: string; content: Content; revisionId: string; correctionNote?: string;
  display: Omit<PublicQuestion, "token"> & { selectedIndex: number; correctIndex: number | null } };
export type ExamProgress = { answerCount: number; correctCount: number; score: { value: number; low: number; high: number; scale: "total" | "domain"; unmeasuredDomains: number } | null };
export type ExamState = { attempt: PublicAttempt; question: PublicQuestion | null; group: RouteGroup; signedIn: boolean; explanation?: AnswerExplanation; progress?: ExamProgress };
