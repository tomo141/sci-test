import {describe,expect,it} from "vitest";
import {laboratoryChoice,trustExposureWeight,trustScore,type QualityEvidence} from "./trust";
describe("evidence-based community trust",()=>{
  it("keeps an unproven newcomer neutral and does not mistake the prior for evidence",()=>{
    const novice=trustScore([]);expect(novice.score).toBe(50);expect(novice.evidenceStrength).toBe(0);expect(trustExposureWeight(novice)).toBe(1);
  });
  it("gives verified quality more influence than a high quiz score",()=>{
    const knowledgeable=trustScore([],{domain:100,overall:1000});
    const quality=trustScore(Array.from({length:20},():QualityEvidence=>({role:"author",positive:true})));
    expect(quality.score).toBeGreaterThan(knowledgeable.score);expect(knowledgeable.score).toBe(55);
  });
  it("retains newcomer exposure when experienced authors participate",()=>{
    const candidates=[{name:"new",trustWeight:1},{name:"trusted",trustWeight:3}];
    expect(laboratoryChoice(candidates,()=>0)?.probability).toBeCloseTo(.3125);
    expect(laboratoryChoice(candidates,()=>.99)?.probability).toBeCloseTo(.6875);
    expect(laboratoryChoice([])).toBeNull();
  });
});
