// Offline simulation of the actual selection and scoring functions. No real respondents or database writes.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { definition } from "../src/lib/science/definition";
import { selectCandidate, type Candidate } from "../src/lib/science/selection";
import { probability, referenceScore, scoreResponses, type Response } from "../src/lib/science/model";
import { domains, type ScienceDomain } from "../src/lib/data/taxonomy";

const input = readFileSync("implementation/local/question-bank/candidate.json", "utf8");
const source = JSON.parse(input);
const bank: Candidate[] = source.candidates.filter((q: {use:string}) => q.use === "formal").map((q: {id:string;family_id:string;domain:ScienceDomain;parameters:Candidate}) => ({ ...q.parameters, revisionId:q.id, familyId:q.family_id,domain:q.domain,authorId:null,exposures:0 }));
if (bank.length !== 1000) throw new Error(`Unexpected formal bank count: ${bank.length}`);
const random = (seed:number) => () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32; };
function run(count:20|50|100, seed:number, ability:number | "correct" | "wrong") {
  const rng = random(seed), exam = definition(count === 20 ? "trial" : "full", null, count === 100 ? 100 : 50);
  const responses:Response[] = [], used = new Set<string>();
  for (let i=0;i<count;i++) {
    const next = selectCandidate(bank.filter(q=>!used.has(q.familyId)), responses, exam, rng);
    if (!next) throw new Error("Selection stopped");
    const q = next.candidate;
    used.add(q.familyId);
    responses.push({...q,eligible:true,correct:typeof ability === "number" ? rng() < probability(ability,q) : ability === "correct"});
  }
  const score=scoreResponses(responses);
  return {total:score.total!,width:score.high!-score.low!,domainWidth:domains.reduce((s,d)=>s+score.domains[d].high!-score.domains[d].low!,0)/10,
    actualCorrect:responses.filter(r=>r.correct).length};
}
const extreme=[];
for(const count of [20,50,100] as const)for(const pattern of ["wrong","correct"] as const){
  const runs=Array.from({length:5},(_,i)=>run(count,100+i,pattern));
  extreme.push({count,pattern,min:Math.min(...runs.map(r=>r.total)),max:Math.max(...runs.map(r=>r.total)),runs});
  console.log(JSON.stringify(extreme.at(-1)));
}
const simulations=[];
for(const count of [50,100] as const)for(const theta of [-2,0,2,3]){
  const runs=Array.from({length:12},(_,i)=>run(count,7300+i,theta)),truth=referenceScore(theta)*10;
  const mean=runs.reduce((s,r)=>s+r.total,0)/runs.length;
  simulations.push({count,theta,truth,mean,bias:mean-truth,rmse:Math.sqrt(runs.reduce((s,r)=>s+(r.total-truth)**2,0)/runs.length),meanIntervalWidth:runs.reduce((s,r)=>s+r.width,0)/runs.length,meanDomainIntervalWidth:runs.reduce((s,r)=>s+r.domainWidth,0)/runs.length});
  console.log(JSON.stringify(simulations.at(-1)));
}
mkdirSync("implementation/checks",{recursive:true});
writeFileSync("implementation/checks/score-audit-20260916.json",JSON.stringify({generatedAt:new Date().toISOString(),sourceHash:createHash("sha256").update(input).digest("hex"),model:"science-3pl-reference-v1",gridUpper:5,absoluteTotalCeiling:10*Math.round(referenceScore(5)),parametersAreProvisional:true,participantsAreSimulated:true,extreme,simulations},null,2)+"\n");
