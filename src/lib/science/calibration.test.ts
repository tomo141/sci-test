import { describe,expect,it } from "vitest";
import { calibrateDifficulty,calibrationObservations,type CalibrationAnswer,type CalibrationObservation } from "./calibration";
import { probability } from "./model";
describe("conservative difficulty calibration",()=>{
  it("does not fit the target answer into its own ability estimate or count repeat respondents twice",()=>{
    const other=Array.from({length:12},(_,i):CalibrationAnswer=>({owner:"person",domain:"数学",revisionId:`r${i}`,familyId:`f${i}`,a:1,b:0,c:.25,correct:i%4!==0,eligible:true,answeredAt:new Date(Date.UTC(2026,0,1,i)).toISOString()}));
    const target:CalibrationAnswer={...other[0],revisionId:"target",familyId:"target-family",answeredAt:"2026-01-02T00:00:00Z"};
    const rows=calibrationObservations([...other,target,{...target,answeredAt:"2026-01-03T00:00:00Z"}],"target");
    expect(rows).toHaveLength(1);expect(rows[0].other).toHaveLength(12);expect(rows[0].other.some(r=>(r as CalibrationAnswer).familyId==="target-family")).toBe(false);
  });
  it("keeps sparse data and stable anchors fixed",()=>{expect(calibrateDifficulty([],{a:1,b:0,c:.25}).eligible).toBe(false);expect(calibrateDifficulty([],{a:1,b:0,c:.25},true).reason).toBe("anchor_fixed");});
  it("moves only difficulty when independent held-out predictions consistently improve",()=>{
    const observations:CalibrationObservation[]=[];
    for(let i=0;i<1800;i++){
      const theta=[-2,0,2][i%3],p=probability(theta,{a:1,b:1,c:.25});
      const correct=((Math.floor(i/3)*.61803398875)%1)<p;
      observations.push({owner:`p${i}`,answeredAt:new Date(2026,0,1,0,i).toISOString(),correct,ability:theta,prior:{theta:[theta],mass:[1]},other:Array.from({length:40},(_,j)=>({domain:"数学",a:1,b:0,c:.25,correct:j/40<probability(theta,{a:1,b:0,c:.25}),eligible:true}))});
    }
    const fit=calibrateDifficulty(observations,{a:1,b:0,c:.25});
    expect(fit.b).toBeGreaterThan(0);expect(fit.a).toBe(1);expect(fit.c).toBe(.25);expect(fit.trainCount+fit.testCount).toBe(observations.length);expect(fit.improvement).toBeGreaterThan(0);expect(fit.eligible).toBe(true);
  });
});
