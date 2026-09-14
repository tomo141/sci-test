// Local preparation only; it does not upload a bank or change the active release.
import {readFile,readdir,mkdir,writeFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {prepareBank} from './lib/science-bank.mjs';
const source='supabase/seed/generated/questions-knowledge.json',folder='content/science-bank-v2';
const raw=await readFile(source,'utf8');
const files=(await readdir(folder)).filter(n=>n.endsWith('.json')).sort();
const inputs=await Promise.all(files.map(async name=>({name,text:await readFile(`${folder}/${name}`,'utf8')})));
const legacy=new Map(JSON.parse(raw).map(row=>[row.id,{id:row.id,question_text:row.question_text,previous_question_texts:[]}]));
let productionSource=null;
if(process.argv[2]){
  const path=await realpath(process.argv[2]);
  if(!path.startsWith(resolve('implementation/local')+sep))throw new Error('Use the authorized ignored local backup');
  const backup=await readFile(path,'utf8');
  for(const row of JSON.parse(backup)){
    if(typeof row.id!=='string'||typeof row.question_text!=='string')throw new Error('Questions backup required');
    const previous=legacy.get(row.id);
    if(previous){if(previous.question_text!==row.question_text)previous.previous_question_texts.push(row.question_text);}
    else legacy.set(row.id,{id:row.id,question_text:row.question_text,previous_question_texts:[]});
  }
  productionSource={path:process.argv[2],sha256:createHash('sha256').update(backup).digest('hex')};
}
const candidate=prepareBank([...legacy.values()],inputs.flatMap(file=>JSON.parse(file.text)));
const sourceDigest=createHash('sha256').update(raw).digest('hex');
const output='implementation/local/question-bank';await mkdir(output,{recursive:true,mode:0o700});
const artifact={...candidate,preparedAt:new Date().toISOString(),legacySource:{path:source,sha256:sourceDigest},productionSource,reviewFiles:inputs.map(file=>({path:`${folder}/${file.name}`,sha256:createHash('sha256').update(file.text).digest('hex')}))};
await writeFile(`${output}/candidate.json`,JSON.stringify(artifact,null,2)+'\n',{mode:0o600});
await writeFile(`${output}/readiness.json`,JSON.stringify(artifact.report,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({path:`${output}/candidate.json`,digest:candidate.contentDigest,legacyRecords:candidate.report.legacyRecords,contentChecked:candidate.report.contentChecked,approved:candidate.report.approved,ready:candidate.report.readyForInitialRelease,pending:candidate.report.pending.length,blockers:candidate.report.blockers.length}));
