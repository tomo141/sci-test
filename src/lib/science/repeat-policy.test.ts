import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { definition } from "./definition";
import { selectCandidate, type Candidate } from "./selection";
import { scoreResponses, type Response } from "./model";

let db:PGlite;
const visitor=randomUUID(),attempt=randomUUID(),revision=randomUUID(),fresh=randomUUID(),release=randomUUID();
beforeAll(async()=>{
  db=new PGlite();
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
  for(const name of readdirSync('supabase/migrations').filter(n=>/^\d{4}_.*\.sql$/.test(n)).sort()) await db.exec(readFileSync('supabase/migrations/'+name,'utf8').replace('create extension if not exists pgcrypto;',''));
  await db.query("insert into science_visitors(id,token_hash,route_group) values($1,$2,'A')",[visitor,'ad'.repeat(32)]);
  await db.query("insert into science_releases(id,name,model_version) values($1,'Repeat test fixture','science-3pl-reference-v1')",[release]);
  const content={question:'Repeated fixture question?',choices:['A','B','C','D'],correctIndex:1,explanation:'Fixture explanation'};
  for(const [id,family] of [[revision,'seen-fixture'],[fresh,'fresh-fixture']]){
    await db.query("insert into science_items(id,family_id,domain,subdomain,content,status,rights_checked,quality_passed) values($1,$2,'数学','数と代数',$3,'published',true,true)",[id,family,content]);
    await db.query("insert into science_release_items(release_id,revision_id,b) values($1,$2,0)",[release,id]);
  }
  await db.query("insert into science_exposures(visitor_id,family_id,reason) values($1,'seen-fixture','trial')",[visitor]);
  await db.query("insert into science_attempts(id,visitor_id,definition,release_id,model_version,kind,total) values($1,$2,'{}',$3,'science-3pl-reference-v1','trial',20)",[attempt,visitor,release]);
},30000);
afterAll(async()=>{await db?.close();});
const issue=(ordinal=0,reason='repeat-fallback-v1:test')=>db.query<{token:string;eligible:boolean;is_repeat:boolean;prior_presentation_count:number}>("select * from science_issue($1,$2,null,$3,$4,'[0,1,2,3]',.68,1,$5,1)",[attempt,visitor,ordinal,revision,reason]);

describe.sequential('repeat fallback data contract',()=>{
  it('requires the fallback policy and refuses a repeat while an unseen same-domain item exists',async()=>{
    await expect(issue(0,'ordinary-selection')).rejects.toThrow('already_seen');
    await expect(issue()).rejects.toThrow('unseen_item_available');
  });
  it('scores the fallback but keeps it out of item calibration and shows only a private alert',async()=>{
    await db.query("update science_items set status='held' where id=$1",[fresh]);
    const row=(await issue()).rows[0];
    expect(row).toMatchObject({eligible:true,is_repeat:true,prior_presentation_count:1});
    expect((await issue()).rows[0].token).toBe(row.token);
    await db.query("select science_commit_answer($1,$2,null,0,$3,$4,1,null)",[attempt,visitor,row.token,randomUUID()]);
    expect((await db.query('select eligible from science_responses')).rows).toEqual([{eligible:true}]);
    expect((await db.query('select * from science_calibration_responses')).rows).toHaveLength(0);
    expect((await db.query('select quality_eligible from science_quality_responses')).rows).toEqual([{quality_eligible:false}]);
    expect((await db.query('select repeat_count,presented_count,max_presentation_count from science_repeat_alerts')).rows).toEqual([{repeat_count:1,presented_count:1,max_presentation_count:2}]);
    expect((await db.query("select has_table_privilege('anon','science_repeat_alerts','select') anon,has_table_privilege('authenticated','science_repeat_alerts','select') member,has_function_privilege('anon','science_exposure_history(uuid,uuid)','execute') rpc")).rows).toEqual([{anon:false,member:false,rpc:false}]);
  });
  it('does not repeat a family twice within the same attempt',async()=>{
    await expect(issue(1)).rejects.toThrow('same_attempt_repeat');
  });
});

describe('history for selection, not score',()=>{
  const item:Candidate={revisionId:'item',familyId:'family',domain:'数学',a:1,b:0,c:.25,authorId:null,focus:false,anchor:false,exposures:0};
  const history:Response[]=Array.from({length:30},()=>({...item,correct:true,eligible:true}));
  it('uses equally weighted history at every trial step without counting it towards exam quotas',()=>{
    const current=[{...item,correct:false,eligible:true}];
    const noHistory=selectCandidate([item],[],definition('trial'),()=>.5)!;
    const first=selectCandidate([item],[],definition('trial'),()=>.5,history)!;
    expect(first.predicted).toBeGreaterThan(noHistory.predicted);
    // Only mathematics remains in this fixture, with two slots. History must not exhaust those slots.
    const trial={...definition('trial'),quotas:{数学:2}};
    const later=selectCandidate([item],current,trial,()=>.5,history)!;
    const combined=selectCandidate([item],[...history,...current],{...trial,quotas:{}},()=>.5)!;
    expect(later.predicted).toBeCloseTo(combined.predicted,12);
    expect(scoreResponses(current).eligibleCount).toBe(1);
  });
  it('ignores supplied history throughout the full exam',()=>{
    expect(selectCandidate([item],[],definition('full'),()=>.5,history)).toEqual(selectCandidate([item],[],definition('full'),()=>.5));
  });
  it('prefers unseen, then the least repeated items',()=>{
    const repeated={...item,revisionId:'repeated',familyId:'repeated',seenCount:1};
    const often={...item,revisionId:'often',familyId:'often',seenCount:4};
    expect(selectCandidate([repeated,item, often],[],definition('trial'),()=>.99)!.candidate.revisionId).toBe('item');
    const fallback=selectCandidate([repeated,often],[],definition('trial'),()=>.99)!;
    expect(fallback.candidate.revisionId).toBe('repeated');
    expect(fallback.reason).toMatch(/^repeat-fallback-v1:/);
  });
});
