import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const owner = "10000000-0000-4000-8000-000000000001", second = "10000000-0000-4000-8000-000000000002";
const visitor = "20000000-0000-4000-8000-000000000001", token = "30000000-0000-4000-8000-000000000001", wrongToken = "30000000-0000-4000-8000-000000000002";
const hash = "a".repeat(64);
beforeAll(async () => {
  db = new PGlite();
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;");
  for (const name of readdirSync("supabase/migrations").filter(n => /^\d{4}_.*\.sql$/.test(n)).sort()) await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8").replace("create extension if not exists pgcrypto;", ""));
}, 30000);
afterAll(async () => { await db?.close(); });
async function fixture() {
  await db.exec("begin");
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'first@example.invalid',now()),($2,'second@example.invalid',now())", [owner, second]);
  await db.query("insert into science_profiles(user_id,interests) values($1,array['物理']),($2,'{}')", [owner, second]);
  await db.query("insert into science_entitlements(user_id,source) values($1,'test')", [owner]);
  await db.query("insert into science_visitors(id,user_id,token_hash,route_group) values($1,$2,$3,'A')", [visitor, owner, hash]);
  await db.query("select science_update_consents($1,'{\"science\":true,\"weekly\":true,\"domain_opening\":true}',gen_random_uuid())", [owner]);
  await db.exec("update science_config set value=value||'{\"mailDelivery\":true,\"newAttempts\":true}'::jsonb where key='release'");
  return (await db.query<{ id: string }>("select id from science_outbox where dedupe_key=$1", [`welcome:${owner}`])).rows[0].id;
}
const claim = (id: string, t = token) => db.query<{ result: Record<string, unknown> }>("select science_claim_mail($1,$2,$3) result", [id, t, hash]);
const authorize = (id: string, t = token) => db.query<{ ok: boolean }>("select science_authorize_mail($1,$2,$3) ok", [id, t, "b".repeat(64)]);

