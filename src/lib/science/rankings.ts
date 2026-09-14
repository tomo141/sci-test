import { checked, service } from "./server";
import { MODEL_VERSION } from "./model";
import { periodBounds } from "./definition";
export type RankingRow = {place:number;nickname:string;profile_id:string|null;share_id:string|null;score:number;exam_length:number};
export async function rankings(kind:"weekly"|"full",period:"day"|"week"|"month",length:50|100=50){
  const bounds=periodBounds(kind==="weekly"?"week":period);
  const rows=checked(await service().rpc("science_rankings",{p_kind:kind,p_start:bounds.start,p_end:bounds.end,p_length:kind==="weekly"?10:length,p_model:MODEL_VERSION,p_week:kind==="weekly"?bounds.key:null})) as RankingRow[];
  return {rows,bounds};
}
