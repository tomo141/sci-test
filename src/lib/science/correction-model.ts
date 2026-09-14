import { scoreResponses } from "./model";
import type { Answer,Attempt,AttemptResult,Issued } from "./types";
import type { RevisionUpdate } from "./corrections";

export function correctedResult(attempt:Attempt,issued:Issued[],answers:Answer[],state:{epoch:number;updates:Map<string,RevisionUpdate>;ineligibleOrdinals?:Set<number>}):AttemptResult{
  const excluded=new Set(issued.filter(i=>state.updates.get(i.revision_id)?.excluded).map(i=>i.ordinal));
  const responses=answers.map(answer=>{
    const q=issued.find(i=>i.ordinal===answer.ordinal);
    if(!q)throw new Error("保存記録の確認が必要です。");
    return {...q.snapshot,correct:answer.is_correct,eligible:q.eligible&&!excluded.has(q.ordinal)&&!state.ineligibleOrdinals?.has(q.ordinal),answeredAt:answer.answered_at};
  });
  const updates=issued.flatMap(i=>state.updates.has(i.revision_id)?[state.updates.get(i.revision_id)!]:[]);
  return {...scoreResponses(responses),definition:attempt.definition,originalAnswerCount:attempt.total,
    answerCount:answers.filter(a=>!excluded.has(a.ordinal)).length,correctCount:answers.filter(a=>a.is_correct&&!excluded.has(a.ordinal)).length,
    correctionEpoch:state.epoch,identityAdjustments:{excludedCount:state.ineligibleOrdinals?.size??0},corrections:{count:updates.length,excludedCount:excluded.size,updatedAt:updates.map(u=>u.approved_at).sort().at(-1)??null}};
}
