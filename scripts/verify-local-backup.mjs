// Rehearse restoration on this Mac. Never contact a remote database or print row data.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
const source=process.argv[2];
if(!source||!path.resolve(source).startsWith(path.resolve("implementation/local")+path.sep))throw new Error("An ignored local backup directory is required");
const order=["profiles","education_profiles","marketing_consents","questions","question_choices","question_sources","exam_sessions","exam_answers","proficiency_estimates","score_history","question_statistics","badges","user_badges","leaderboard_snapshots","event_logs","question_feedback","admin_audit_logs"];
const db=new PGlite();
const result={checkedAt:new Date().toISOString(),scope:"public tables only; Auth accounts and storage not restored",tables:[],state:"running"};
function canonical(value){
  if(value instanceof Date)return value.toISOString();
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
  if(typeof value==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)&&Number.isFinite(Date.parse(value)))return new Date(value).toISOString();
  return value;
}
const digest=rows=>createHash("sha256").update(JSON.stringify(rows.map(r=>JSON.stringify(canonical(r))).sort())).digest("hex");
try{
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
  await db.exec(fs.readFileSync("supabase/migrations/0001_initial_schema.sql","utf8").replace("create extension if not exists pgcrypto;",""));
  await db.exec("alter table auth.users disable trigger user");
  const profiles=JSON.parse(fs.readFileSync(path.join(source,"profiles.json"),"utf8"));
  for(const p of profiles)await db.query("insert into auth.users(id,email) values($1,$2)",[p.id,p.email]);
  for(const table of order){
    const rows=JSON.parse(fs.readFileSync(path.join(source,table+".json"),"utf8"));
    if(!rows.length){result.tables.push({table,rows:0,equal:true});continue;}
    const columns=Object.keys(rows[0]);if(columns.some(c=>!/^[a-z_][a-z0-9_]*$/.test(c)))throw new Error("invalid_column");
    const names=columns.map(c=>`"${c}"`).join(",");
    for(let i=0;i<rows.length;i+=200)await db.query(`insert into "${table}"(${names}) select ${names} from jsonb_populate_recordset(null::"${table}",$1)`,[rows.slice(i,i+200)]);
    const restored=await db.query(`select ${names} from "${table}"`);
    const types=await db.query("select column_name,data_type from information_schema.columns where table_schema='public' and table_name=$1",[table]);
    for(const {column_name,data_type} of types.rows)if(["numeric","bigint"].includes(data_type))for(const row of restored.rows)if(row[column_name]!==null)row[column_name]=Number(row[column_name]);
    const equal=digest(restored.rows)===digest(rows);
    result.tables.push({table,rows:rows.length,equal});if(!equal)throw new Error("restoration_mismatch:"+table);
  }
  result.state="passed";
}catch(error){result.state="failed";fs.writeFileSync(path.join(source,"restore-error.txt"),String(error?.stack??error),{mode:0o600});}
finally{await db.close();fs.writeFileSync(path.join(source,"restoration-check.json"),JSON.stringify(result,null,2),{mode:0o600});}
console.log(JSON.stringify(result));if(result.state!=="passed")process.exitCode=1;
