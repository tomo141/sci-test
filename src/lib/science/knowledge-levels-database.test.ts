import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { KNOWLEDGE_LEVEL_VERSION, newLevelReference } from "./knowledge-levels";
let db: PGlite;
const user = "19000000-0000-4000-8000-000000000001", otherUser = "19000000-0000-4000-8000-000000000002";
let visitor: string, otherVisitor: string, attempt: string;
beforeAll(async () => {
  db = new PGlite();
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
  for (const f of readdirSync("supabase/migrations").filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) await db.exec(readFileSync("supabase/migrations/" + f, "utf8").replace("create extension if not exists pgcrypto;", ""));
  for (const [id, email] of [[user, "levels@example.invalid"], [otherUser, "other-levels@example.invalid"]]) await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())", [id, email]);
  visitor = (await db.query<{ id: string }>("insert into science_visitors(token_hash,route_group) values($1,'A') returning id", ["92".repeat(32)])).rows[0].id;
  otherVisitor = (await db.query<{ id: string }>("insert into science_visitors(token_hash,route_group,user_id) values($1,'B',$2) returning id", ["93".repeat(32), otherUser])).rows[0].id;
  attempt = (await db.query<{ id: string }>("insert into science_attempts(visitor_id,definition,model_version,kind,total,ordinal,state,result,completed_at) values($1,'{}','science-3pl-p70-linear-v2','trial',20,20,'completed','{\"total\":500}',now()) returning id", [visitor])).rows[0].id;
}, 30000);
afterAll(async () => { await db?.close(); });
describe.sequential("knowledge judgement privacy and history", () => {
  it("keeps scope-specific history without changing scores and rejects replay duplicates", async () => {
    const sql = "insert into science_level_assessments(visitor_id,attempt_id,operation_id,domain,subdomain,definition_version,level,created_at) values($1,$2,$3,'化学',$4,$5,$6,$7)";
    const first = [visitor, attempt, "49000000-0000-4000-8000-000000000001", null, KNOWLEDGE_LEVEL_VERSION, "bachelor", "2026-09-16T00:00:00Z"];
    await db.query(sql, first);
    await expect(db.query(sql, first)).rejects.toThrow(/unique|duplicate/);
    await db.query(sql, [visitor, attempt, "49000000-0000-4000-8000-000000000002", "有機化学", KNOWLEDGE_LEVEL_VERSION, "master", "2026-09-16T00:00:01Z"]);
    await db.query(sql, [visitor, attempt, "49000000-0000-4000-8000-000000000003", null, KNOWLEDGE_LEVEL_VERSION, null, "2026-09-16T00:00:02Z"]);
    const latest = (await db.query<{ subdomain: string | null; level: string | null }>("select subdomain,level from science_level_history($1,null)", [visitor])).rows;
    expect(latest).toEqual(expect.arrayContaining([{ subdomain: null, level: null }, { subdomain: "有機化学", level: "master" }]));
    expect((await db.query<{ n: number }>("select count(*)::int n from science_level_assessments")).rows[0].n).toBe(3);
    expect((await db.query<{ result: unknown }>("select result from science_attempts where id=$1", [attempt])).rows[0].result).toEqual({ total: 500 });
  });
  it("carries anonymous answers across a verified visitor claim without exposing another owner's records", async () => {
    await db.query("update science_visitors set user_id=$1 where id=$2", [user, visitor]);
    expect((await db.query("select * from science_level_history($1,$2)", [otherVisitor, user])).rows).toHaveLength(2);
    expect((await db.query("select * from science_level_history($1,$2)", [visitor, otherUser])).rows).toHaveLength(0);
  });
  it("freezes the author's judgement with the submitted revision", async () => {
    const reference = { ...newLevelReference(), level: "master", confidence: "confident" };
    const draft = (await db.query<{ id: string }>("insert into science_submission_drafts(author_id,domain,subdomain,content,level_reference) values($1,'化学','有機化学','{}',$2) returning id", [user, reference])).rows[0].id;
    const item = (await db.query<{ id: string }>("insert into science_items(family_id,version,domain,subdomain,content,status) values('level-fixture',1,'化学','有機化学',$1,'submitted') returning id", [{question:"Which option is the fixture answer?",choices:["one","two","three","four"],correctIndex:1,explanation:"The fixture answer is two."}])).rows[0].id;
    await db.query("update science_submission_drafts set revision_id=$1,revision=2,state='submitted' where id=$2", [item, draft]);
    await db.query("update science_submission_drafts set level_reference=$1 where id=$2", [{ ...reference, level: "doctor_research" }, draft]);
    expect((await db.query<{ reference: unknown }>("select reference from science_item_level_references where revision_id=$1", [item])).rows[0].reference).toEqual(reference);
    await expect(db.query("update science_submission_drafts set level_reference='{}' where id=$1", [draft])).rejects.toThrow(/check/);
  });
  it("denies browser roles read/write access and keeps judgements append-only for application callers", async () => {
    for (const table of ["science_level_assessments", "science_item_level_references"]) {
      const row = (await db.query<{ read: boolean; write: boolean; update: boolean }>("select has_table_privilege('anon',$1,'select') read,has_table_privilege('authenticated',$1,'insert') write,has_table_privilege('service_role',$1,'update') as update", [table])).rows[0];
      expect(row).toEqual({ read: false, write: false, update: false });
    }
    expect((await db.query<{ allowed: boolean }>("select has_function_privilege('authenticated','science_level_history(uuid,uuid)','execute') allowed")).rows[0].allowed).toBe(false);
  });
});
