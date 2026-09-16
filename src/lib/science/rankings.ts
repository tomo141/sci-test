import { checked, service, ScienceError } from "./server";
import { activeModel } from "./active-model";
import { periodBounds } from "./definition";
export type RankingRow = {place:number;nickname:string;profile_id:string|null;share_id:string|null;score:number;exam_length:number;effective_length:number};
export async function rankings(kind:"weekly"|"full",period:"day"|"week"|"month",length:50|100=50){
  const bounds=periodBounds(kind==="weekly"?"week":period);
  const db=service();
  const version=await activeModel(db);
  const pending=await db.from("science_attempts").select("id",{count:"exact",head:true}).eq("kind",kind).eq("needs_recalculation",true).gte("completed_at",bounds.start).lt("completed_at",bounds.end);
  if(pending.error)checked(pending);
  if(pending.count===null)throw new ScienceError("Ranking update count unavailable",503);
  const rows=checked(await db.rpc("science_rankings",{p_kind:kind,p_start:bounds.start,p_end:bounds.end,p_length:kind==="weekly"?10:length,p_model:version,p_week:kind==="weekly"?bounds.key:null})) as RankingRow[];
  return {rows,bounds,pending:pending.count};
}
