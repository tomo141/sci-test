// Read-only comparison with the authorized local backup. Never output row values.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const backup=process.argv[2];
if(!backup||!path.resolve(backup).startsWith(path.resolve('implementation/local')+path.sep))throw new Error('Ignored local backup required');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const tables=['profiles','education_profiles','marketing_consents','questions','question_choices','question_sources','exam_sessions','exam_answers','proficiency_estimates','score_history','question_statistics','badges','user_badges','leaderboard_snapshots','event_logs','question_feedback','admin_audit_logs'];
const keys={education_profiles:['user_id'],question_statistics:['question_id'],user_badges:['user_id','badge_id']};
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const hash=rows=>createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(canonical(r))).sort())).digest('hex');
const checks=await Promise.allSettled(tables.map(async table=>{
  const expected=JSON.parse(await readFile(path.join(backup,table+'.json'),'utf8'));
  const columns=Object.keys(expected[0]??{});
  if(columns.some(c=>!/^[a-z_][a-z0-9_]*$/.test(c)))throw new Error('Invalid column');
  const actual=[];let total;
  for(let offset=0;;offset+=1000){
    let request=db.from(table).select(columns.length?columns.join(','):'*',{count:'exact'});
    for(const key of keys[table]??['id'])request=request.order(key);
    const {data,error,count}=await request.range(offset,offset+999);
    if(error||!Array.isArray(data)||count===null)throw new Error('Read failed');
    if(total!==undefined&&total!==count)throw new Error('Rows changed during read');
    total=count;actual.push(...data);
    if(actual.length>=total)break;
    if(!data.length)throw new Error('Incomplete page');
  }
  return {table,backupRows:expected.length,currentRows:actual.length,equal:expected.length===actual.length&&hash(expected)===hash(actual)};
}));
const results=checks.map((r,i)=>r.status==='fulfilled'?r.value:{table:tables[i],state:'unavailable',equal:null});
const report={checkedAt:new Date().toISOString(),scope:'Existing public-table columns only; no Auth or storage verification; no writes to Supabase',allEqual:results.every(r=>r.equal===true),tables:results};
await writeFile('implementation/local/deployment/legacy-live-check.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify(report));
if(!report.allEqual)process.exitCode=1;
