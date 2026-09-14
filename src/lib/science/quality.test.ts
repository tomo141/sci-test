import { describe, expect, it } from "vitest";
import { qualityObservations, qualitySignals, type QualityAnswer, type QualityReport } from "./quality";
import type { Item } from "./types";
const now=new Date("2026-09-14T00:00:00Z");
const item:Item={id:"target",family_id:"family",domain:"数学",subdomain:"数と代数",content:{question:"2 + 2 は？",choices:["1","2","3","4"],correctIndex:3,explanation:"2 + 2 = 4",distractorRationales:[],sources:[]},author_id:null,status:"published",quality_passed:true,rights_checked:true,expires_at:null,created_at:now.toISOString()};
const answer=(owner:string,extra:Partial<QualityAnswer>={}):QualityAnswer=>({owner,familyId:"family",revisionId:"target",domain:"数学",a:1,b:0,c:.25,correct:true,eligible:true,answeredAt:"2026-09-13T12:00:00Z",choice:3,...extra});
describe("quality triage",()=>{
  it("does not count repeated people or revisions of a familiar family as fresh evidence",()=>{
    const repeated=Array.from({length:150},(_,i)=>answer("same",{revisionId:i?"revision2":"target"}));
    expect(qualityObservations(repeated)).toHaveLength(1);
    expect(qualitySignals([item],repeated,[],now).signals).toHaveLength(0);
    const distinct=Array.from({length:100},(_,i)=>answer(`person${i}`));
    const signal=qualitySignals([item],distinct,[],now).signals.find(s=>s.code==="rare_distractor");
    expect(signal?.evidence).toMatchObject({sampleCount:100,choices:[0,1,2]});
  });
  it("cannot infer pre-answer ability from future or same-family answers",()=>{
    const rows=[answer("p"),...Array.from({length:10},(_,i)=>answer("p",{familyId:`later${i}`,revisionId:`later${i}`,answeredAt:"2026-09-13T13:00:00Z"}))];
    expect(qualityObservations(rows).find(r=>r.revisionId==="target")?.ability).toBeNull();
    const repeated=Array.from({length:10},(_,i)=>answer("p",{revisionId:`old${i}`,answeredAt:`2026-09-12T10:${String(i).padStart(2,"0")}:00Z`}));
    expect(qualityObservations([...repeated,answer("p")]).some(r=>r.ability!==null)).toBe(false);
    const laboratory=Array.from({length:12},(_,i)=>answer("p",{familyId:`lab${i}`,revisionId:`lab${i}`,eligible:false,qualityEligible:true,answeredAt:`2026-09-12T10:${String(i).padStart(2,"0")}:00Z`}));
    const labObservations=qualityObservations([...laboratory,answer("p")]);
    expect(labObservations).toHaveLength(13);
    expect(labObservations.every(r=>r.ability===null&&r.predicted===null)).toBe(true);
  });
  it("detects reversed performance using only earlier independent ability evidence",()=>{
    const rows:QualityAnswer[]=[];
    for(let i=0;i<80;i++){
      const strong=i>=40,owner=`p${i}`;
      for(let k=0;k<16;k++)rows.push(answer(owner,{familyId:`prior${k}`,revisionId:`prior${k}`,correct:strong,choice:strong?3:0,answeredAt:`2026-09-12T10:${String(k).padStart(2,"0")}:00Z`}));
      rows.push(answer(owner,{correct:!strong,choice:strong?0:3}));
    }
    expect(qualitySignals([item],rows,[],now).signals.some(s=>s.code==="negative_discrimination")).toBe(true);
  });
  it("deduplicates a reporter across categories and distinguishes expiry from similarity",()=>{
    const report=(owner:string,category:string):QualityReport=>({owner,revisionId:"target",category,evidence:"",createdAt:"2026-09-13T00:00:00Z"});
    const reports=[report("p","answer"),report("p","source"),report("p","ambiguous")];
    expect(qualitySignals([item],[],reports,now).signals).toHaveLength(0);
    reports.push(report("q","ambiguous"),report("r","answer"));
    expect(qualitySignals([item],[],reports,now).signals[0].evidence.reporters).toBe(3);
    const same={...item,id:"copy",family_id:"another",expires_at:"2026-09-13T00:00:00Z"};
    const result=qualitySignals([item,same],[],[],now).signals;
    expect(result.map(s=>s.code).sort()).toEqual(["similar_stem","source_expired"]);
    expect(qualitySignals([item,{...same,family_id:item.family_id,expires_at:null}],[],[],now).signals).toHaveLength(0);
  });
});
