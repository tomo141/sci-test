// Local, reviewable artifacts only. The initial user-provided bundle is never changed.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {buildUpgrade} from './lib/science-upgrade.mjs';
const folder='implementation/local/deployment';
await mkdir(folder,{recursive:true,mode:0o700});
for(const stage of ['followups','cutover']){
  const bundle=await buildUpgrade(stage),path=folder+'/'+bundle.name;
  try{await writeFile(path,bundle.sql,{mode:0o600,flag:'wx'});}
  catch(error){if(error.code!=='EEXIST'||await readFile(path,'utf8')!==bundle.sql)throw error;}
  const {sql,...manifest}=bundle;
  await writeFile(path+'.json',JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify({path,stage,sha256:bundle.sha256,migrations:bundle.migrations.length}));
}
