import { definition } from "../../src/lib/science/definition";
import { selectCandidate, type Candidate } from "../../src/lib/science/selection";
import { scoreResponses, type Parameters, type Response } from "../../src/lib/science/model";
import { examProgress } from "../../src/lib/science/exam-progress";
import { readingLoad } from "../../src/lib/science/trial-policy";
import type { Content, AttemptResult } from "../../src/lib/science/types";
import type { ScienceDomain } from "../../src/lib/data/taxonomy";

type Draft = { id: string; domain: ScienceDomain; parameters: Parameters; content: Content };
type SavedAnswer = { id: string; correct: boolean };
function responses(bank: Draft[], answers: SavedAnswer[]): Response[] {
  return answers.flatMap(answer => {
    const q = bank.find(q => q.id === answer.id);
    return q ? [{ ...q.parameters, domain:q.domain, correct:answer.correct, eligible:true }] : [];
  });
}
export function choose(bank: Draft[], answers: SavedAnswer[], history: SavedAnswer[], random = Math.random) {
  const used = new Set(answers.map(a => a.id));
  const candidates: Candidate[] = bank.filter(q => !used.has(q.id)).map(q => ({
    ...q.parameters, revisionId:q.id, familyId:q.id, domain:q.domain, authorId:null,
    focus:false, anchor:false, exposures:0, reading:readingLoad(q.content),
    seenCount:history.filter(a=>a.id===q.id).length
  }));
  const selected = selectCandidate(candidates, responses(bank,answers), definition("trial"), random, responses(bank,history));
  return selected ? { id:selected.candidate.revisionId, predicted:selected.predicted, reason:selected.reason, probability:selected.selectionProbability } : null;
}
export function progress(bank: Draft[], answers: SavedAnswer[]) {
  const records=responses(bank,answers), score=scoreResponses(records);
  const result={...score,definition:definition("trial"),answerCount:records.length,correctCount:records.filter(a=>a.correct).length} as AttemptResult;
  return { ...examProgress(result), domains:score.domains };
}
