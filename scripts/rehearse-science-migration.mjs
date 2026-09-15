// Apply the exact deployment bundle to an isolated local copy. Never print private row data.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {buildUpgrade} from './lib/science-upgrade.mjs';
import {rehearseScienceBank} from './lib/rehearse-science-bank.mjs';
const backup=process.argv[2],output='implementation/local/deployment';
const bank=process.argv[3];
if(!backup||!path.resolve(backup).startsWith(path.resolve('implementation/local')+path.sep))throw new Error('Ignored local backup required');
if(bank&&!path.resolve(bank).startsWith(path.resolve('implementation/local/question-bank')+path.sep))throw new Error('Ignored local candidate required');
const tables=['profiles','education_profiles','marketing_consents','questions','question_choices','question_sources','exam_sessions','exam_answers','proficiency_estimates','score_history','question_statistics','badges','user_badges','leaderboard_snapshots','event_logs','question_feedback','admin_audit_logs'];
const db=new PGlite();
const result={checkedAt:new Date().toISOString(),state:'running',stages:[],tables:[]};
const canonical=v=>v instanceof Date?v.toISOString():Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(v)&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():v;
const hash=rows=>createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(canonical(r))).sort())).digest('hex');
const inputs=new Map();
try{
  await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
  for(const name of ['0001_initial_schema.sql','0002_service_role_grants.sql','0003_authenticated_grants_and_marketing_rls.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8').replace('create extension if not exists pgcrypto;',''));
  await db.exec('alter table auth.users disable trigger user');
  const profiles=JSON.parse(fs.readFileSync(path.join(backup,'profiles.json'),'utf8'));
  for(const p of profiles)await db.query('insert into auth.users(id,email) values($1,$2)',[p.id,p.email]);
  for(const table of tables){
    const rows=JSON.parse(fs.readFileSync(path.join(backup,table+'.json'),'utf8'));inputs.set(table,rows);
    if(!rows.length)continue;
    const columns=Object.keys(rows[0]);if(columns.some(c=>!/^[a-z_][a-z0-9_]*$/.test(c)))throw new Error('Invalid column');
    const names=columns.map(c=>'"'+c+'"').join(',');
    await db.query(`insert into ${table}(${names}) select ${names} from jsonb_populate_recordset(null::${table},$1::jsonb)`,[JSON.stringify(rows)]);
  }
  result.stages.push('local_backup_loaded');
  const bundle=fs.readFileSync(output+'/additive-schema.sql','utf8');result.bundleSha256=createHash('sha256').update(bundle).digest('hex');
  await db.exec(bundle);result.stages.push('additive_schema_passed');
  const followups=await buildUpgrade('followups');await db.exec(followups.sql);result.followups=followups.migrations;
  result.followupBundleSha256=followups.sha256;
  result.stages.push('followup_migrations_passed');
  const cutover=await buildUpgrade('cutover');await db.exec(cutover.sql);result.cutoverBundleSha256=cutover.sha256;result.stages.push('security_cutover_passed');
  const ledger=(await db.query('select name,sha256 from science_migration_history')).rows;
  result.recordedMigrations=ledger.length;
  if([...followups.migrations,...cutover.migrations,...followups.prerequisites].some(q=>!ledger.some(r=>r.name===q.name&&r.sha256===q.sha256)))throw new Error('Migration ledger mismatch');
  if(bank){
    result.bank=await rehearseScienceBank(db,bank);
    result.stages.push('actual_reviewed_bank_passed');
  }
  for(const table of tables){
    const expected=inputs.get(table),columns=Object.keys(expected[0]??{});
    const actual=(await db.query(`select ${columns.length?columns.map(c=>'"'+c+'"').join(','):'*'} from ${table}`)).rows;
    // Supabase REST represents numeric as numbers, whereas pg drivers can return numeric strings.
    const types=(await db.query("select column_name,data_type from information_schema.columns where table_schema='public' and table_name=$1",[table])).rows;
    const numeric=new Set(types.filter(r=>['numeric','bigint'].includes(r.data_type)).map(r=>r.column_name));
    const normalized=actual.map(r=>Object.fromEntries(Object.entries(r).map(([key,value])=>[key,numeric.has(key)&&value!==null?Number(value):value])));
    const equal=expected.length===normalized.length&&hash(expected)===hash(normalized);
    result.tables.push({table,rows:expected.length,equal});if(!equal)throw new Error('Legacy values changed: '+table);
  }
  result.permissions=(await db.query("select has_table_privilege('authenticated','question_choices','SELECT') answer_keys,has_column_privilege('authenticated','profiles','role','UPDATE') role_write,has_table_privilege('anon','science_items','SELECT') new_bank")).rows[0];
  if(Object.values(result.permissions).some(Boolean))throw new Error('Unsafe grants remain');
  result.migratedProfiles=(await db.query('select count(*)::int n from science_profiles')).rows[0].n;
  result.migratedConsents=(await db.query('select count(*)::int n from science_consents')).rows[0].n;
  result.state='passed';
}catch(error){result.state='failed';fs.writeFileSync(output+'/rehearsal-error.txt',String(error?.stack??error),{mode:0o600});}
finally{await db.close();fs.writeFileSync(output+'/rehearsal.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});}
console.log(JSON.stringify(result));if(result.state!=='passed')process.exitCode=1;
