import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function buildUpgrade(stage,after=19){
  if(!['followups','cutover'].includes(stage))throw new Error('Unknown deployment stage');
  if(!Number.isInteger(after)||after<19||(stage==='cutover'&&after!==19))throw new Error('Invalid migration boundary');
  const names=(await readdir('supabase/migrations')).filter(n=>/^\d{4}_[a-z0-9_]+\.sql$/.test(n)).sort();
  const base=names.filter(n=>Number(n.slice(0,4))>=4&&Number(n.slice(0,4))<=19&&!n.startsWith('0007_'));
  const later=names.filter(n=>Number(n.slice(0,4))>=20);
  if(!later.length)throw new Error('No followup migrations');
  const selected=stage==='followups'?later.filter(n=>Number(n.slice(0,4))>after):names.filter(n=>n.startsWith('0007_'));
  const required=stage==='followups'?[...base,...later.filter(n=>Number(n.slice(0,4))<=after)]:[...base,...later];
  if(!selected.length)throw new Error('No unapplied migrations selected');
  const files=new Map(await Promise.all([...required,...selected].map(async name=>{
    const sql=await readFile('supabase/migrations/'+name,'utf8');
    return [name,{name,sql,sha256:createHash('sha256').update(sql).digest('hex')}];
  })));
  const guard=required.map(name=>{const q=files.get(name);return `if not exists(select 1 from science_migration_history where name='${name}' and sha256='${q.sha256}') then raise exception 'prerequisite_hash_mismatch: ${name}'; end if;`;}).join('\n');
  const repeat=selected.map(name=>`if exists(select 1 from science_migration_history where name='${name}') then raise exception 'migration_already_recorded: ${name}'; end if;`).join('\n');
  const body=selected.map(name=>{const q=files.get(name);return `-- ${name}\n${q.sql.replace(/^begin;\s*\n/gm,'').replace(/^commit;\s*$/gm,'')}\ninsert into science_migration_history(name,sha256) values('${name}','${q.sha256}');`;}).join('\n\n');
  const sql=`begin;\nset local statement_timeout='60s';\nselect pg_advisory_xact_lock(hashtextextended('science-overhaul-install',0));\ndo $migration_guard$ begin\n${guard}\n${repeat}\nend $migration_guard$;\n${body}\ncommit;\nselect name,sha256,applied_at from science_migration_history order by name;\n`;
  const through=later.at(-1).slice(0,4),name=stage==='followups'?`followup-schema-${selected[0].slice(0,4)}-${through}.sql`:`security-cutover-after-${through}.sql`;
  return {stage,name,sql,sha256:createHash('sha256').update(sql).digest('hex'),migrations:selected.map(n=>({name:n,sha256:files.get(n).sha256})),prerequisites:required.map(n=>({name:n,sha256:files.get(n).sha256}))};
}
