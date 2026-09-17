import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { it, expect } from "vitest";
import { domains, type ScienceDomain } from "@/src/lib/data/taxonomy";
import { definition } from "./definition";
import { expectedScoreVarianceReduction, posterior, probability, scoreResponses, type Response } from "./model";
import { selectCandidate, type Candidate } from "./selection";
import { isShort, readingLoad } from "./trial-policy";
import type { Content } from "./types";

// An optional audit of the prepared, frozen bank. Deliberately not a claim about real users.
const enabled = process.env.SCIENCE_TRIAL_BANK_AUDIT === "1";
it.skipIf(!enabled)("completes balanced trials against the prepared bank and reports model-only tradeoffs", () => {
  const path = "implementation/local/question-bank/candidate.json";
  expect(existsSync(path)).toBe(true);
  const raw = readFileSync(path,"utf8");
  const source = JSON.parse(raw) as { candidates: { use: string; id: string; family_id: string; domain: ScienceDomain; parameters: Candidate; content: Content }[] };
  const bank = source.candidates.filter(q => q.use === "formal").map(q => ({...q.parameters, revisionId:q.id, familyId:q.family_id,domain:q.domain,authorId:null,exposures:0,reading:readingLoad(q.content)}));
  expect(bank).toHaveLength(1000);
  const prior = posterior([]);
  const initialCoverage = domains.map(domain => {
    const pool = bank.filter(q => q.domain === domain).map(candidate => ({candidate,...expectedScoreVarianceReduction(prior,candidate)}));
    const inRange = pool.filter(q => q.predicted >= .75 && q.predicted <= .85);
    return {domain,bank:pool.length,short:pool.filter(q=>isShort(q.candidate.reading)).length,inRange:inRange.length,shortInRange:inRange.filter(q=>isShort(q.candidate.reading)).length,
      minPredicted:Math.min(...pool.map(q=>q.predicted)),maxPredicted:Math.max(...pool.map(q=>q.predicted))};
  });
  const random = (seed:number) => () => {seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/2**32;};
  function run(theta:number,seed:number,fluent:boolean) {
    const rng=random(seed), used=new Set<string>(), responses:Response[]=[], predictions:number[]=[], tiers:string[]=[];
    const exam={...definition("trial"),...(!fluent?{version:"exam-v3-immediate-feedback",selectionPolicy:undefined}:{})};
    for(let n=0;n<20;n++){
      const next=selectCandidate(bank.filter(q=>!used.has(q.familyId)),responses,exam,rng)!;
      expect(next).not.toBeNull();expect(used.has(next.candidate.familyId)).toBe(false);
      used.add(next.candidate.familyId);predictions.push(next.predicted);tiers.push(next.reason);
      responses.push({...next.candidate,eligible:true,correct:rng()<probability(theta,next.candidate)});
    }
    domains.forEach(d=>expect(responses.filter(r=>r.domain===d)).toHaveLength(2));
    const score=scoreResponses(responses);
    expect(score.total).toBeGreaterThanOrEqual(10);expect(score.total).toBeLessThanOrEqual(990);
    return {correct:responses.filter(r=>r.correct).length,score:score.total!,width:score.high!-score.low!,predicted:predictions.reduce((a,b)=>a+b,0)/20,
      inRange:predictions.filter(p=>p>=.75&&p<=.85).length,short:tiers.filter(t=>t.includes("short-in-range")).length,
      probabilityFallback:tiers.filter(t=>t.includes("nearest-probability-fallback")).length};
  }
  const scenarios=[];
  for(const theta of [-2,0,2])for(const fluent of [false,true]){
    const rows=Array.from({length:12},(_,i)=>run(theta,17000+i,fluent));
    const mean=(key:keyof typeof rows[number])=>rows.reduce((s,r)=>s+r[key],0)/rows.length;
    scenarios.push({theta,policy:fluent?"trial-fluency-v1":"measurement-v1",runs:rows.length,meanCorrect:mean("correct"),meanScore:mean("score"),meanIntervalWidth:mean("width"),meanPredicted:mean("predicted"),meanInRange:mean("inRange"),meanShortInRange:mean("short"),meanProbabilityFallback:mean("probabilityFallback")});
  }
  const report={observedAt:new Date().toISOString(),sourceSha256:createHash("sha256").update(raw).digest("hex"),parametersAreProvisional:true,participantsAreSimulated:true,
    initialCoverage,scenarios,model:"science-3pl-p70-linear-v2",bankReplacementApplied:false};
  writeFileSync("implementation/checks/trial-fluency-simulation-20260917.json",JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify(report));
}, 60000);
