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
  for (const name of ["0001_initial_schema.sql", "0002_service_role_grants.sql", "0003_authenticated_grants_and_marketing_rls.sql", "0004_exam_modes_and_score_kinds.sql", "0005_subdomain_exam.sql", "0006_science_overhaul.sql", "0007_legacy_security_and_identity.sql", "0008_science_account_operations.sql", "0009_science_results_and_badges.sql", "0010_science_rankings.sql"]) {
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
});
