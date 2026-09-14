export type QualityEvidence = { role:"author"|"reviewer"; positive:boolean };
function component(evidence:QualityEvidence[]){
  const positive=evidence.filter(e=>e.positive).length;
  const alpha=2+positive,beta=2+evidence.length-positive;
  return {mean:alpha/(alpha+beta),variance:alpha*beta/((alpha+beta)**2*(alpha+beta+1)),count:evidence.length,positive};
}
export function trustScore(evidence:QualityEvidence[],knowledge:{domain:number|null;overall:number|null}={domain:null,overall:null}){
  const author=component(evidence.filter(e=>e.role==="author"));
  const reviewer=component(evidence.filter(e=>e.role==="reviewer"));
  const k=.8*(knowledge.domain===null?.5:Math.max(0,Math.min(1,knowledge.domain/100)))+.2*(knowledge.overall===null?.5:Math.max(0,Math.min(1,knowledge.overall/1000)));
  const mean=100*(.6*author.mean+.3*reviewer.mean+.1*k);
  const variance=10000*(.36*author.variance+.09*reviewer.variance);
  const count=evidence.length;
  return {score:Math.round(mean),author,reviewer,knowledge:k,knowledgeMeasured:knowledge.domain!==null||knowledge.overall!==null,
    // This is a measure of evidence strength, not a validated probability of trustworthiness.
    evidenceStrength:count/(count+8),qualityStandardDeviation:Math.sqrt(variance),count};
}
export function trustExposureWeight(score:ReturnType<typeof trustScore>){
  return 1+2*Math.max(0,(score.score-50)/50)*score.evidenceStrength;
}

export function laboratoryChoice<T extends {trustWeight:number}>(candidates:T[],random=Math.random){
  if(!candidates.length)return null;
  const weights=candidates.map(c=>Math.max(1,Math.min(3,c.trustWeight)));
  const total=weights.reduce((a,b)=>a+b,0);
  const probabilities=weights.map(w=>.25/candidates.length+.75*w/total);
  let roll=Math.min(1-Number.EPSILON,Math.max(0,random()));
  let index=probabilities.length-1;
  for(let i=0;i<probabilities.length;i++){roll-=probabilities[i];if(roll<0){index=i;break;}}
  return {candidate:candidates[index],probability:probabilities[index]};
}
