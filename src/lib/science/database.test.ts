import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
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
  for (const name of ["0001_initial_schema.sql", "0002_service_role_grants.sql", "0003_authenticated_grants_and_marketing_rls.sql", "0004_exam_modes_and_score_kinds.sql", "0005_subdomain_exam.sql", "0006_science_overhaul.sql", "0007_legacy_security_and_identity.sql", "0008_science_account_operations.sql", "0009_science_results_and_badges.sql", "0010_science_rankings.sql", "0011_science_community.sql", "0012_science_admin_metrics.sql", "0013_science_review_collection.sql", "0014_science_release_operations.sql", "0015_science_experiment_analysis.sql", "0016_science_calibration_candidates.sql", "0017_science_corrections.sql"]) {
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
    const args=[draftId,uid,`community:${draftId}`,{rights:true,adultOrGuardianConsent:true}];
    await expect(db.query(sql,args)).rejects.toThrow("submission_not_open");
    await db.query("update science_config set value=value||'{\"labSubmissions\":true,\"licenseVersion\":\"license-test\"}' where key='release'");
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
    const candidate=(await db.query<{id:string}>("insert into science_calibration_candidates(revision_id,release_id,data_version,observed_to,fit,state) values($1,$2,'synthetic-fixture',now(),$3,'qualified') returning id",[item,parent,{b:.3,a:1,c:.25,oldB:0,eligible:true,count:200,sourceOwnerCount:250}])).rows[0].id;
    const job=(await db.query<{id:string}>("select science_begin_job('calibration-test') id")).rows[0].id;
    await expect(db.query("select science_apply_calibration($1,$2,$3)",[parent,[candidate],job])).rejects.toThrow("automatic_calibration_disabled");
    await db.query("update science_config set value=value||'{\"automaticCalibration\":true}' where key='release'");
    const next=(await db.query<{id:string}>("select science_apply_calibration($1,$2,$3) id",[parent,[candidate],job])).rows[0].id;
    expect(next).not.toBe(parent);
    expect((await db.query<{b:number}>("select b from science_release_items where release_id=$1 and revision_id=$2",[parent,item])).rows[0].b).toBe(0);
    expect((await db.query<{b:number}>("select b from science_release_items where release_id=$1 and revision_id=$2",[next,item])).rows[0].b).toBe(.3);
    expect((await db.query<{n:number}>("select count(*)::int n from science_release_items where release_id=$1 and anchor and b<>0",[next])).rows[0].n).toBe(0);
    expect((await db.query<{state:string}>("select state from science_releases where id=$1",[parent])).rows[0].state).toBe("retired");
    expect((await db.query<{state:string}>("select state from science_calibration_candidates where id=$1",[candidate])).rows[0].state).toBe("applied");
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
