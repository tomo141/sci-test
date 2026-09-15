// Read-only production readback. Only aggregate verification results leave the local report.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {digest} from './lib/science-bank.mjs';

const filename=process.argv[2];
if(!filename)throw new Error('Usage: verify-science-bank-live.mjs candidate.json');
const bundle=JSON.parse(await readFile(filename,'utf8'));
assert.equal(bundle.contentDigest,digest(bundle.candidates),'Candidate digest mismatch');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
function checked(result){if(result.error)throw new Error('Database read failed');return result.data;}
async function all(table,columns,order,filter){
  const rows=[];let total;
  for(let offset=0;;offset+=1000){
    let query=db.from(table).select(columns,{count:'exact'}).order(order);
    if(filter)query=query.eq(...filter);
    const result=await query.range(offset,offset+999);
    const page=checked(result);
    assert.ok(Array.isArray(page)&&result.count!==null,'Incomplete database read');
    if(total!==undefined)assert.equal(result.count,total,'Rows changed during read');
    total=result.count;rows.push(...page);
    if(rows.length>=total)return rows;
    assert.ok(page.length,'Incomplete database page');
  }
}
const release=checked(await db.from('science_releases').select('id,state').eq('settings->>importManifest',bundle.contentDigest).single());
assert.ok(['candidate','active'].includes(release.state),'Unexpected release state');
const results=await Promise.allSettled([
  all('science_bank_import_items','revision_id,usage','revision_id',['release_id',release.id]),
  all('science_items','id,family_id,domain,subdomain,content,status,quality_passed,rights_checked,review_evidence','id'),
  all('science_release_items','revision_id,a,b,c,focus,anchor,parameter_evidence','revision_id',['release_id',release.id]),
  all('science_legacy_families','question_id,family_id','question_id'),
  all('questions','id','id'),
  db.from('science_config').select('value').eq('key','release').single().then(checked),
  db.from('science_releases').select('id').eq('state','active').then(checked),
]);
for(const r of results)if(r.status==='rejected')throw r.reason;
const [imports,items,parameters,aliases,legacy,config,active]=results.map(r=>r.value);
assert.equal(imports.length,bundle.candidates.length,'Unexpected imported revision count');
assert.equal(parameters.length,bundle.candidates.filter(q=>q.use==='formal').length,'Unexpected formal supply');
const importedById=new Map(imports.map(q=>[q.revision_id,q]));
const itemsById=new Map(items.map(q=>[q.id,q]));
const paramsById=new Map(parameters.map(q=>[q.revision_id,q]));
for(const expected of bundle.candidates){
  const actual=itemsById.get(expected.id);
  assert.ok(actual,'Missing reviewed revision');
  assert.equal(importedById.get(expected.id)?.usage,expected.use,'Usage mismatch');
  assert.equal(actual.family_id,expected.family_id,'Family mismatch');
  assert.equal(actual.status,release.state==='active'?'published':'draft','Publication state mismatch');
  assert.equal(digest({domain:actual.domain,subdomain:actual.subdomain,content:actual.content}),expected.review_evidence.contentSha256,'Stored content mismatch');
  assert.equal(digest(actual.review_evidence),digest(expected.review_evidence),'Review evidence mismatch');
  assert.equal(actual.quality_passed,true,'Quality check missing');
  assert.equal(actual.rights_checked,true,'Rights check missing');
  if(expected.use==='formal'){
    const p=paramsById.get(expected.id);
    assert.ok(p,'Formal parameters missing');
    for(const field of ['a','b','c','focus','anchor'])assert.equal(p[field],expected.parameters[field],`Parameter mismatch: ${field}`);
    assert.equal(digest(p.parameter_evidence),digest(expected.parameter_evidence),'Parameter evidence mismatch');
  }else assert.equal(paramsById.has(expected.id),false,'Reserve question entered formal supply');
}
const originalIds=new Set(legacy.map(q=>q.id));
const expectedAliases=new Map(bundle.candidates.flatMap(q=>q.legacy_ids.filter(id=>originalIds.has(id)).map(id=>[id,q.family_id])));
const actualAliases=new Map(aliases.map(q=>[q.question_id,q.family_id]));
for(const [id,family] of expectedAliases)assert.equal(actualAliases.get(id),family,'Legacy exposure alias mismatch');
const capacity=bundle.report.capacities.map(({domain})=>{
  const selected=bundle.candidates.filter(q=>q.domain===domain);
  const formal=selected.filter(q=>q.use==='formal');
  return {domain,formal:formal.length,weekly:selected.length-formal.length,focus:formal.filter(q=>q.parameters.focus).length,subdomains:new Set(formal.map(q=>q.subdomain)).size};
});
assert.equal(capacity.length,10);
for(const c of capacity)assert.ok(c.formal>=100&&c.weekly>=2&&c.focus===20&&c.subdomains===10,'Insufficient domain capacity');
if(release.state==='active')assert.deepEqual(active.map(q=>q.id),[release.id],'Active release mismatch');
const report={checkedAt:new Date().toISOString(),state:'passed',releaseId:release.id,releaseState:release.state,contentDigest:bundle.contentDigest,
  questions:imports.length,storedContentAndEvidence:'matched',storedParameters:'matched',capacity,
  legacyAliases:expectedAliases.size,legacyAliasesNotPresent:bundle.candidates.flatMap(q=>q.legacy_ids).filter(id=>!originalIds.has(id)).length,
  releaseConfig:config.value,scope:'Read-only live bank verification; no authentication, mail delivery or browser end-to-end verification'};
await writeFile('implementation/local/deployment/bank-live-check.json',JSON.stringify(report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify(report));
