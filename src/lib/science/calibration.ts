import { posterior,probability,summarizeDomain,type Parameters,type Response } from "./model";

export type CalibrationAnswer=Response&{owner:string;familyId:string;revisionId:string;answeredAt:string};
export type CalibrationObservation={owner:string;answeredAt:string;correct:boolean;prior:ReturnType<typeof posterior>;other:Response[];ability:number};
export function calibrationObservations(rows:CalibrationAnswer[],revisionId:string){
  const byOwner=new Map<string,CalibrationAnswer[]>();
  for(const row of rows.filter(r=>r.eligible).sort((a,b)=>a.answeredAt.localeCompare(b.answeredAt)))byOwner.set(row.owner,[...(byOwner.get(row.owner)??[]),row]);
  const observations:CalibrationObservation[]=[];
  for(const [owner,answers] of byOwner){
    const target=answers.find(r=>r.revisionId===revisionId);if(!target)continue;
    const seen=new Set<string>();
    const other=answers.filter(r=>r.domain===target.domain&&r.familyId!==target.familyId&&r.answeredAt<target.answeredAt&&!seen.has(r.familyId)&&(seen.add(r.familyId),true)).slice(-100);
    if(other.length<8)continue;
    const distribution=posterior(other),mean=distribution.theta.reduce((sum,x,i)=>sum+x*distribution.mass[i],0);
    const variance=distribution.theta.reduce((sum,x,i)=>sum+(x-mean)**2*distribution.mass[i],0);
    if(variance>1)continue;
    observations.push({owner,answeredAt:target.answeredAt,correct:target.correct,prior:distribution,other,ability:mean});
  }
  return observations.sort((a,b)=>a.answeredAt.localeCompare(b.answeredAt)||a.owner.localeCompare(b.owner));
}
const prediction=(r:CalibrationObservation,p:Parameters)=>r.prior.theta.reduce((sum,theta,i)=>sum+probability(theta,p)*r.prior.mass[i],0);
const loss=(r:CalibrationObservation,p:Parameters)=>-Math.log(Math.max(1e-9,r.correct?prediction(r,p):1-prediction(r,p)));
const average=(a:number[])=>a.reduce((sum,v)=>sum+v,0)/a.length;
export function calibrateDifficulty(observations:CalibrationObservation[],parameters:Parameters,anchor=false){
  const base={count:observations.length,a:parameters.a,c:parameters.c,oldB:parameters.b,b:parameters.b,eligible:false,reason:"collecting",trainCount:0,testCount:0,bandCounts:[0,0,0],improvement:null as number|null,lowerImprovement:null as number|null,standardError:null as number|null,maxScoreChange:null as number|null};
  if(anchor)return {...base,reason:"anchor_fixed"};
  if(observations.length<200)return base;
  const cutoff=Math.floor(observations.length*.8),train=observations.slice(0,cutoff),test=observations.slice(cutoff);
  const band=(r:CalibrationObservation)=>r.ability<parameters.b-.75?0:r.ability>parameters.b+.75?2:1;
  const bandCounts=[0,1,2].map(b=>observations.filter(r=>band(r)===b).length);
  const result={...base,trainCount:train.length,testCount:test.length,bandCounts};
  if(test.length<40||train.length<120||bandCounts.some(n=>n<20))return {...result,reason:"coverage_needed"};
  // Both a and c remain fixed. Regularization prevents a small or selected sample from driving b to extremes.
  const objective=(b:number)=>train.reduce((sum,r)=>sum+loss(r,{...parameters,b}),0)+(b-parameters.b)**2/(2*.5**2);
  let best=parameters.b,bestLoss=objective(best);
  for(let step=-10;step<=10;step++){
    const b=Math.max(-5,Math.min(5,parameters.b+step*.05)),value=objective(b);
    if(value<bestLoss){best=b;bestLoss=value;}
  }
  const next={...parameters,b:best},improvements=test.map(r=>loss(r,parameters)-loss(r,next)),improvement=average(improvements);
  const deviation=Math.sqrt(improvements.reduce((sum,v)=>sum+(v-improvement)**2,0)/(test.length-1));
  const lowerImprovement=improvement-1.96*deviation/Math.sqrt(test.length);
  const curvature=(objective(best+.01)-2*objective(best)+objective(best-.01))/.0001;
  const standardError=curvature>0?1/Math.sqrt(curvature):Infinity;
  const brierChange=average(test.map(r=>(prediction(r,parameters)-Number(r.correct))**2-(prediction(r,next)-Number(r.correct))**2));
  const bandGuard=[0,1,2].every(b=>{const subset=test.filter(r=>band(r)===b);return subset.length>=8&&average(subset.map(r=>loss(r,parameters)-loss(r,next)))>=-.01;});
  const maxScoreChange=Math.max(...test.map(r=>{const response={...parameters,domain:r.other[0].domain,correct:r.correct,eligible:true};return Math.abs(summarizeDomain([...r.other,response]).mean-summarizeDomain([...r.other,{...response,b:best}]).mean);}));
  const eligible=Math.abs(best-parameters.b)>=.05&&improvement>=.01&&lowerImprovement>0&&brierChange>0&&standardError<=.35&&bandGuard&&maxScoreChange<=3;
  return {...result,b:best,improvement,lowerImprovement,standardError,maxScoreChange,eligible,reason:eligible?"heldout_guards_passed":"validation_needed"};
}
