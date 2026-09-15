import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { MyaspSnapshot } from "./myasp";
let db: PGlite;
const owner = "10000000-0000-4000-8000-000000000001", token = "20000000-0000-4000-8000-000000000001", secondToken = "20000000-0000-4000-8000-000000000002";
beforeAll(async () => {
  db = new PGlite();
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;");
  for (const name of readdirSync("supabase/migrations").filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
}, 30000);
afterAll(async () => { await db?.close(); });
async function fixture() {
  await db.exec("begin");
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'reader@example.invalid',now())", [owner]);
  await db.query("insert into science_profiles(user_id,interests) values($1,array['物理'])", [owner]);
  await db.query("insert into science_entitlements(user_id,source) values($1,'test')", [owner]);
  await db.query("select science_update_consents($1,'{\"science\":true,\"weekly\":true,\"domain_opening\":true}',gen_random_uuid())", [owner]);
}
async function claim(t = token) { return (await db.query<{ r: { state: string; snapshot: MyaspSnapshot } }>("select science_claim_myasp_sync($1) r", [t])).rows[0].r; }
async function enable() { await db.exec("update science_config set value=value||'{\"myaspSync\":true}' where key='release'"); }
async function bind() { const s = (await claim()).snapshot; await db.query("select science_bind_myasp($1,$2,'test-reader',$3)", [owner, token, s.emailHash]); return s; }
describe.sequential("MyASP consent synchronization in PostgreSQL", () => {
  it("remains disabled by default and protects all recipient details from browser roles", async () => {
    await fixture();
    try {
      expect((await claim()).state).toBe("disabled");
      const rights = (await db.query("select has_table_privilege('anon','science_myasp_sync','select') a,has_function_privilege('authenticated','science_myasp_snapshot(uuid)','execute') b")).rows[0];
      expect(rights).toEqual({ a: false, b: false });
      await enable(); await db.exec("set role service_role");
      expect((await claim()).snapshot).toMatchObject({ email: "reader@example.invalid", interests: ["物理"], deliveryEnabled: false });
      expect((await claim(secondToken)).state).toBe("idle");
    } finally { await db.exec("rollback;reset role"); }
  });
  it("keeps changes made during a synchronization pending for another pass", async () => {
    await fixture();
    try {
      await enable(); const before = (await claim()).snapshot;
      await db.query("select science_update_consents($1,'{\"weekly\":false}',gen_random_uuid())", [owner]);
      await db.query("select science_finish_myasp_sync($1,$2,'active')", [owner, token]);
      const next = await claim(secondToken);
      expect(next.snapshot.version).toBeGreaterThan(before.version); expect(next.snapshot.consents.weekly).toBe(false);
    } finally { await db.exec("rollback"); }
  });
  it("imports an observed remote stop once and preserves the account and exam entitlement", async () => {
    await fixture();
    try {
      await enable(); await bind();
      for (let n = 0; n < 2; n++) expect((await db.query<{ ok: boolean }>("select science_record_myasp_stop($1,$2,'test-reader') ok", [owner, token])).rows[0].ok).toBe(true);
      expect((await db.query("select * from science_consents where user_id=$1 and enabled", [owner])).rows).toHaveLength(0);
      expect((await db.query("select * from science_events where user_id=$1 and payload->>'source'='myasp'", [owner])).rows).toHaveLength(3);
      expect((await db.query("select * from science_entitlements where user_id=$1", [owner])).rows).toHaveLength(1);
      expect((await db.query("select * from science_outbox where user_id=$1 and kind='mail' and state='pending'", [owner])).rows).toHaveLength(0);
    } finally { await db.exec("rollback"); }
  });
  it("retains the former recipient binding until the worker confirms its stop", async () => {
    await fixture();
    try {
      await enable(); const before = await bind();
      await db.query("update auth.users set email='new@example.invalid' where id=$1", [owner]);
      const s = (await db.query<{ r: MyaspSnapshot }>("select science_myasp_snapshot($1) r", [owner])).rows[0].r;
      expect(s.remoteEmailHash).toBe(before.emailHash); expect(s.emailHash).not.toBe(before.emailHash); expect(s.version).toBeGreaterThan(before.version);
      expect((await db.query<{ ok: boolean }>("select science_clear_myasp_binding($1,$2,'test-reader') ok", [owner, secondToken])).rows[0].ok).toBe(false);
      expect((await db.query<{ ok: boolean }>("select science_clear_myasp_binding($1,$2,'test-reader') ok", [owner, token])).rows[0].ok).toBe(true);
    } finally { await db.exec("rollback"); }
  });
  it("does not expose an unverified address and rejects an expired worker result", async () => {
    await fixture();
    try {
      await enable(); await claim();
      await db.query("update auth.users set email_confirmed_at=null where id=$1", [owner]);
      const s = (await db.query<{ r: MyaspSnapshot }>("select science_myasp_snapshot($1) r", [owner])).rows[0].r;
      expect(s.email).toBeNull(); expect(s.emailHash).toBeNull();
      await db.exec("update science_myasp_sync set locked_until=now()-interval '1 minute'");
      expect((await db.query<{ ok: boolean }>("select science_finish_myasp_sync($1,$2,'active') ok", [owner, token])).rows[0].ok).toBe(false);
      expect((await claim(secondToken)).state).toBe("claimed");
    } finally { await db.exec("rollback"); }
  });
});
