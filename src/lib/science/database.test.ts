import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const uid = "10000000-0000-4000-8000-000000000001";
const other = "10000000-0000-4000-8000-000000000002";
const visitor = "20000000-0000-4000-8000-000000000001";
const wrongVisitor = "20000000-0000-4000-8000-000000000002";
const attempt = "30000000-0000-4000-8000-000000000001";
const revision = "40000000-0000-4000-8000-000000000001";
const release = "50000000-0000-4000-8000-000000000001";
const operation = "60000000-0000-4000-8000-000000000001";
let token: string;

beforeAll(async () => {
  db = new PGlite();
  // Supabase roles and Auth are fixtures. SQL data integrity and permissions run in PostgreSQL.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
  for (const name of readdirSync("supabase/migrations").filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) {
    // PGlite uses the built-in gen_random_uuid; the pgcrypto extension is deployment-specific.
    await db.exec(readFileSync(resolve("supabase/migrations", name), "utf8").replace("create extension if not exists pgcrypto;", ""));
  }
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'test@example.invalid',now()),($2,'other@example.invalid',null)", [uid,other]);
  await db.query("insert into science_visitors(id,token_hash,route_group) values($1,$2,'A'),($3,$4,'B')", [visitor,"a".repeat(64),wrongVisitor,"b".repeat(64)]);
  await db.query("insert into science_releases(id,name,model_version) values($1,'SQL verification','science-3pl-reference-v1')", [release]);
  await db.query("insert into science_items(id,family_id,domain,subdomain,content,status,quality_passed,rights_checked) values($1,'test-family','数学','数と代数',$2,'published',true,true)",[revision,{question:"1 + 1?",choices:["1","2","3","4"],correctIndex:1,explanation:"1 + 1 = 2"}]);
  await db.query("insert into science_release_items(release_id,revision_id,b) values($1,$2,0)",[release,revision]);
  await db.query("insert into science_attempts(id,visitor_id,definition,release_id,model_version,kind,total) values($1,$2,'{}',$3,'science-3pl-reference-v1','trial',20)",[attempt,visitor,release]);
}, 30_000);
afterAll(async () => { await db?.close(); });

