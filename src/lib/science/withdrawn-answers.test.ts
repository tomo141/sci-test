import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let db:PGlite;
const owner=randomUUID(),admin=randomUUID(),reviewer=randomUUID(),visitor=randomUUID(),attempt=randomUUID(),release=randomUUID(),revision=randomUUID();
const content={question:"1 + 1 は？",choices:["1","2","3","4"],correctIndex:1,explanation:"1個と1個を合わせると2個。",distractorRationales:["合計は1ではない。","正解。","合計は3ではない。","合計は4ではない。"],sources:[{title:"独立に計算した試験用の問題"}]};
beforeAll(async()=>{
  db=new PGlite();
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;");
  for(const name of readdirSync("supabase/migrations").filter(n=>/^\d{4}_.*\.sql$/.test(n)).sort())await db.exec(readFileSync(`supabase/migrations/${name}`,"utf8").replace("create extension if not exists pgcrypto;",""));
},30000);
afterAll(async()=>{await db?.close();});
beforeEach(async()=>{
  await db.exec("begin");
  await db.query("insert into auth.users(id,email_confirmed_at) values($1,now()),($2,now()),($3,now())",[owner,admin,reviewer]);
  await db.query("insert into science_admins(user_id,reason) values($1,'fixture'),($2,'fixture')",[admin,reviewer]);
  await db.query("insert into science_visitors(id,user_id,token_hash,route_group) values($1,$2,$3,'A')",[visitor,owner,"a".repeat(64)]);
  await db.query("insert into science_releases(id,name,model_version) values($1,'fixture','test')",[release]);
  await db.query("insert into science_items(id,family_id,domain,subdomain,content,status,quality_passed,rights_checked) values($1,$2,'数学','数と代数',$3,'published',true,true)",[revision,revision,content]);
  await db.query("insert into science_release_items(release_id,revision_id,b) values($1,$2,0)",[release,revision]);
  await db.query("insert into science_attempts(id,visitor_id,user_id,definition,release_id,model_version,kind,total) values($1,$2,$3,'{}',$4,'test','trial',20)",[attempt,visitor,owner,release]);
});
afterEach(async()=>{await db.exec("rollback;reset role");});
const issue=(ordinal=0,id=revision)=>db.query<{token:string;exclusion_reason:string}>("select * from science_issue($1,$2,$3,$4,$5,'[0,1,2,3]',.68,1,'fixture',1)",[attempt,visitor,owner,ordinal,id]);
const commit=(token:string,selected:number|null,operation=randomUUID(),ordinal=0,result:unknown=null)=>db.query<{ordinal:number;state:string}>("select * from science_commit_answer($1,$2,$3,$4,$5,$6,$7,$8)",[attempt,visitor,owner,ordinal,token,operation,selected,result]);
async function rejected(action:()=>Promise<unknown>,message:string|RegExp){
  await db.exec("savepoint expected_failure");
  await expect(action()).rejects.toThrow(message);
  await db.exec("rollback to savepoint expected_failure;release savepoint expected_failure");
}
async function withdraw(mode="exclude"){
  const p=(await db.query<{id:string}>("select science_propose_correction($1,$2,$3,$4,'根拠を確認して訂正する') id",[revision,admin,content,mode])).rows[0].id;
  await db.query("select science_approve_correction($1,$2,'{\"rights\":true,\"source\":true,\"uniqueAnswer\":true,\"explanation\":true}')",[p,reviewer]);
}
async function weekly(ids=[revision,...Array.from({length:9},()=>randomUUID())]){
  await db.query("insert into science_weekly_sets(id,starts_at,ends_at,revision_ids) values('fixture',now()-interval '1 day',now()+interval '6 days',$1)",[ids]);
  await db.query("update science_attempts set kind='weekly',total=10,week_id='fixture' where id=$1",[attempt]);
}

