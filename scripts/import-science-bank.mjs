// Stage reviewed data through atomic RPCs. No write occurs without --stage or --activate.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {domains} from '../src/lib/data/taxonomy.ts';
import {MODEL_VERSION} from '../src/lib/science/versions.ts';
import {digest} from './lib/science-bank.mjs';
const args=process.argv.slice(2),path=args[0];
if(!path)throw new Error('Usage: import-science-bank.mjs candidate.json [--stage|--activate] --actor UUID [--name NAME]');
const bundle=JSON.parse(await readFile(path,'utf8'));
if(bundle.format!=='science-bank-v2'||bundle.contentDigest!==digest(bundle.candidates))throw new Error('Candidate digest mismatch');
for(const source of [bundle.legacySource,bundle.productionSource,...bundle.reviewFiles].filter(Boolean)){
  if(createHash('sha256').update(await readFile(source.path)).digest('hex')!==source.sha256)throw new Error('Source changed after preparation');
}
for(const q of bundle.candidates){
  if(q.review_evidence.contentSha256!==digest({domain:q.domain,subdomain:q.subdomain,content:q.content}))throw new Error('Question content changed');
}
const publish=args.includes('--activate'),write=publish||args.includes('--stage');
const capacity=domains.map(domain=>({domain,formal:new Set(bundle.candidates.filter(q=>q.domain===domain&&q.use==='formal').map(q=>q.family_id)).size,weekly:new Set(bundle.candidates.filter(q=>q.domain===domain&&q.use==='weekly-reserve').map(q=>q.family_id)).size}));
const ready=capacity.every(c=>c.formal>=100&&c.weekly>=2);
if(!write){console.log(JSON.stringify({state:'prepared_only',questions:bundle.candidates.length,ready,capacity}));process.exit(0);}
if(!bundle.candidates.length)throw new Error('No approved questions');
if(publish&&!ready)throw new Error('Initial bank capacity not satisfied');
const actorIndex=args.indexOf('--actor'),actor=z.string().uuid().parse(actorIndex>=0?args[actorIndex+1]:undefined);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Supabase service configuration missing');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
function checked(response){if(response.error)throw new Error(/^[a-z_]{3,80}$/.test(response.error.message)?response.error.message:`database_error:${response.error.code??'unknown'}`);return response.data;}
if(!checked(await db.from('science_admins').select('user_id').eq('user_id',actor).maybeSingle()))throw new Error('Verified administrator required');
let release=checked(await db.from('science_releases').select('id,state,settings').eq('settings->>importManifest',bundle.contentDigest).order('created_at',{ascending:false}).limit(1).maybeSingle());
if(release&&release.state!=='candidate'){console.log(JSON.stringify({state:'already_finalized',releaseId:release.id,releaseState:release.state}));process.exit(0);}
if(!release){
  const nameIndex=args.indexOf('--name'),name=nameIndex>=0?args[nameIndex+1]:`Reviewed bank ${bundle.preparedAt.slice(0,10)}`;
  release=checked(await db.from('science_releases').insert({name,model_version:MODEL_VERSION,settings:{importManifest:bundle.contentDigest,expectedRevisions:bundle.candidates.map(q=>q.id),sources:bundle.reviewFiles,legacySource:bundle.legacySource,capacity},validation:{contentReview:'documented',empiricalCalibration:'not_performed',supplyCounts:capacity}}).select('id,state,settings').single());
}
let staged=0,missingLegacy=0;
for(let offset=0;offset<bundle.candidates.length;offset+=100){
  const result=checked(await db.rpc('science_import_bank_batch',{p_release:release.id,p_actor:actor,p_manifest:bundle.contentDigest,p_rows:bundle.candidates.slice(offset,offset+100)}));
  staged+=result.rows;missingLegacy+=result.legacyAliasesNotPresent;
}
if(publish)checked(await db.rpc('science_finish_bank_import',{p_release:release.id,p_actor:actor,p_manifest:bundle.contentDigest,p_reason:'Activate the reviewed and source-checked initial bank after capacity verification'}));
console.log(JSON.stringify({state:publish?'bank_activated':'candidate_staged',releaseId:release.id,staged,missingLegacy,newAttemptGate:'unchanged'}));
