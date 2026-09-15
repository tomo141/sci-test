// One-time, reviewable bootstrap. Default is read-only; --publish is an explicit production write.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {digest} from './lib/science-bank.mjs';

const filename=process.argv[2],publish=process.argv[3]==='--publish';
if(!filename||process.argv.length>4||(process.argv[3]&&!publish))throw new Error('Usage: initialize-science-weeks.mjs candidate.json [--publish]');
const bundle=JSON.parse(await readFile(filename,'utf8'));
if(bundle.format!=='science-bank-v2'||bundle.contentDigest!==digest(bundle.candidates)||!bundle.report.readyForInitialRelease)throw new Error('Unverified candidate');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||new URL(url).hostname!=='grwaocjhfdberagsiiou.supabase.co'||!key)throw new Error('Expected production configuration required');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const checked=r=>{if(r.error||r.data===null)throw new Error('Database operation failed: '+(r.error?.code??'no_data'));return r.data;};
const before=checked(await db.from('science_config').select('value').eq('key','release').single()).value;
const active=checked(await db.from('science_releases').select('id,settings').eq('state','active').single());
if(active.settings.importManifest!==bundle.contentDigest)throw new Error('Active release differs from reviewed candidate');
const expected=bundle.candidates.filter(q=>q.use==='weekly-reserve');
const items=checked(await db.from('science_items').select('id,family_id,domain,content,status,rights_checked,quality_passed,expires_at,subdomain').in('id',expected.map(q=>q.id)));
if(items.length!==expected.length)throw new Error('Weekly reserve is incomplete');
for(const item of items){
  const source=expected.find(q=>q.id===item.id);
  if(item.family_id!==source.family_id||item.status!=='published'||!item.rights_checked||!item.quality_passed||
    digest({domain:item.domain,subdomain:item.subdomain,content:item.content})!==source.review_evidence.contentSha256)throw new Error('Unreviewed weekly content');
}
const formal=checked(await db.from('science_release_items').select('revision_id').in('revision_id',items.map(q=>q.id)));
if(formal.length)throw new Error('Weekly reserve overlaps formal questions');
const existing=checked(await db.from('science_weekly_sets').select('id,starts_at,ends_at,revision_ids').order('id'));
const reserveIds=new Set(items.map(q=>q.id));
const used=new Set(existing.flatMap(w=>w.revision_ids));
const now=new Date(),japan=new Date(now.getTime()+9*3600000);
const monday=new Date(Date.UTC(japan.getUTCFullYear(),japan.getUTCMonth(),japan.getUTCDate()));
monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
const planned=[];
for(let index=0;index<2;index++){
  const day=new Date(monday.getTime()+index*7*86400000),id=day.toISOString().slice(0,10);
  const start=new Date(day.getTime()-9*3600000).toISOString(),end=new Date(day.getTime()-9*3600000+7*86400000).toISOString();
  const saved=existing.find(w=>w.id===id);
  if(saved){
    if(new Date(saved.starts_at).toISOString()!==start||new Date(saved.ends_at).toISOString()!==end||saved.revision_ids.length!==10||saved.revision_ids.some(q=>!reserveIds.has(q)))throw new Error('Existing week needs manual review');
    planned.push({id,start,end,ids:saved.revision_ids,state:'already_published'});continue;
  }
  const rank=id2=>createHash('sha256').update(id+':'+id2).digest('hex');
  const selected=bundle.report.capacities.map(c=>items.filter(q=>q.domain===c.domain&&!used.has(q.id)&&(!q.expires_at||new Date(q.expires_at).getTime()>=Date.parse(end))).sort((a,b)=>rank(a.id).localeCompare(rank(b.id)))[0]);
  if(selected.some(q=>!q)||new Set(selected.map(q=>q.family_id)).size!==10)throw new Error('Insufficient distinct weekly reserves');
  selected.forEach(q=>used.add(q.id));
  planned.push({id,start,end,ids:selected.map(q=>q.id),state:'prepared'});
}
if(new Set(planned.flatMap(w=>w.ids)).size!==20)throw new Error('Weeks overlap');
if(publish)for(const week of planned){
  if(week.state==='prepared')checked(await db.rpc('science_publish_week',{p_id:week.id,p_starts:week.start,p_ends:week.end,p_revisions:week.ids}));
  const saved=checked(await db.from('science_weekly_sets').select('starts_at,ends_at,revision_ids').eq('id',week.id).single());
  if(JSON.stringify(saved.revision_ids)!==JSON.stringify(week.ids)||new Date(saved.starts_at).toISOString()!==week.start||new Date(saved.ends_at).toISOString()!==week.end)throw new Error('Published week readback mismatch');
  week.state='published_and_verified';
}
const after=checked(await db.from('science_config').select('value').eq('key','release').single()).value;
if(JSON.stringify(after)!==JSON.stringify(before))throw new Error('Release configuration changed during bootstrap');
const result={checkedAt:new Date().toISOString(),mode:publish?'publish':'read_only',candidateDigest:bundle.contentDigest,
  weeks:planned.map(({ids,...w})=>({...w,questions:ids.length})),distinctQuestions:20,formalOverlap:0,releaseSettingsUnchanged:true};
if(publish)await writeFile('implementation/local/deployment/weekly-live-check.json',JSON.stringify(result,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify(result));