describe.sequential("mail delivery integrity in PostgreSQL", () => {
  it("queues only the active week, resumes bounded batches, and omits completed participants", async () => {
    await fixture();
    try {
      await db.query("select science_update_consents($1,'{\"weekly\":true}',gen_random_uuid())", [second]);
      await db.exec("insert into science_weekly_sets(id,starts_at,ends_at,revision_ids) values('mail-test-week',now()-interval '1 day',now()+interval '6 days',array(select gen_random_uuid() from generate_series(1,10)))");
      for (const expected of [1, 1, 0]) expect((await db.query<{ r: { queued: number } }>("select science_queue_weekly_mail(1) r")).rows[0].r.queued).toBe(expected);
      await db.query("insert into science_attempts(visitor_id,user_id,definition,model_version,kind,total,week_id,state,ordinal,result,completed_at) values($1,$2,'{}','test','weekly',10,'mail-test-week','completed',10,'{}',now())", [visitor, owner]);
      const id = (await db.query<{ id: string }>("select id from science_outbox where dedupe_key=$1", [`weekly:mail-test-week:${owner}`])).rows[0].id;
      expect((await claim(id)).rows[0].result).toMatchObject({ state: "cancelled", reason: "already_completed" });
      await db.exec("update science_weekly_sets set ends_at=now()-interval '1 second' where id='mail-test-week'");
      expect((await db.query<{ r: { state: string } }>("select science_queue_weekly_mail() r")).rows[0].r.state).toBe("no_current_week");
    } finally { await db.exec("rollback"); }
  });
  it("claims once, protects Auth, and checks consent again immediately before sending", async () => {
    const id = await fixture();
    try {
      await db.exec("set role service_role");
      expect((await claim(id)).rows[0].result).toMatchObject({ state: "claimed", email: "first@example.invalid", interests: ["物理"] });
      expect((await claim(id, wrongToken)).rows[0].result.state).toBe("not_claimed");
      expect((await authorize(id, wrongToken)).rows[0].ok).toBe(false);
      expect((await db.query<{ value: string | null }>("select science_private.mail_recipient($1,$2) value", [id, wrongToken])).rows[0].value).toBeNull();
      await db.query("select science_update_consents($1,'{\"science\":false}',gen_random_uuid())", [owner]);
      expect((await authorize(id)).rows[0].ok).toBe(false);
      expect((await db.query<{ state: string }>("select state from science_outbox where id=$1", [id])).rows[0].state).toBe("cancelled");
      await db.exec("reset role");
      const privileges = (await db.query<{ tokens: boolean; recipient: boolean; unsubscribe: boolean }>("select has_table_privilege('anon','science_mail_unsubscribe_tokens','select') tokens,has_function_privilege('authenticated','science_private.mail_recipient(uuid,uuid)','execute') recipient,has_function_privilege('anon','science_unsubscribe_mail(text)','execute') unsubscribe")).rows[0];
      expect(privileges).toEqual({ tokens: false, recipient: false, unsubscribe: false });
    } finally { await db.exec("rollback;reset role"); }
  });
  it("allows idempotent token-only unsubscribe even after email confirmation changes, preserving access", async () => {
    const id = await fixture();
    try {
      await claim(id);
      expect((await db.query<{ ok: boolean }>("select science_unsubscribe_mail($1) ok", ["f".repeat(64)])).rows[0].ok).toBe(false);
      await db.query("update auth.users set email_confirmed_at=null where id=$1", [owner]);
      for (let i = 0; i < 2; i++) expect((await db.query<{ ok: boolean }>("select science_unsubscribe_mail($1) ok", [hash])).rows[0].ok).toBe(true);
      expect((await db.query("select * from science_consents where user_id=$1 and enabled", [owner])).rows).toHaveLength(0);
      expect((await db.query("select * from science_events where user_id=$1 and event_name='mail_consent_revoked'", [owner])).rows).toHaveLength(3);
      expect((await db.query("select * from science_entitlements where user_id=$1", [owner])).rows).toHaveLength(1);
      expect((await authorize(id)).rows[0].ok).toBe(false);
    } finally { await db.exec("rollback"); }
  });
  it("never replays an uncertain delivery and throttles messages after acceptance", async () => {
    const id = await fixture();
    try {
      await claim(id); expect((await authorize(id)).rows[0].ok).toBe(true);
      expect((await authorize(id)).rows[0].ok).toBe(false);
      await db.query("update science_outbox set locked_at=now()-interval '6 minutes' where id=$1", [id]);
      expect((await db.query<{ n: number }>("select science_recover_stalled_mail() n")).rows[0].n).toBe(1);
      expect((await claim(id)).rows[0].result.state).toBe("not_claimed");
      expect((await db.query<{ state: string; error_code: string }>("select state,error_code from science_outbox where id=$1", [id])).rows[0]).toEqual({ state: "blocked", error_code: "delivery_outcome_unknown" });
      const secondMail = (await db.query<{ id: string }>("update science_outbox set available_at=now() where dedupe_key=$1 returning id", [`welcome2:${owner}`])).rows[0].id;
      await claim(secondMail, wrongToken); await authorize(secondMail, wrongToken);
      await db.query("select science_finish_mail($1,$2,'accepted','test-message',null)", [secondMail, wrongToken]);
      const third = (await db.query<{ id: string }>("insert into science_outbox(dedupe_key,user_id,kind,payload) values('third-mail',$1,'mail','{\"template\":\"welcome\",\"topic\":\"science\"}') returning id", [owner])).rows[0].id;
      expect((await claim(third)).rows[0].result.state).toBe("deferred");
    } finally { await db.exec("rollback"); }
  });
  it("recovers interruptions before dispatch and marks expired jobs accurately", async () => {
    const id = await fixture();
    try {
      await claim(id);
      await db.query("update science_outbox set locked_at=now()-interval '6 minutes' where id=$1", [id]);
      await db.exec("select science_recover_stalled_mail()");
      expect((await claim(id, wrongToken)).rows[0].result.state).toBe("claimed");
      await db.exec("savepoint reject_unapproved");
      await expect(db.query("select science_finish_mail($1,$2,'accepted','not-sent',null)", [id, wrongToken])).rejects.toThrow("mail_not_authorized");
      await db.exec("rollback to savepoint reject_unapproved");
      const firstJob = (await db.query<{ id: string }>("select science_begin_job('mail-test') id")).rows[0].id;
      expect((await db.query<{ id: string | null }>("select science_begin_job('mail-test') id")).rows[0].id).toBeNull();
      await db.exec("update science_job_leases set expires_at=now()-interval '1 second' where kind='mail-test'");
      await db.exec("select science_begin_job('mail-test')");
      expect((await db.query<{ state: string }>("select state from science_jobs where id=$1", [firstJob])).rows[0].state).toBe("interrupted");
    } finally { await db.exec("rollback"); }
  });
  it("stops a delivery if the confirmed address changes after composition", async () => {
    const id = await fixture();
    try {
      await claim(id);
      await db.query("update auth.users set email='changed@example.invalid' where id=$1", [owner]);
      expect((await authorize(id)).rows[0].ok).toBe(false);
      expect((await db.query<{ error_code: string }>("select error_code from science_outbox where id=$1", [id])).rows[0].error_code).toBe("email_changed");
    } finally { await db.exec("rollback"); }
  });
});
