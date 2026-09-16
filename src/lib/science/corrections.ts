import { checked, ScienceError, type Context } from "./server";
import { correctedResult } from "./correction-model";
export { correctedResult } from "./correction-model";
import type { Answer, Attempt, Content, Issued } from "./types";

export type RevisionUpdate={source_revision:string;replacement_revision:string;excluded:boolean;reason:string;approved_at:string;content:Content;credit_name:string};
export async function correctionState(db:Context["db"],revisions:string[],attemptId?:string,capturedEpoch?:number){
  // Read epoch first. A concurrent approval will invalidate the eventual result commit.
  const epoch=capturedEpoch ?? checked(await db.rpc("science_correction_epoch")) as number;
  const [rows,excluded]=await Promise.all([
    revisions.length?db.from("science_revision_updates").select("*").in("source_revision",[...new Set(revisions)]).then(r=>checked(r) as RevisionUpdate[]):Promise.resolve([] as RevisionUpdate[]),
    attemptId?db.from("science_response_exclusions").select("ordinal").eq("attempt_id",attemptId).then(r=>checked(r) as {ordinal:number}[]):Promise.resolve([] as {ordinal:number}[])
  ]);
  return {epoch,updates:new Map(rows.map(row=>[row.source_revision,row])),ineligibleOrdinals:new Set(excluded.map(r=>r.ordinal))};
}
export async function refreshCorrectedAttempt(db:Context["db"],attempt:Attempt):Promise<Attempt>{
  if(!attempt.needs_recalculation||attempt.state!=="completed")return attempt;
  const state=await correctionState(db,[],attempt.id);
  const [i,r]=await Promise.all([db.from("science_issued").select("*").eq("attempt_id",attempt.id).order("ordinal"),db.from("science_answers").select("*").eq("attempt_id",attempt.id).order("ordinal")]);
  const issued=checked(i) as Issued[],answers=checked(r) as Answer[];
  const changes=issued.length?checked(await db.from("science_revision_updates").select("*").in("source_revision",issued.map(q=>q.revision_id))) as RevisionUpdate[]:[];
  state.updates=new Map(changes.map(c=>[c.source_revision,c]));
  const result=correctedResult(attempt,issued,answers,state);
  checked(await db.rpc("science_store_corrected_result",{p_attempt:attempt.id,p_result:result,p_previous:attempt.result_revision,p_epoch:state.epoch}));
  const updated=checked(await db.from("science_attempts").select("*").eq("id",attempt.id).single()) as Attempt;
  if(updated.needs_recalculation)throw new ScienceError("問題の訂正に合わせて成績を再計算しています。再読み込みしてください。",409,"correction_pending");
  return updated;
}
