// Read-only checks. Output contains schema hashes and aggregate counts, never row payloads or credentials.
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Supabase configuration required');
const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
const names=(await readdir('supabase/migrations')).filter(n=>/^\d{4}_/.test(n)&&Number(n.slice(0,4))>=4).sort();
const expected=await Promise.all(names.map(async name=>({name,sha256:createHash('sha256').update(await readFile('supabase/migrations/'+name)).digest('hex')})));
const results=await Promise.allSettled([
  db.from('science_migration_history').select('name,sha256').order('name'),
  ...['science_items','science_admins','science_profiles','science_attempts'].map(table=>db.from(table).select('*',{count:'exact'}).limit(0)),
  db.from('science_config').select('value').eq('key','release').maybeSingle(),
  db.from('science_releases').select('id,model_version').eq('state','active').maybeSingle()
]);
const unpack=index=>results[index].status==='fulfilled'?results[index].value:{data:null,error:{code:'request_failed'}};
const ledger=unpack(0),applied=new Map((ledger.data??[]).map(r=>[r.name,r.sha256]));
const migrations=expected.map(m=>({name:m.name,state:applied.get(m.name)===m.sha256?'matches':applied.has(m.name)?'hash_mismatch':'not_recorded'}));
const counts=['science_items','science_admins','science_profiles','science_attempts'].map((table,i)=>{const r=unpack(i+1);return {table,state:r.error?'unavailable':r.count===null?'count_unknown':'retrieved',count:r.error?null:r.count,errorCode:r.error?.code??null};});
const settings=unpack(5),active=unpack(6);
const schemaReady=!ledger.error&&migrations.every(m=>m.state==='matches');
const report={checkedAt:new Date().toISOString(),schemaReady,ledgerError:ledger.error?.code??null,migrations,counts,
  releaseSettings:settings.error?'unavailable':settings.data?.value??'not_found',activeRelease:active.error?'unavailable':active.data??'not_found',
  smtp:'not_verified_by_this_read',permissions:'not_verified_by_this_read',realUserFlow:'not_verified_by_this_read'};
console.log(JSON.stringify(report));
if(!schemaReady||counts.some(c=>c.state!=='retrieved'))process.exitCode=1;
