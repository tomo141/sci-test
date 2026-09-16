import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {domains} from '@/src/lib/data/taxonomy';
import {abilityScale,bFromDifficulty,difficultyAtProbability,thetaFromScale} from './measurement-scale';
import {probability,scoreResponses,type Response} from './model';
import {LEGACY_MODEL_VERSION,MODEL_VERSION} from './versions';
import {correctedResult} from './correction-model';
import type {Attempt,Issued,Answer} from './types';
import {definition} from './definition';

describe('70 percent scale',()=>{
 it('makes equal unrounded ability and item difficulty mean 70 percent across a and c',()=>{
  for(let difficulty=50;difficulty<=950;difficulty+=50)for(const a of [.5,1,2])for(const c of [0,.2,.25,.35]){
   const item={a,b:bFromDifficulty(difficulty,a,c),c};
   expect(probability(thetaFromScale(difficulty),item)).toBeCloseTo(.7,12);
   expect(difficultyAtProbability(item)).toBeCloseTo(difficulty,10);
  }
 });
 it('converts authoring percentages onto a common latent scale without relabeling responses',()=>{
  const item={a:1.3,b:.7,c:.25};
  for(const target of [.5,.6,.7,.8]){
   const d=difficultyAtProbability(item,target);
   expect(bFromDifficulty(d,item.a,item.c,target)).toBeCloseTo(item.b,12);
   expect(probability(thetaFromScale(d),item)).toBeCloseTo(target,12);
  }
  expect(()=>bFromDifficulty(500,0)).toThrow();
  expect(()=>bFromDifficulty(500,1,.7)).toThrow();
  expect(abilityScale(0)).toBe(500);
 });
 it('keeps old attempts and corrections on their original score version',()=>{
  const responses=domains.flatMap(domain=>Array.from({length:5},()=>({domain,a:1,b:0,c:.25,correct:true,eligible:true})));
  const legacy=scoreResponses(responses,false,LEGACY_MODEL_VERSION),next=scoreResponses(responses);
  expect(legacy.version).toBe(LEGACY_MODEL_VERSION);expect(next.version).toBe(MODEL_VERSION);
  expect(next.total).not.toBe(legacy.total);
  const attempt={total:50,definition:definition('full'),model_version:LEGACY_MODEL_VERSION} as Attempt;
  const issued=responses.map((r,ordinal)=>({ordinal,revision_id:`fixture-${ordinal}`,snapshot:r,eligible:true})) as unknown as Issued[];
  const answers=responses.map((_,ordinal)=>({ordinal,selected_index:0,is_correct:true})) as Answer[];
  expect(correctedResult(attempt,issued,answers,{epoch:1,updates:new Map()}).total).toBe(legacy.total);
  expect(()=>scoreResponses(responses,false,'future-unimplemented-model')).toThrow('unsupported_science_model');
 });
 it('can reach 990 in 50 and 100 questions using existing reviewed item parameters',()=>{
  // Checked-in reviewed content, not synthesized extreme b values or a perfect-answer bonus.
  const files=JSON.parse(readFileSync('implementation/checks/p70-reachability-bank.json','utf8')) as {domain:Response['domain'];a:number;b:number;c:number}[];
  for(const count of [5,10]){
   const answers=domains.flatMap(domain=>files.filter(q=>q.domain===domain).slice(0,count).map(q=>({...q,eligible:true,correct:true})));
   expect(answers).toHaveLength(count*10);expect(scoreResponses(answers).total).toBe(990);
   expect(scoreResponses(answers).low).toBeLessThan(990);
  }
 });
 it('bounds displayed scores while retaining uncertainty and not fabricating missing domains',()=>{
  const rows=domains.flatMap(domain=>Array.from({length:10},()=>({domain,a:1,b:0,c:.25,correct:false,eligible:true})));
  const result=scoreResponses(rows);
  expect(result.total).toBe(10);expect(result.high).toBeGreaterThan(10);
  const partial=scoreResponses(rows.filter(r=>r.domain===domains[0]));
  expect(partial.total).toBeNull();expect(partial.domains[domains[1]].score).toBeNull();
 });
});