describe.sequential("withdrawn question skips in PostgreSQL",()=>{
  it("requires ownership, an issued token and an approved exclusion to skip",async()=>{
    const {token}=(await issue()).rows[0];
    await rejected(()=>commit(token,null),"item_not_withdrawn");
    await db.query("update science_items set status='held' where id=$1",[revision]);
    await rejected(()=>commit(token,null),"item_unavailable");
    await withdraw();
    await rejected(()=>commit(randomUUID(),null),"not_issued");
    await rejected(()=>db.query("select science_commit_answer($1,$2,$3,0,$4,$5,null,null)",[attempt,visitor,admin,token,randomUUID()]),"not_found");
    expect((await db.query("select * from science_answers")).rows).toHaveLength(0);
  });
  it("stores an actual skip once, and excludes it from scoring, quality and review",async()=>{
    const {token}=(await issue()).rows[0],operation=randomUUID();
    await withdraw();
    await db.exec("set role service_role");
    expect((await commit(token,null,operation)).rows[0].ordinal).toBe(1);
    expect((await commit(token,null,operation)).rows[0].ordinal).toBe(1);
    await rejected(()=>commit(token,0,operation),"operation_reused");
    expect((await db.query("select selected_index,is_correct,skip_reason from science_answers")).rows).toEqual([{selected_index:null,is_correct:null,skip_reason:"question_withdrawn"}]);
    expect((await db.query("select is_correct,eligible,quality_eligible,exclusion_reason,canonical_choice from science_quality_responses")).rows).toEqual([{is_correct:null,eligible:false,quality_eligible:false,exclusion_reason:"question_withdrawn",canonical_choice:null}]);
    expect((await db.query("select event_name from science_events where attempt_id=$1",[attempt])).rows).toEqual([{event_name:"question_skipped"}]);
    await db.query("update science_attempts set kind='lab',total=10 where id=$1",[attempt]);
    // Even a pre-existing bookmark must not turn the skipped item into a review response.
    await db.query("insert into science_bookmarks(user_id,revision_id) values($1,$2)",[owner,revision]);
    for(const mode of ["mistakes","bookmarks"])expect((await db.query("select * from science_review_collection($1,$2,0)",[owner,mode])).rows).toHaveLength(0);
    await rejected(()=>db.query("select science_mark_review($1,$2,true,$3)",[owner,revision,randomUUID()]),"not_found");
  });
  it("preserves genuine earlier choices after a withdrawal and detects NULL reuse",async()=>{
    const {token}=(await issue()).rows[0],operation=randomUUID();
    await commit(token,0,operation);
    await withdraw();
    await commit(token,0,operation);
    await rejected(()=>commit(token,null,operation),"operation_reused");
    expect((await db.query("select selected_index,is_correct,skip_reason from science_answers")).rows).toEqual([{selected_index:0,is_correct:false,skip_reason:null}]);
    expect((await db.query("select eligible,quality_eligible from science_quality_responses")).rows).toEqual([{eligible:false,quality_eligible:false}]);
  });
  it("issues only the assigned withdrawn weekly placeholder after expiry or rights changes",async()=>{
    await weekly();
    await db.query("update science_items set expires_at=now()-interval '1 day' where id=$1",[revision]);
    await rejected(()=>issue(),"item_unavailable");
    await withdraw();
    await db.query("update science_items set rights_checked=false,status='retired' where id=$1",[revision]);
    await db.query("update science_weekly_sets set revision_ids=array(select gen_random_uuid() from generate_series(1,10)) where id='fixture'");
    await rejected(()=>issue(),"wrong_weekly_item");
    await db.query("update science_weekly_sets set revision_ids[1]=$1 where id='fixture'",[revision]);
    const q=(await issue()).rows[0];
    expect(q.exclusion_reason).toBe("question_withdrawn");
    expect((await commit(q.token,null)).rows[0].ordinal).toBe(1);
  });
  it("does not treat an explanation-only correction as permission to skip or bypass expiry",async()=>{
    await weekly();
    const {token}=(await issue()).rows[0];
    await withdraw("explanation");
    await rejected(()=>commit(token,null),"item_not_withdrawn");
    await db.query("delete from science_issued where attempt_id=$1",[attempt]);
    await db.query("update science_items set expires_at=now()-interval '1 day' where id=$1",[revision]);
    await rejected(()=>issue(),"item_unavailable");
  });
  it("finishes a withdrawn final item with a consistent result and a single completion",async()=>{
    const ids=Array.from({length:9},()=>randomUUID());
    for(const id of ids)await db.query("insert into science_items(id,family_id,domain,subdomain,content,status,quality_passed,rights_checked) values($1,$2,'数学','数と代数',$3,'published',true,true)",[id,id,content]);
    await weekly([...ids,revision]);
    for(let n=0;n<9;n++){const q=(await issue(n,ids[n])).rows[0];await commit(q.token,1,randomUUID(),n);}
    const q=(await issue(9)).rows[0],operation=randomUUID();
    await withdraw();
    const result={version:"test",originalAnswerCount:10,answerCount:9,correctCount:9,correctionEpoch:1};
    await rejected(()=>commit(q.token,null,operation,9,{}),"result_required");
    await rejected(()=>commit(q.token,null,operation,9,{...result,correctionEpoch:null}),"result_recalculation_required");
    await rejected(()=>commit(q.token,null,operation,9,{...result,correctionEpoch:0}),"result_recalculation_required");
    for(let retry=0;retry<2;retry++)expect((await commit(q.token,null,operation,9,result)).rows[0]).toMatchObject({ordinal:10,state:"completed"});
    expect((await db.query("select result from science_attempts where id=$1",[attempt])).rows).toEqual([{result}]);
    expect((await db.query("select * from science_answers where selected_index is not null")).rows).toHaveLength(9);
    expect((await db.query("select * from science_outbox where kind='attempt_completed'")).rows).toHaveLength(1);
    expect((await db.query("select * from science_result_revisions where attempt_id=$1",[attempt])).rows).toHaveLength(1);
  });
  it("rejects incomplete or contradictory skip records at the table boundary",async()=>{
    await issue();
    for(const [selected,correct,reason] of [[null,null,null],[0,null,null],[null,false,"question_withdrawn"],[0,false,"question_withdrawn"],[null,null,"other"]]){
      await rejected(()=>db.query("insert into science_answers(attempt_id,ordinal,operation_id,selected_index,is_correct,skip_reason) values($1,0,$2,$3,$4,$5)",[attempt,randomUUID(),selected,correct,reason]),"science_answer_or_withdrawn_skip");
    }
    expect((await db.query("select has_function_privilege('anon','science_commit_answer(uuid,uuid,uuid,int,uuid,uuid,int,jsonb)','execute') allowed")).rows).toEqual([{allowed:false}]);
    expect((await db.query("select to_regprocedure('science_commit_answer_before_hold_guard(uuid,uuid,uuid,int,uuid,uuid,int,jsonb)') old")).rows).toEqual([{old:null}]);
  });
});
