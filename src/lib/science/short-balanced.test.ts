import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { domains, type ScienceDomain } from "../data/taxonomy";
import { choose, progress } from "../../../scripts/lib/short-adaptive-model";
import { probability } from "./model";
import { questionLevel } from "./question-level";
import { difficultyAtProbability, thetaFromScale } from "./measurement-scale";
import type { Content } from "./types";

type Item={id:string;domain:ScienceDomain;provisionalLevel:number;difficulty70:number;parameters:{a:number;b:number;c:number};content:Content;originalKey:string};
const source=JSON.parse(readFileSync("content/science-short-balanced-20260917.json","utf8")) as {items:Item[]};
const bank=source.items;
const random=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
function run(correct:boolean,history:{id:string;correct:boolean}[]=[],seed=9){
  const answers:{id:string;correct:boolean}[]=[],issued:NonNullable<ReturnType<typeof choose>>[]=[];const rng=random(seed);
  for(let i=0;i<20;i++){const selected=choose(bank,answers,history,rng)!;expect(selected).not.toBeNull();expect(answers.some(a=>a.id===selected.id)).toBe(false);issued.push(selected);answers.push({id:selected.id,correct});}
  const selected=issued.map(r=>bank.find(q=>q.id===r.id)!);
  domains.forEach(d=>expect(selected.filter(q=>q.domain===d)).toHaveLength(2));
  return {answers,issued,levels:selected.map(q=>q.provisionalLevel),score:progress(bank,answers)};
}
describe("100 short questions and the production adaptive model",()=>{
  it("covers every level in each domain and balances all 100 without reusing originals",()=>{
    expect(bank).toHaveLength(100);expect(new Set(bank.map(q=>q.originalKey)).size).toBe(100);
    domains.forEach(d=>{const items=bank.filter(q=>q.domain===d);expect(items).toHaveLength(10);expect(new Set(items.map(q=>q.provisionalLevel)).size).toBe(7);});
    for(let level=1;level<=7;level++)expect([14,15]).toContain(bank.filter(q=>q.provisionalLevel===level).length);
    for(const q of bank){expect(questionLevel(q.parameters)).toBe(q.provisionalLevel);expect(difficultyAtProbability(q.parameters)).toBeCloseTo(q.difficulty70,9);expect(probability(thetaFromScale(q.difficulty70),q.parameters)).toBeCloseTo(.7,12);}
  });
  it("raises selected difficulty with correct evidence, without forcing an increase after every question",()=>{
    const yes=run(true),no=run(false);
    expect(yes.levels.slice(10).reduce((a,b)=>a+b,0)).toBeGreaterThan(yes.levels.slice(0,10).reduce((a,b)=>a+b,0));
    expect(yes.levels.reduce((a,b)=>a+b,0)).toBeGreaterThan(no.levels.reduce((a,b)=>a+b,0));
    expect(yes.score.score!.value).toBeGreaterThan(no.score.score!.value);
    if(process.env.SCIENCE_SHORT_AUDIT==='1')writeFileSync('implementation/checks/short-adaptive-simulation-20260917.json',JSON.stringify({observedAt:new Date().toISOString(),syntheticResponses:true,calibrated:false,allCorrect:{levels:yes.levels,score:yes.score.score},allWrong:{levels:no.levels,score:no.score.score}},null,2)+'\n');
  });
  it("uses prior trial answers for selection but scores only the current answers",()=>{
    const previous=run(true),next=run(true,previous.answers);
    expect(next.issued.every(r=>!previous.answers.some(a=>a.id===r.id))).toBe(true);
    expect(next.score.answerCount).toBe(20);
    expect(progress(bank,next.answers)).toEqual(next.score);
    expect(next.levels.reduce((a,b)=>a+b,0)).toBeGreaterThan(previous.levels.reduce((a,b)=>a+b,0));
  });
  it("shows the adopted provisional total after the first answer, including unmeasured fields",()=>{
    expect(progress(bank,[]).score).toBeNull();
    const score=progress(bank,[{id:bank[0].id,correct:true}]);
    expect(score.score?.unmeasuredDomains).toBe(9);expect(score.score?.value).toBeGreaterThanOrEqual(10);expect(score.score?.value).toBeLessThanOrEqual(990);
  });
});
