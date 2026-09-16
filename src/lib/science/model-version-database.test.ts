import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {MODEL_VERSION,LEGACY_MODEL_VERSION,CURRENT_VERSION,LEGACY_CURRENT_VERSION} from './versions';
let db:PGlite;
const user='18000000-0000-4000-8000-000000000001',visitor='28000000-0000-4000-8000-000000000001';
let oldRelease:string,newRelease:string;
beforeAll(async()=>{
 db=new PGlite();
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 for(const f of readdirSync('supabase/migrations').filter(n=>/^\d{4}_.*\.sql$/.test(n)).sort())await db.exec(readFileSync('supabase/migrations/'+f,'utf8').replace('create extension if not exists pgcrypto;',''));
 await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'version-fixture@example.invalid',now())",[user]);
 await db.query("insert into science_visitors(id,token_hash,route_group) values($1,$2,'A')",[visitor,'84'.repeat(32)]);
 oldRelease=(await db.query<{id:string}>("insert into science_releases(name,model_version,state) values('Old fixture',$1,'active') returning id",[LEGACY_MODEL_VERSION])).rows[0].id;
 newRelease=(await db.query<{id:string}>("insert into science_releases(name,model_version) values('New fixture',$1) returning id",[MODEL_VERSION])).rows[0].id;
},30000);
afterAll(async()=>{await db?.close();});
describe.sequential('measurement release boundaries',()=>{
 it('rejects mismatched item and scoring versions but retains an old in-progress attempt',async()=>{
  const q="insert into science_attempts(visitor_id,definition,release_id,model_version,kind,total) values($1,'{}',$2,$3,'trial',20)";
  await expect(db.query(q,[visitor,oldRelease,MODEL_VERSION])).rejects.toThrow('measurement_version_mismatch');
  await db.query(q,[visitor,oldRelease,LEGACY_MODEL_VERSION]);
  expect((await db.query<{model_version:string}>('select model_version from science_attempts')).rows[0].model_version).toBe(LEGACY_MODEL_VERSION);
 });
 it('accepts a newly versioned current estimate even with no new answers, and rejects a stale old worker',async()=>{
  const save=async(version:string,through:string|null)=>(await db.query<{ok:boolean}>('select science_store_current($1,$2,$3,0) ok',[user,{version,total:null},through])).rows[0].ok;
  expect(await save(LEGACY_CURRENT_VERSION,'2026-09-16')).toBe(true);
  expect(await save(CURRENT_VERSION,null)).toBe(false);
  await db.query("update science_releases set state='retired' where id=$1",[oldRelease]);
  await db.query("update science_releases set state='active' where id=$1",[newRelease]);
  expect(await save(CURRENT_VERSION,null)).toBe(true);
  expect(await save(LEGACY_CURRENT_VERSION,'2026-09-17')).toBe(false);
  expect((await db.query<{version:string}>('select version from science_current_estimates where user_id=$1',[user])).rows[0].version).toBe(CURRENT_VERSION);
  expect((await db.query<{model_version:string}>('select model_version from science_attempts')).rows[0].model_version).toBe(LEGACY_MODEL_VERSION);
 });
 it('does not grant public callers access to version guards or scoring writes',async()=>{
  const result=await db.query<{guard:boolean;write:boolean}>("select has_function_privilege('authenticated','science_guard_attempt_model()','execute') guard,has_function_privilege('anon','science_store_current(uuid,jsonb,timestamptz,integer)','execute') write");
  expect(result.rows[0]).toEqual({guard:false,write:false});
 });
});
