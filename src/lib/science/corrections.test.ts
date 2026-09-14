import { describe, expect, it } from "vitest";
import { domains } from "@/src/lib/data/taxonomy";
import { correctedResult } from "./correction-model";
import { definition } from "./definition";
import type { Answer, Attempt, Issued } from "./types";
import type { RevisionUpdate } from "./corrections";
function records(kind:"trial"|"weekly"){
  const exam=definition(kind);
  const attempt={total:exam.count,definition:exam} as Attempt;
  const issued=Array.from({length:exam.count},(_,ordinal)=>({ordinal,revision_id:`revision-${ordinal}`,eligible:exam.formal,snapshot:{domain:domains[ordinal%10],a:1,b:0,c:.25}})) as Issued[];
  const answers=issued.map((i,ordinal)=>({ordinal,is_correct:ordinal<7,answered_at:"2026-09-14T00:00:00Z"})) as Answer[];
  const update=(ordinal:number)=>({source_revision:`revision-${ordinal}`,excluded:true,approved_at:"2026-09-15T00:00:00Z"}) as RevisionUpdate;
  return {attempt,issued,answers,update};
}
describe("corrected scoring",()=>{
  it("preserves answers and correct counts while excluding known items revealed by sign-in",()=>{
    const r=records("trial"),original=structuredClone(r.answers);
    const result=correctedResult(r.attempt,r.issued,r.answers,{epoch:3,updates:new Map(),ineligibleOrdinals:new Set([0,10])});
    expect(result.correctCount).toBe(7);expect(result.answerCount).toBe(20);expect(result.total).toBeNull();
    expect(result.identityAdjustments?.excludedCount).toBe(2);expect(result.corrections?.count).toBe(0);expect(r.answers).toEqual(original);
  });
  it("uses the same reduced denominator for a withdrawn weekly question without changing raw answers",()=>{
    const r=records("weekly"),original=structuredClone(r.answers);
    const result=correctedResult(r.attempt,r.issued,r.answers,{epoch:1,updates:new Map([["revision-0",r.update(0)]])});
    expect(result.correctCount).toBe(6);expect(result.answerCount).toBe(9);expect(result.originalAnswerCount).toBe(10);
    expect(result.total).toBeNull();expect(result.corrections?.excludedCount).toBe(1);expect(r.answers).toEqual(original);
  });
  it("does not turn a domain with all its questions withdrawn into a zero or a complete total",()=>{
    const r=records("trial"),updates=new Map([0,10].map(i=>[`revision-${i}`,r.update(i)]));
    const result=correctedResult(r.attempt,r.issued,r.answers,{epoch:2,updates});
    expect(result.answerCount).toBe(18);expect(result.domains[domains[0]].score).toBeNull();expect(result.total).toBeNull();
    expect(result.domains[domains[1]].count).toBe(2);
  });
});