describe.sequential("atomic issuance and answers", () => {
  it("preserves scientific letter case while rejecting duplicate or non-text choices in SQL",async()=>{
    const base={question:"Which genotype has two A alleles?",choices:["AA","Aa","aa","A"],correctIndex:0,explanation:"AA denotes two A alleles."};
    const valid=async(content:unknown)=>(await db.query<{valid:boolean}>("select science_valid_content($1) valid",[content])).rows[0].valid;
    expect(await valid(base)).toBe(true);
    expect(await valid({...base,choices:["Co","CO","C","O"]})).toBe(true);
    for(const choices of [["A","A","B","C"],["A","Ａ","B","C"],[" A ","A","B","C"],[1,"2","3","4"],"not an array",null]){
      expect(await valid({...base,choices})).toBe(false);
    }
  });
  it("performs verified claiming and consent with service privileges while Auth remains private",async()=>{
    const owner="10000000-0000-4000-8000-000000000031",unverified="10000000-0000-4000-8000-000000000032",v="20000000-0000-4000-8000-000000000031";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'service-role@example.invalid',now()),($2,'unverified@example.invalid',null)",[owner,unverified]);
    await db.query("insert into science_visitors(id,token_hash,route_group) values($1,$2,'A')",[v,'ef'.repeat(32)]);
    await db.exec("set role service_role");
    try{
      await expect(db.query("select * from auth.users")).rejects.toThrow(/permission denied/);
      await expect(db.query("select science_claim_visitor($1,$2,$3)",[v,'ef'.repeat(32),unverified])).rejects.toThrow("email_unverified");
      await db.query("select science_claim_visitor($1,$2,$3)",[v,'ef'.repeat(32),owner]);
      await db.query("select science_update_consents($1,$2,gen_random_uuid())",[owner,{weekly:true}]);
      expect((await db.query<{enabled:boolean}>("select enabled from science_consents where user_id=$1 and topic='weekly'",[owner])).rows[0].enabled).toBe(true);
    }finally{await db.exec("reset role");}
    await db.exec("set role authenticated");
    try{await expect(db.query("select science_private.email_verified($1)",[owner])).rejects.toThrow(/permission denied/);}
    finally{await db.exec("reset role");}
  });

  it("keeps quality triage private, idempotent, and independent of answer keys",async()=>{
    const qualityAdmin="10000000-0000-4000-8000-000000000009";
    await db.query("insert into auth.users(id) values($1)",[qualityAdmin]);
    const job=(await db.query<{id:string}>("insert into science_jobs(kind,state) values('quality-test','running') returning id")).rows[0].id;
    const signal=[{revisionId:revision,code:"rare_distractor",priority:3,evidence:{sampleCount:100,counts:[0,100,0,0]}}];
    await db.query("select science_store_quality_signals($1,$2,$3,'2026-09-14','2026-08-14')",[job,signal,[revision]]);
    const id=(await db.query<{id:string}>("select id from science_quality_signals where revision_id=$1",[revision])).rows[0].id;
    await expect(db.query("select science_review_quality_signal($1,$2,'reviewed evidence',false)",[id,other])).rejects.toThrow("forbidden");
    await db.query("insert into science_admins(user_id,reason) values($1,'test reviewer') on conflict do nothing",[qualityAdmin]);
    await db.query("select science_review_quality_signal($1,$2,'source checked and no correction needed',false)",[id,qualityAdmin]);
    await db.query("select science_store_quality_signals($1,$2,$3,'2026-09-15','2026-08-15')",[job,signal,[revision]]);
    expect((await db.query<{state:string}>("select state from science_quality_signals where id=$1",[id])).rows[0].state).toBe("acknowledged");
    await db.query("select science_store_quality_signals($1,'[]',$2,'2026-09-14','2026-08-14')",[job,[revision]]);
    expect((await db.query<{state:string}>("select state from science_quality_signals where id=$1",[id])).rows[0].state).toBe("acknowledged");
    await db.query("select science_store_quality_signals($1,'[]',$2,'2026-09-16','2026-08-16')",[job,[revision]]);
    expect((await db.query<{state:string}>("select state from science_quality_signals where id=$1",[id])).rows[0].state).toBe("resolved");
    await db.query("select science_store_quality_signals($1,$2,$3,'2026-09-17','2026-08-17')",[job,signal,[revision]]);
    expect((await db.query<{state:string}>("select state from science_quality_signals where id=$1",[id])).rows[0].state).toBe("open");
    const privacy=(await db.query<{signals:boolean;responses:boolean}>("select has_table_privilege('anon','science_quality_signals','SELECT') signals,has_table_privilege('authenticated','science_quality_responses','SELECT') responses")).rows[0];
    expect(privacy).toEqual({signals:false,responses:false});
    expect((await db.query<{key:number}>("select (content->>'correctIndex')::int key from science_items where id=$1",[revision])).rows[0].key).toBe(1);
  });
  it("refuses direct browser reads of answer keys and direct RPC execution", async () => {
    const rows = await db.query<{ table_allowed: boolean; rpc_allowed: boolean }>(`select
      has_table_privilege('authenticated','science_issued','SELECT') as table_allowed,
      has_function_privilege('anon','science_commit_answer(uuid,uuid,uuid,integer,uuid,uuid,integer,jsonb)','EXECUTE') as rpc_allowed`);
    expect(rows.rows[0]).toEqual({ table_allowed: false, rpc_allowed: false });
    const legacy = await db.query<{ keys: boolean; role: boolean; score: boolean }>(`select
      has_table_privilege('authenticated','question_choices','SELECT') keys,
      has_column_privilege('authenticated','profiles','role','UPDATE') role,
      has_table_privilege('authenticated','score_history','INSERT') score`);
    expect(legacy.rows[0]).toEqual({keys:false,role:false,score:false});
  });
  it("refuses another owner and records one stable issuance", async () => {
    const sql = "select (science_issue($1,$2,null,0,$3,'[2,0,3,1]',.68,1,'test',1)).*";
    await expect(db.query(sql,[attempt,wrongVisitor,revision])).rejects.toThrow("not_found");
    const first = await db.query<{token:string;snapshot:unknown}>(sql,[attempt,visitor,revision]);
    token = first.rows[0].token;
    const repeated = await db.query<{token:string}>(sql,[attempt,visitor,revision]);
    expect(repeated.rows[0].token).toBe(token);
    expect((await db.query<{count:number}>("select count(*)::int count from science_exposures")).rows[0].count).toBe(1);
  });
  it("rejects forged tokens and commits the shuffled choice exactly once", async () => {
    const sql="select (science_commit_answer($1,$2,null,0,$3,$4,3,null)).*";
    await expect(db.query(sql,[attempt,visitor,revision,operation])).rejects.toThrow("not_issued");
    await db.query(sql,[attempt,visitor,token,operation]);
    await db.query(sql,[attempt,visitor,token,operation]);
    const rows=await db.query<{ordinal:number;is_correct:boolean;answers:number}>(`select a.ordinal,r.is_correct,(select count(*)::int from science_answers) as answers from science_attempts a join science_answers r on r.attempt_id=a.id where a.id=$1`,[attempt]);
    expect(rows.rows[0]).toEqual({ordinal:1,is_correct:true,answers:1});
    await expect(db.query("select science_commit_answer($1,$2,null,0,$3,$4,2,null)",[attempt,visitor,token,operation])).rejects.toThrow("operation_reused");
  });
  it("blocks stale tabs without advancing progress", async () => {
    await expect(db.query("select science_commit_answer($1,$2,null,0,$3,gen_random_uuid(),3,null)",[attempt,visitor,token])).rejects.toThrow("stale_attempt");
    expect((await db.query<{ordinal:number}>("select ordinal from science_attempts where id=$1",[attempt])).rows[0].ordinal).toBe(1);
  });
  it("requires a verified email and secret proof before account claiming", async () => {
    await expect(db.query("select science_claim_visitor($1,$2,$3)",[visitor,"wrong",uid])).rejects.toThrow("invalid_owner");
    await expect(db.query("select science_claim_visitor($1,$2,$3)",[visitor,"a".repeat(64),other])).rejects.toThrow("email_unverified");
    await db.query("select science_claim_visitor($1,$2,$3)",[visitor,"a".repeat(64),uid]);
    await db.query("select science_claim_visitor($1,$2,$3)",[visitor,"a".repeat(64),uid]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_entitlements where user_id=$1",[uid])).rows[0].n).toBe(1);
    expect((await db.query<{owned:boolean}>("select science_owns($1,$2,null) owned",[attempt,visitor])).rows[0].owned).toBe(false);
    expect((await db.query<{owned:boolean}>("select science_owns($1,$2,$3) owned",[attempt,wrongVisitor,uid])).rows[0].owned).toBe(true);
  });
  it("enforces a shared database rate limit", async () => {
    expect((await db.query<{ok:boolean}>("select science_rate_limit('test',60,1) ok")).rows[0].ok).toBe(true);
    expect((await db.query<{ok:boolean}>("select science_rate_limit('test',60,1) ok")).rows[0].ok).toBe(false);
  });
  it("preserves access on unsubscribe and makes consent and welcome jobs idempotent", async () => {
    await db.query("select science_update_consents($1,$2,$3)",[uid,{science:true,weekly:true,domain_opening:false},operation]);
    await db.query("select science_update_consents($1,$2,$3)",[uid,{science:true,weekly:true,domain_opening:false},operation]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_outbox where kind='mail'")).rows[0].n).toBe(2);
    await expect(db.query("select science_update_consents($1,$2,$3)",[uid,{science:false},operation])).rejects.toThrow("operation_reused");
    await db.query("select science_update_consents($1,$2,gen_random_uuid())",[uid,{science:false,weekly:false,domain_opening:false}]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_outbox where state='cancelled'")).rows[0].n).toBe(2);
    expect((await db.query<{n:number}>("select count(*)::int n from science_entitlements where user_id=$1",[uid])).rows[0].n).toBe(1);
    expect((await db.query<{enabled:boolean}>("select enabled from science_consents where user_id=$1 and topic='science'",[uid])).rows[0].enabled).toBe(false);
  });
  it("ranks first eligible completions, keeps ties, and computes personal best independently",async()=>{
    await db.query("insert into science_profiles(user_id,nickname,ranking_opt_in) values($1,'second',true) on conflict(user_id) do update set ranking_opt_in=true",[other]);
    await db.query("update science_profiles set ranking_opt_in=true,nickname='first' where user_id=$1",[uid]);
    for(const [user,v,score,completed] of [[uid,visitor,600,'2026-09-14T01:00:00Z'],[uid,visitor,900,'2026-09-14T02:00:00Z'],[other,wrongVisitor,600,'2026-09-14T03:00:00Z']] as const){
      await db.query("insert into science_attempts(visitor_id,user_id,definition,model_version,kind,total,state,ordinal,completed_at,result) values($1,$2,'{}','science-3pl-reference-v1','full',50,'completed',50,$3,$4)",[v,user,completed,{total:score}]);
    }
    const result=await db.query<{place:number;score:string;profile_id:string|null}>("select * from science_rankings('full','2026-09-13T15:00:00Z','2026-09-14T15:00:00Z',50,'science-3pl-reference-v1',null)");
    expect(result.rows).toHaveLength(2);
    result.rows.forEach(r=>{expect(Number(r.place)).toBe(1);expect(Number(r.score)).toBe(600);expect(r.profile_id).toBeNull();});
    const best=await db.query<{score:number}>("select (result->>'total')::int score from science_personal_bests where owner_key=$1 and kind='full'",['user:'+uid]);
    expect(best.rows[0].score).toBe(900);
    await db.query("update science_profiles set ranking_opt_in=false where user_id=$1",[other]);
    expect((await db.query("select * from science_rankings('full','2026-09-13T15:00:00Z','2026-09-14T15:00:00Z',50,'science-3pl-reference-v1',null)")).rows).toHaveLength(1);
  });
  it("requires publication consent, independent adoption, and a new revision for corrections",async()=>{
    const draftId="70000000-0000-4000-8000-000000000001";
    const content={question:"1 + 1 = ?",choices:["1","2","3","4"],correctIndex:1,explanation:"One and one make two.",distractorRationales:["too small","correct","too large","too large"],sources:[{title:"Test source",url:"https://example.invalid"}]};
    await db.query("insert into science_submission_drafts(id,author_id,domain,subdomain,content,revision) values($1,$2,'数学','数と代数',$3,1)",[draftId,uid,content]);
    const sql="select science_submit_draft($1,$2,1,$3,'license-test',$4) id";
    const args=[draftId,uid,`community:${draftId}`,{rights:true,adultOrGuardianConsent:true,licenseHash:'a'.repeat(64)}];
    await expect(db.query(sql,args)).rejects.toThrow("submission_not_open");
    await db.query("update science_config set value=value||'{\"labSubmissions\":true,\"licenseVersion\":\"license-test\"}' where key='release'");
    await db.query("insert into science_license_versions(version,operator_name,terms,sha256,published_at,active,operator_approved_at,legal_review_ref) values('license-test','Test fixture operator','{}',$1,now(),true,now(),'Fixture only: not a real legal review')",['a'.repeat(64)]);
    await expect(db.query(sql,[...args.slice(0,3),{rights:true,adultOrGuardianConsent:true,licenseHash:'b'.repeat(64)}])).rejects.toThrow("terms_changed");
    await expect(db.query("update science_license_versions set terms='{\"changed\":true}' where version='license-test'")).rejects.toThrow("published_license_is_immutable");
    await expect(db.query(sql,[...args.slice(0,3),{rights:false,adultOrGuardianConsent:true}])).rejects.toThrow("representations_required");
    const q=(await db.query<{id:string}>(sql,args)).rows[0].id;
    await expect(db.query(sql,args)).rejects.toThrow("stale_draft");
    expect((await db.query<{n:number}>("select count(*)::int n from science_license_acceptances where revision_id=$1",[q])).rows[0].n).toBe(1);
    await expect(db.query("update science_items set content=$2 where id=$1",[q,{...content,correctIndex:3}])).rejects.toThrow("create_a_new_revision");
    await db.query("insert into science_admins(user_id,reason) values($1,'test fixture'),($2,'test fixture')",[uid,other]);
    const checks={rights:true,source:true,uniqueAnswer:true,explanation:true};
    await expect(db.query("select science_review_submission($1,$2,'adopted','independent check',$3)",[draftId,uid,checks])).rejects.toThrow("independent_review_required");
    await db.query("select science_review_submission($1,$2,'lab','reviewed for lab',$3)",[draftId,other,checks]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_trust_evidence")).rows[0].n).toBe(0);
    await db.query("select science_review_submission($1,$2,'adopted','source checked independently',$3)",[draftId,other,checks]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_trust_evidence where user_id=$1 and role='author'",[uid])).rows[0].n).toBe(1);
  });
  it("never exposes unfinished answer keys through the review collection",async()=>{
    expect((await db.query("select * from science_review_collection($1,'mistakes',0)",[uid])).rows).toHaveLength(0);
    await expect(db.query("select science_mark_review($1,$2,true,gen_random_uuid())",[other,revision])).rejects.toThrow("not_found");
  });
  it("holds a single job lease and rejects unaudited automatic publication",async()=>{
    const first=(await db.query<{id:string}>("select science_begin_job('daily') id")).rows[0].id;
    expect(first).toBeTruthy();expect((await db.query<{id:string|null}>("select science_begin_job('daily') id")).rows[0].id).toBeNull();
    await db.query("select science_end_job($1,'completed','{}')",[first]);
    expect((await db.query<{id:string}>("select science_begin_job('daily') id")).rows[0].id).not.toBe(first);
    await expect(db.query("select science_activate_release($1,null,'automatic attempt')",[release])).rejects.toThrow("automatic_validation_required");
    await expect(db.query("insert into science_items(family_id,domain,subdomain,content) values('invalid','数学','数と代数','{}')")).rejects.toThrow();
  });
  it("measures consent at day seven while keeping later withdrawals visible",async()=>{
    for(const [index,group,revokedAt] of [[3,'A',8],[4,'B',1]] as const){
      const userId=`10000000-0000-4000-8000-00000000000${index}`,vId=`20000000-0000-4000-8000-00000000000${index}`,aId=`30000000-0000-4000-8000-00000000000${index}`;
      await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()-interval '9 days')",[userId,`fixture${index}@example.invalid`]);
      await db.query("insert into science_visitors(id,token_hash,route_group,experiment,user_id) values($1,$2,$3,'funnel-test',$4)",[vId,String(index).repeat(64),group,userId]);
      await db.query("insert into science_profiles(user_id,created_at) values($1,now()-interval '9 days')",[userId]);
      await db.query("insert into science_attempts(id,visitor_id,user_id,definition,model_version,kind,total,state,started_at) values($1,$2,$3,'{}','science-3pl-reference-v1','trial',20,'abandoned',now()-interval '10 days')",[aId,vId,userId]);
      await db.query("insert into science_events(dedupe_key,event_name,visitor_id,user_id,attempt_id,payload,created_at) values($1,'attempt_started',$2,$3,$4,$5,now()-interval '10 days')",[`started:${aId}`,vId,userId,aId,{group}]);
      await db.query("insert into science_events(dedupe_key,event_name,user_id,created_at) values($1,'email_verified',$2,now()-interval '9 days')",[`verified:${userId}`,userId]);
      await db.query("insert into science_events(dedupe_key,event_name,user_id,payload,created_at) values($1,'mail_consent_granted',$2,'{\"topic\":\"science\"}',now()-interval '9 days'),($3,'mail_consent_revoked',$2,'{\"topic\":\"science\"}',now()-make_interval(days=>$4))",[`grant:${userId}`,userId,`revoke:${userId}`,revokedAt]);
    }
    const rows=(await db.query<{route_group:string;mature_starters:number;registrations_7d:number;withdrawn:number}>("select * from science_experiment_results(now()-interval '28 days',now(),'funnel-test')")).rows;
    expect(Number(rows[0].mature_starters)).toBe(1);expect(Number(rows[0].registrations_7d)).toBe(0);expect(Number(rows[1].registrations_7d)).toBe(1);expect(Number(rows[1].withdrawn)).toBe(1);
    expect(Number(rows[2].mature_starters)).toBe(0);
  });
  it("publishes a calibrated successor atomically while freezing the previous bank and anchors",async()=>{
    const parent=(await db.query<{id:string}>("insert into science_releases(name,model_version) values('Calibration test bank','science-3pl-reference-v1') returning id")).rows[0].id;
    await db.query(`with fields(d) as (values('数学'),('物理'),('化学'),('生物'),('地学'),('工学'),('農学'),('情報・計算機科学'),('医歯薬学'),('人文社会科学'))
      insert into science_items(family_id,domain,subdomain,content,status,quality_passed,rights_checked)
      select 'calibration-fixture:'||d||':'||n,d,'fixture','{"question":"Fixture question","choices":["A","B","C","D"],"correctIndex":0,"explanation":"Fixture explanation"}','published',true,true from fields cross join generate_series(1,100) n`);
    await db.query("insert into science_release_items(release_id,revision_id,b,focus,anchor) select $1,id,0,(split_part(family_id,':',3)::int between 21 and 40),(split_part(family_id,':',3)::int<=20) from science_items where family_id like 'calibration-fixture:%'",[parent]);
    await db.query("select science_activate_release($1,$2,'Verified test fixture capacity')",[parent,other]);
    const item=(await db.query<{id:string}>("select id from science_items where family_id='calibration-fixture:数学:21'")).rows[0].id;
    await expect(db.query("update science_release_items set b=.3 where release_id=$1 and revision_id=$2",[parent,item])).rejects.toThrow("release_is_frozen");
    const epoch=(await db.query<{epoch:number}>("select science_correction_epoch() epoch")).rows[0].epoch;
    const fit={b:.3,a:1,c:.25,oldB:0,eligible:true,count:200,sourceOwnerCount:250,correctionEpoch:epoch};
    const candidate=(await db.query<{id:string}>("insert into science_calibration_candidates(revision_id,release_id,data_version,observed_to,fit,state) values($1,$2,'synthetic-fixture',now(),$3,'qualified') returning id",[item,parent,fit])).rows[0].id;
    const job=(await db.query<{id:string}>("select science_begin_job('calibration-test') id")).rows[0].id;
    await expect(db.query("select science_apply_calibration($1,$2,$3)",[parent,[candidate],job])).rejects.toThrow("automatic_calibration_disabled");
    await db.query("update science_config set value=value||'{\"automaticCalibration\":true}' where key='release'");
    const duplicate=(await db.query<{id:string}>("insert into science_calibration_candidates(revision_id,release_id,data_version,observed_to,fit,state) values($1,$2,'another-fit-same-question',now(),$3,'qualified') returning id",[item,parent,fit])).rows[0].id;
    await expect(db.query("select science_apply_calibration($1,$2,$3)",[parent,[candidate,duplicate],job])).rejects.toThrow("validation_required");
    await db.query("update science_calibration_candidates set fit=$2 where id=$1",[candidate,{...fit,correctionEpoch:epoch-1}]);
    await expect(db.query("select science_apply_calibration($1,$2,$3)",[parent,[candidate],job])).rejects.toThrow("validation_required");
    await db.query("update science_calibration_candidates set fit=$2 where id=$1",[candidate,{...fit,oldB:.1}]);
    await expect(db.query("select science_apply_calibration($1,$2,$3)",[parent,[candidate],job])).rejects.toThrow("parameter_guard_failed");
    const nonFocus=(await db.query<{id:string}>("select id from science_items where family_id='calibration-fixture:数学:41'")).rows[0].id;
    await db.query("update science_calibration_candidates set revision_id=$2,fit=$3 where id=$1",[candidate,nonFocus,fit]);
    await expect(db.query("select science_apply_calibration($1,$2,$3)",[parent,[candidate],job])).rejects.toThrow("parameter_guard_failed");
    await db.query("update science_calibration_candidates set revision_id=$2 where id=$1",[candidate,item]);
    expect((await db.query<{state:string}>("select state from science_releases where id=$1",[parent])).rows[0].state).toBe("active");
    const next=(await db.query<{id:string}>("select science_apply_calibration($1,$2,$3) id",[parent,[candidate],job])).rows[0].id;
    expect(next).not.toBe(parent);
    expect((await db.query<{b:number}>("select b from science_release_items where release_id=$1 and revision_id=$2",[parent,item])).rows[0].b).toBe(0);
    expect((await db.query<{b:number}>("select b from science_release_items where release_id=$1 and revision_id=$2",[next,item])).rows[0].b).toBe(.3);
    expect((await db.query<{n:number}>("select count(*)::int n from science_release_items where release_id=$1 and anchor and b<>0",[next])).rows[0].n).toBe(0);
    expect((await db.query<{state:string}>("select state from science_releases where id=$1",[parent])).rows[0].state).toBe("retired");
    expect((await db.query<{state:string}>("select state from science_calibration_candidates where id=$1",[candidate])).rows[0].state).toBe("applied");
    const focusCounts=(await db.query<{domain:string;n:number}>("select q.domain,count(*)::int n from science_release_items ri join science_items q on q.id=ri.revision_id where ri.release_id=$1 and ri.focus group by q.domain",[next])).rows;
    expect(focusCounts).toHaveLength(10);expect(focusCounts.every(row=>row.n===20)).toBe(true);
    const replacements=(await db.query<{domain:string}>("select q.domain from science_release_items ri join science_items q on q.id=ri.revision_id join science_release_items old on old.revision_id=ri.revision_id and old.release_id=$2 where ri.release_id=$1 and ri.focus and not old.focus",[next,parent])).rows;
    expect(replacements).toEqual([{domain:"数学"}]);
  });
  it("preserves original answers and result versions while withdrawing a defective item for everyone",async()=>{
    const original={question:"A correction fixture question?",choices:["One","Two","Three","Four"],correctIndex:1,explanation:"The original explanation."};
    const item=(await db.query<{id:string}>("insert into science_items(family_id,domain,subdomain,content,status,rights_checked,quality_passed) values('correction-fixture','数学','数と代数',$1,'published',true,true) returning id",[original])).rows[0].id;
    const a=(await db.query<{id:string}>("insert into science_attempts(visitor_id,user_id,definition,model_version,kind,total,state,ordinal,completed_at,result) values($1,$2,'{}','science-3pl-reference-v1','full',50,'completed',50,now(),'{\"total\":700}') returning id",[visitor,uid])).rows[0].id;
    await db.query("insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible) values($1,0,$2,'correction-fixture','[0,1,2,3]',$3,.6,1,'fixture',1,true)",[a,item,{content:original,domain:'数学',subdomain:'数と代数',a:1,b:0,c:.25}]);
    await db.query("insert into science_answers(attempt_id,ordinal,operation_id,selected_index,is_correct) values($1,0,gen_random_uuid(),1,true)",[a]);
    const correction={...original,correctIndex:2,explanation:"Corrected explanation with a checked source."};
    await expect(db.query("select science_propose_correction($1,$2,$3,'explanation','The correct answer was wrong')",[item,uid,correction])).rejects.toThrow("scoring_change_requires_exclusion");
    const proposal=(await db.query<{id:string}>("select science_propose_correction($1,$2,$3,'exclude','The correct answer was wrong') id",[item,uid,correction])).rows[0].id;
    const checks={rights:true,source:true,uniqueAnswer:true,explanation:true};
    await expect(db.query("select science_approve_correction($1,$2,$3)",[proposal,uid,checks])).rejects.toThrow("independent_review_required");
    await expect(db.query("select science_approve_correction($1,$2,'{}')",[proposal,other])).rejects.toThrow("review_required");
    await db.query("select science_approve_correction($1,$2,$3)",[proposal,other,checks]);
    expect((await db.query<{eligible:boolean}>("select eligible from science_responses where attempt_id=$1",[a])).rows[0].eligible).toBe(false);
    expect((await db.query<{eligible:boolean}>("select eligible from science_issued where attempt_id=$1",[a])).rows[0].eligible).toBe(true);
    expect((await db.query<{content:unknown}>("select snapshot->'content' content from science_issued where attempt_id=$1",[a])).rows[0].content).toEqual(original);
    expect((await db.query<{needs_recalculation:boolean}>("select needs_recalculation from science_attempts where id=$1",[a])).rows[0].needs_recalculation).toBe(true);
    const next={total:680,originalAnswerCount:50,answerCount:49,correctionEpoch:1,version:'science-3pl-reference-v1'};
    expect((await db.query<{ok:boolean}>("select science_store_corrected_result($1,$2,1,0) ok",[a,next])).rows[0].ok).toBe(false);
    expect((await db.query<{ok:boolean}>("select science_store_corrected_result($1,$2,1,1) ok",[a,next])).rows[0].ok).toBe(true);
    expect((await db.query<{ok:boolean}>("select science_store_corrected_result($1,$2,1,1) ok",[a,next])).rows[0].ok).toBe(false);
    const history=(await db.query<{score:number}>("select (result->>'total')::int score from science_result_revisions where attempt_id=$1 order by revision",[a])).rows;
    expect(history.map(h=>h.score)).toEqual([700,680]);
    expect((await db.query<{ok:boolean}>("select science_store_current($1,'{\"version\":\"current\"}',now(),0) ok",[uid])).rows[0].ok).toBe(false);
    expect((await db.query<{allowed:boolean}>("select has_table_privilege('authenticated','science_result_revisions','SELECT') allowed")).rows[0].allowed).toBe(false);
  });
});

describe.sequential("verified identity exposure",()=>{
  it("joins only proven devices and excludes later duplicates and legacy aliases without rewriting answers",async()=>{
    const owner="10000000-0000-4000-8000-000000000099";
    const v1="20000000-0000-4000-8000-000000000091",v2="20000000-0000-4000-8000-000000000092";
    const a1="30000000-0000-4000-8000-000000000091",a2="30000000-0000-4000-8000-000000000092";
    const q1="40000000-0000-4000-8000-000000000091",q2="40000000-0000-4000-8000-000000000092";
    const legacy="90000000-0000-4000-8000-000000000091";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'identity@example.invalid',now())",[owner]);
    await db.query("insert into science_visitors(id,token_hash,route_group) values($1,$2,'A'),($3,$4,'D')",[v1,"c".repeat(64),v2,"d".repeat(64)]);
    const content={question:"Identity test question",choices:["1","2","3","4"],correctIndex:1,explanation:"Identity test explanation"};
    for(const [id,family] of [[q1,"identity-family"],[q2,"legacy-family"]])await db.query("insert into science_items(id,family_id,domain,subdomain,content,status) values($1,$2,'math','algebra',$3,'published')",[id,family,content]);
    for(const [id,v] of [[a1,v1],[a2,v2]])await db.query("insert into science_attempts(id,visitor_id,definition,model_version,kind,total,ordinal,state,completed_at,result) values($1,$2,'{}','science-3pl-reference-v1','trial',20,20,'completed',now(),'{\"total\":500}')",[id,v]);
    for(const [a,v,ordinal,q,family,date] of [[a1,v1,0,q1,"identity-family","2026-09-10"],[a2,v2,0,q1,"identity-family","2026-09-11"],[a2,v2,1,q2,"legacy-family","2026-09-11"]] as const){
      await db.query("insert into science_issued(attempt_id,ordinal,revision_id,family_id,choice_order,snapshot,predicted,selection_probability,selection_reason,candidate_count,eligible,issued_at) values($1,$2,$3,$4,'[0,1,2,3]',$5,.625,1,'test',1,true,$6)",[a,ordinal,q,family,{domain:"math",a:1,b:0,c:.25,content},date]);
      await db.query("insert into science_answers(attempt_id,ordinal,operation_id,selected_index,is_correct,answered_at) values($1,$2,gen_random_uuid(),1,true,$3)",[a,ordinal,date]);
      await db.query("insert into science_exposures(visitor_id,family_id,first_attempt_id,reason,seen_at) values($1,$2,$3,'trial',$4)",[v,family,a,date]);
    }
    await db.query("insert into questions(id,title,question_text,domain,ability_axis,difficulty_initial,difficulty_internal) values($1,'legacy','legacy question','math','knowledge',500,0)",[legacy]);
    await db.query("insert into science_legacy_families(question_id,family_id,reason) values($1,'legacy-family','Reviewed equivalent legacy wording')",[legacy]);
    const oldSession=(await db.query<{id:string}>("insert into exam_sessions(user_id) values($1) returning id",[owner])).rows[0].id;
    await db.query("insert into exam_answers(session_id,user_id,question_id,selected_choice_index,is_correct,answered_at) values($1,$2,$3,1,true,'2026-09-01')",[oldSession,owner,legacy]);
    await expect(db.query("select science_claim_visitor($1,$2,$3)",[v2,"not-the-token",owner])).rejects.toThrow("invalid_owner");
    expect((await db.query<{user_id:string|null}>("select user_id from science_attempts where id=$1",[a2])).rows[0].user_id).toBeNull();
    await db.query("select science_claim_visitor($1,$2,$3)",[v1,"c".repeat(64),owner]);
    await db.query("select science_claim_visitor($1,$2,$3)",[v2,"d".repeat(64),owner]);
    const effective=(await db.query<{attempt_id:string;ordinal:number;eligible:boolean}>("select attempt_id,ordinal,eligible from science_responses where user_id=$1 order by attempt_id,ordinal",[owner])).rows;
    expect(effective.map(r=>r.eligible)).toEqual([true,false,false]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_answers where attempt_id in ($1,$2) and is_correct",[a1,a2])).rows[0].n).toBe(3);
    expect((await db.query<{n:number}>("select count(*)::int n from science_issued where attempt_id in ($1,$2) and eligible",[a1,a2])).rows[0].n).toBe(3);
    expect((await db.query<{state:boolean;competitive:boolean}>("select needs_recalculation state,competitive from science_attempts where id=$1",[a2])).rows[0]).toEqual({state:true,competitive:false});
    expect((await db.query<{result:unknown}>("select result from science_result_revisions where attempt_id=$1",[a2])).rows[0].result).toEqual({total:500});
    expect((await db.query<{route_group:string}>("select route_group from science_visitors where id=$1",[v2])).rows[0].route_group).toBe("A");
    await db.query("select science_claim_visitor($1,$2,$3)",[v2,"d".repeat(64),owner]);
    expect((await db.query<{n:number}>("select count(*)::int n from science_response_exclusions where attempt_id=$1",[a2])).rows[0].n).toBe(2);
  });
});


describe("current mail export",()=>{
  it("paginates beyond 1000, excludes withdrawals and unverified addresses, and requires an admin",async()=>{
    await db.exec("begin");
    try{
      await db.exec("update science_consents set enabled=false");
      await db.exec(`insert into auth.users(id,email,email_confirmed_at)
        select ('90000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'export'||n||'@example.invalid',case when n<1003 then now() end from generate_series(1,1003) n;
        insert into science_profiles(user_id) select id from auth.users where id::text like '90000000-%';
        insert into science_consents(user_id,topic,enabled,version) select id,'science',email<>'export1002@example.invalid','export-test' from auth.users where id::text like '90000000-%';`);
      await db.exec("set role service_role");
      await db.exec("savepoint refused_export");
      await expect(db.query("select * from science_consent_export_page($1)",["10000000-0000-4000-8000-000000000031"])).rejects.toThrow("forbidden");
      await db.exec("rollback to refused_export");
      const first=(await db.query<{user_id:string;topic:string;email:string}>("select * from science_consent_export_page($1)",[uid])).rows;
      expect(first).toHaveLength(1000);
      const cursor=first.at(-1)!;
      const second=(await db.query<{user_id:string;email:string}>("select * from science_consent_export_page($1,$2,$3)",[uid,cursor.user_id,cursor.topic])).rows;
      expect(second).toHaveLength(1);expect(second[0].email).toBe("export1001@example.invalid");
      expect(new Set([...first,...second].map(r=>r.user_id)).size).toBe(1001);
      await db.exec("reset role;set role authenticated");
      await db.exec("savepoint browser_export");
      await expect(db.query("select * from science_consent_export_page($1)",[uid])).rejects.toThrow(/permission denied/);
      await db.exec("rollback to browser_export");
    }finally{await db.exec("rollback;reset role");}
  });
});


describe("reviewed bank import",()=>{
  it("keeps the active bank unchanged on capacity failure, then activates a complete staged bank atomically",async()=>{
    await db.exec("begin");
    try{
      const fields=["数学","物理","化学","生物","地学","工学","農学","情報・計算機科学","医歯薬学","人文社会科学"];
      const manifest="9".repeat(64);
      const rows=fields.flatMap((domain,d)=>Array.from({length:102},(_,n)=>({
        id:`41000000-0000-4000-8000-${String(d*102+n+1).padStart(12,"0")}`,
        family_id:`complete-import-fixture:${d}:${n}`,version:1,legacy_id:null,legacy_ids:[],domain,subdomain:"fixture",
        content:{question:`Import fixture ${d}/${n}`,choices:["One","Two","Three","Four"],correctIndex:0,explanation:"Reviewed fixture explanation",distractorRationales:["one","two","three","four"],sources:[{title:"Fixture source"}]},
        use:n<100?"formal":"weekly-reserve",parameters:{a:1,b:0,c:.25,focus:false,anchor:false},parameter_evidence:{stage:"initial_assumption"},
        review_evidence:{releaseApproval:"approved",sourceChecked:true,uniqueAnswerChecked:true,distractorRationalesChecked:true,rightsBasis:"Original test fixture only",contentSha256:"a".repeat(64),reason:"Complete capacity test fixture"}
      })));
      const missing=rows[99],initial=rows.filter(q=>q.id!==missing.id);
      const previous=(await db.query<{id:string}>("select id from science_releases where state='active'")).rows.map(r=>r.id);
      const gate=(await db.query<{value:unknown}>("select value from science_config where key='release'")).rows[0].value;
      const r=(await db.query<{id:string}>("insert into science_releases(name,model_version,settings) values('Complete import fixture','science-3pl-reference-v1',$1) returning id",[{importManifest:manifest,expectedRevisions:initial.map(q=>q.id)}])).rows[0].id;
      await db.exec("set role service_role");
      for(let offset=0;offset<initial.length;offset+=100)await db.query("select science_import_bank_batch($1,$2,$3,$4)",[r,uid,manifest,initial.slice(offset,offset+100)]);
      await db.exec("savepoint insufficient_capacity");
      await expect(db.query("select science_finish_bank_import($1,$2,$3,'Test publication capacity')",[r,uid,manifest])).rejects.toThrow("domain_capacity_below_100");
      await db.exec("rollback to insufficient_capacity");
      expect((await db.query<{id:string}>("select id from science_releases where state='active'")).rows.map(x=>x.id)).toEqual(previous);
      expect((await db.query<{n:number}>("select count(*)::int n from science_items where family_id like 'complete-import-fixture:%' and status='published'")).rows[0].n).toBe(0);
      await db.query("update science_releases set settings=jsonb_set(settings,'{expectedRevisions}',$2) where id=$1",[r,rows.map(q=>q.id)]);
      await db.query("select science_import_bank_batch($1,$2,$3,$4)",[r,uid,manifest,[missing]]);
      await db.query("select science_finish_bank_import($1,$2,$3,'Test complete bank publication')",[r,uid,manifest]);
      expect((await db.query<{id:string}>("select id from science_releases where state='active'")).rows.map(x=>x.id)).toEqual([r]);
      expect((await db.query<{n:number}>("select count(*)::int n from science_items where family_id like 'complete-import-fixture:%' and status='published'")).rows[0].n).toBe(1020);
      expect((await db.query<{n:number}>("select count(*)::int n from science_release_items where release_id=$1",[r])).rows[0].n).toBe(1000);
      expect((await db.query<{n:number}>("select count(*)::int n from science_reserved_weekly_families where family_id like 'complete-import-fixture:%'")).rows[0].n).toBe(1000);
      expect((await db.query<{value:unknown}>("select value from science_config where key='release'")).rows[0].value).toEqual(gate);
    }finally{await db.exec("rollback;reset role");}
  });
  it("stages idempotently, reconciles already claimed legacy exposure, and rolls back invalid publication",async()=>{
    const item="40000000-0000-4000-8000-000000000071",legacy="90000000-0000-4000-8000-000000000071";
    const manifest="7".repeat(64),family="bank-import-fixture";
    const content={question:"Import fixture question?",choices:["One","Two","Three","Four"],correctIndex:0,explanation:"Reviewed fixture explanation",distractorRationales:["one","two","three","four"],sources:[{title:"Fixture source"}]};
    const row={id:item,family_id:family,version:1,legacy_id:legacy,legacy_ids:[legacy],domain:"数学",subdomain:"数と代数",content,use:"formal",parameters:{a:1,b:0,c:.25,focus:true,anchor:false},parameter_evidence:{stage:"initial_assumption"},review_evidence:{releaseApproval:"approved",sourceChecked:true,uniqueAnswerChecked:true,distractorRationalesChecked:true,rightsBasis:"Original test fixture only",contentSha256:"8".repeat(64),reason:"Reviewed fixture and aliases"}};
    const releaseId=(await db.query<{id:string}>("insert into science_releases(name,model_version,settings) values('Import fixture','science-3pl-reference-v1',$1) returning id",[{importManifest:manifest,expectedRevisions:[item]}])).rows[0].id;
    await db.query("insert into questions(id,title,question_text,domain,ability_axis,difficulty_initial,difficulty_internal) values($1,'import fixture','older import question','math','knowledge',500,0)",[legacy]);
    const oldSession=(await db.query<{id:string}>("insert into exam_sessions(user_id) values($1) returning id",[uid])).rows[0].id;
    await db.query("insert into exam_answers(session_id,user_id,question_id,selected_choice_index,is_correct,answered_at) values($1,$2,$3,0,true,'2026-09-01')",[oldSession,uid,legacy]);
    const call="select science_import_bank_batch($1,$2,$3,$4)";
    await db.exec("set role service_role");
    try{
      await expect(db.query(call,[releaseId,uid,manifest,[{...row,review_evidence:{...row.review_evidence,sourceChecked:false}}]])).rejects.toThrow("review_evidence_required");
      expect((await db.query("select id from science_items where id=$1",[item])).rows).toHaveLength(0);
      await db.query(call,[releaseId,uid,manifest,[row]]);await db.query(call,[releaseId,uid,manifest,[row]]);
      expect((await db.query<{status:string}>("select status from science_items where id=$1",[item])).rows[0].status).toBe("draft");
      expect((await db.query("select * from science_legacy_families where question_id=$1",[legacy])).rows).toHaveLength(1);
      expect((await db.query("select * from science_exposures where user_id=$1 and family_id=$2 and reason='legacy'",[uid,family])).rows).toHaveLength(1);
      await expect(db.query(call,[releaseId,uid,manifest,[{...row,content:{...content,correctIndex:2}}]])).rejects.toThrow("immutable_revision_conflict");
      await expect(db.query("select science_finish_bank_import($1,$2,$3,'Initial publication test')",[releaseId,uid,manifest])).rejects.toThrow("weekly_reserve_below_two");
      expect((await db.query<{status:string}>("select status from science_items where id=$1",[item])).rows[0].status).toBe("draft");
      expect((await db.query("select * from science_reserved_weekly_families where family_id=$1",[family])).rows).toHaveLength(1);
      const clone=(await db.query<{id:string}>("insert into science_items(family_id,version,domain,subdomain,content) values($1,2,'数学','数と代数',$2) returning id",[family,content])).rows[0].id;
      expect(clone).not.toBe(item);expect((await db.query("select * from science_reserved_weekly_families where family_id=$1",[family])).rows).toHaveLength(1);
    }finally{await db.exec("reset role");}
  });
});

describe("review recovery",()=>{
  const checks={rights:true,source:true,uniqueAnswer:true,explanation:true};
  async function fixture(status="published"){
    await db.exec("begin");
    const admins=(await db.query<{id:string}>("insert into auth.users(id,email_confirmed_at) values(gen_random_uuid(),now()),(gen_random_uuid(),now()),(gen_random_uuid(),now()) returning id")).rows.map(r=>r.id);
    for(const id of admins)await db.query("insert into science_admins(user_id,reason) values($1,'Review recovery fixture')",[id]);
    const content={question:"Reviewed fixture: 3 + 4 = ?",choices:["6","7","8","9"],correctIndex:1,explanation:"Three and four sum to seven.",distractorRationales:["too small","correct","too large","too large"],sources:[{title:"Independent fixture"}]};
    const q=(await db.query<{id:string}>("insert into science_items(family_id,domain,subdomain,author_id,content,status,rights_checked,quality_passed) values(gen_random_uuid()::text,'数学','数と代数',$1,$2,$3,true,$4) returning id",[admins[0],content,status,status==="published"])).rows[0].id;
    return {admins,content,q};
  }
  async function refused(sql:string,args:unknown[],message:string|RegExp){
    await db.exec("savepoint expected_review_failure");
    try{await expect(db.query(sql,args)).rejects.toThrow(message);}
    finally{await db.exec("rollback to expected_review_failure;release expected_review_failure");}
  }
  it("keeps immutable rejected drafts, rolls back invalid revisions and preserves independent approval",async()=>{
    const {admins,content,q}=await fixture();
    try{
      const reason="The explanation needs an independently checked correction.";
      const p=(await db.query<{id:string}>("select science_propose_correction($1,$2,$3,'explanation',$4) id",[q,admins[0],content,reason])).rows[0].id;
      await refused("select science_propose_correction($1,$2,$3,'explanation',$4)",[q,admins[0],content,reason],"science_one_pending_correction");
      const original=(await db.query<{replacement_revision:string}>("select replacement_revision from science_correction_proposals where id=$1",[p])).rows[0].replacement_revision;
      await refused("select science_revise_correction($1,$2,$3,'explanation',$4)",[p,admins[1],{...content,correctIndex:2},reason],"scoring_change_requires_exclusion");
      expect((await db.query<{state:string}>("select state from science_correction_proposals where id=$1",[p])).rows[0].state).toBe("pending");
      const replacement={...content,explanation:"Checked again: 3 plus 4 equals 7."};
      const revised=(await db.query<{id:string}>("select science_revise_correction($1,$2,$3,'explanation',$4) id",[p,admins[1],replacement,reason])).rows[0].id;
      const history=(await db.query<{state:string;rejected_by:string;rejection_reason:string}>("select state,rejected_by,rejection_reason from science_correction_proposals where id=$1",[p])).rows[0];
      expect(history).toEqual({state:"rejected",rejected_by:admins[1],rejection_reason:reason});
      expect((await db.query<{status:string;content:unknown}>("select status,content from science_items where id=$1",[original])).rows[0]).toEqual({status:"retired",content});
      await refused("select science_approve_correction($1,$2,$3)",[revised,admins[1],checks],"independent_review_required");
      await refused("select science_approve_correction($1,$2,$3)",[revised,admins[0],checks],"independent_review_required");
      await db.query("select science_approve_correction($1,$2,$3)",[revised,admins[2],checks]);
      await refused("select science_reject_correction($1,$2,'Late rejection attempt')",[revised,admins[1]],"not_pending");
      await refused("select science_reopen_held_item($1,$2,'An old version must remain withdrawn',$3)",[q,admins[2],checks],"corrected_revision_cannot_reopen");
      expect((await db.query("select * from science_unresolved_holds where id=$1",[q])).rows).toHaveLength(0);
    }finally{await db.exec("rollback;reset role");}
  });
  it("restores only the former scope after review, without silently promoting lab items",async()=>{
    const {admins,content,q}=await fixture("lab");
    try{
      await db.query("update science_items set status='held' where id=$1",[q]);
      const call="select science_reopen_held_item($1,$2,'Checked the source and all options',$3) status";
      await refused(call,[q,admins[0],checks],"independent_review_required");
      await refused(call,[q,admins[1],{...checks,source:false}],"review_required");
      const p=(await db.query<{id:string}>("select science_propose_correction($1,$2,$3,'explanation','A possible explanation correction') id",[q,admins[0],content])).rows[0].id;
      await refused(call,[q,admins[1],checks],"pending_correction");
      await db.query("select science_reject_correction($1,$2,'The original explanation was correct')",[p,admins[1]]);
      expect((await db.query<{status:string}>("select status from science_items where id=$1",[q])).rows[0].status).toBe("held");
      await db.exec("set role service_role");
      expect((await db.query<{status:string}>(call,[q,admins[1],checks])).rows[0].status).toBe("lab");
      expect((await db.query<{status:string;quality_passed:boolean;content:unknown}>("select status,quality_passed,content from science_items where id=$1",[q])).rows[0]).toEqual({status:"lab",quality_passed:false,content});
      await db.query("update science_items set status='held',held_from_status=null where id=$1",[q]);
      await db.query("update science_items set held_from_status=null where id=$1",[q]);
      await refused(call,[q,admins[1],checks],"previous_publication_state_unknown");
      const permission=(await db.query<{read:boolean;execute:boolean}>("select has_table_privilege('authenticated','science_unresolved_holds','SELECT') read,has_function_privilege('anon','science_reopen_held_item(uuid,uuid,text,jsonb)','EXECUTE') execute")).rows[0];
      expect(permission).toEqual({read:false,execute:false});
    }finally{await db.exec("rollback;reset role");}
  });
  it("blocks cached new answers while held, but acknowledges prior commits and resumes the same progress",async()=>{
    const {admins,q}=await fixture();
    try{
      const r=(await db.query<{id:string}>("insert into science_releases(name,model_version) values('Hold recovery fixture','science-3pl-reference-v1') returning id")).rows[0].id;
      await db.query("insert into science_release_items(release_id,revision_id,b) values($1,$2,0)",[r,q]);
      const v=(await db.query<{id:string}>("insert into science_visitors(token_hash,route_group) select replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),'A' from generate_series(1,2) returning id")).rows.map(row=>row.id);
      const a:string[]=[],t:string[]=[],op:string[]=[];
      for(const owner of v){
        const next=(await db.query<{id:string}>("insert into science_attempts(visitor_id,definition,release_id,model_version,kind,total) values($1,'{}',$2,'science-3pl-reference-v1','trial',20) returning id",[owner,r])).rows[0].id;a.push(next);
        t.push((await db.query<{token:string}>("select (science_issue($1,$2,null,0,$3,'[0,1,2,3]',.68,1,'hold fixture',1)).token",[next,owner,q])).rows[0].token);
        op.push((await db.query<{id:string}>("select gen_random_uuid() id")).rows[0].id);
      }
      const answer="select (science_commit_answer($1,$2,null,0,$3,$4,1,null)).ordinal";
      await db.query(answer,[a[0],v[0],t[0],op[0]]);
      await db.query("update science_items set status='held' where id=$1",[q]);
      await db.exec("set role service_role");
      expect((await db.query<{ordinal:number}>(answer,[a[0],v[0],t[0],op[0]])).rows[0].ordinal).toBe(1);
      await refused(answer,[a[1],v[0],t[1],op[1]],"not_found");
      await refused(answer,[a[1],v[1],t[1],op[1]],"item_unavailable");
      expect((await db.query("select * from science_answers where attempt_id=$1",[a[1]])).rows).toHaveLength(0);
      await db.query("select science_reopen_held_item($1,$2,'Confirmed that the original item is correct',$3)",[q,admins[1],checks]);
      expect((await db.query<{ordinal:number}>(answer,[a[1],v[1],t[1],op[1]])).rows[0].ordinal).toBe(1);
      const saved=(await db.query<{attempt_id:string;selected_index:number;is_correct:boolean}>("select attempt_id,selected_index,is_correct from science_answers where attempt_id=any($1) order by attempt_id",[a])).rows;
      expect(saved).toHaveLength(2);saved.forEach(row=>{expect(row.selected_index).toBe(1);expect(row.is_correct).toBe(true);});
    }finally{await db.exec("rollback;reset role");}
  });
  it("allows a signed-in person to receive operator questions while excluding their own submissions",async()=>{
    const {admins,content,q}=await fixture();
    try{
      const unowned=(await db.query<{id:string}>("insert into science_items(family_id,domain,subdomain,content,status,rights_checked,quality_passed) values(gen_random_uuid()::text,'数学','数と代数',$1,'published',true,true) returning id",[content])).rows[0].id;
      const r=(await db.query<{id:string}>("insert into science_releases(name,model_version) values('Nullable authors fixture','science-3pl-reference-v1') returning id")).rows[0].id;
      await db.query("insert into science_release_items(release_id,revision_id,b) values($1,$2,0),($1,$3,0)",[r,q,unowned]);
      const v=(await db.query<{id:string}>("insert into science_visitors(token_hash,user_id,route_group) values(replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''),$1,'A') returning id",[admins[0]])).rows[0].id;
      const a=(await db.query<{id:string}>("insert into science_attempts(visitor_id,user_id,definition,release_id,model_version,kind,total) values($1,$2,'{}',$3,'science-3pl-reference-v1','trial',20) returning id",[v,admins[0],r])).rows[0].id;
      const issue="select (science_issue($1,$2,$3,0,$4,'[0,1,2,3]',.68,1,'Nullable authors fixture',1)).eligible";
      await refused(issue,[a,v,admins[0],q],"already_seen");
      expect((await db.query<{eligible:boolean}>(issue,[a,v,admins[0],unowned])).rows[0].eligible).toBe(true);
    }finally{await db.exec("rollback;reset role");}
  });
});
