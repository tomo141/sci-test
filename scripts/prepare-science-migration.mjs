// Prepare reviewable SQL; this script never connects to a database.
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output='implementation/local/deployment';
const files=(await readdir('supabase/migrations')).filter(n=>/^\d{4}_/.test(n)).sort();
// The reviewed manual-install artifact is frozen at 0019. Later migrations are separate upgrades.
const selected=files.filter(n=>Number(n.slice(0,4))>=4&&Number(n.slice(0,4))<=19&&!n.startsWith('0007_'));
const parts=[],manifest={preparedAt:new Date().toISOString(),stage:'additive schema only; security cutover deferred',migrations:[]};
for(const name of selected){
  const sql=await readFile(`supabase/migrations/${name}`,'utf8');
  const hash=createHash('sha256').update(sql).digest('hex');
  manifest.migrations.push({name,sha256:hash});
  parts.push(`-- ${name}\n`+sql.replace(/^begin;\s*\n/gm,'').replace(/^commit;\s*$/gm,''));
  parts.push(`insert into science_migration_history(name,sha256) values('${name}','${hash}');`);
}
const preamble=`begin;
set local statement_timeout='60s';
select pg_advisory_xact_lock(hashtextextended('science-overhaul-install',0));
do $$ begin
  if to_regclass('public.science_items') is not null then raise exception 'science_schema_already_exists'; end if;
end $$;
create table science_migration_history(name text primary key,sha256 text not null,applied_at timestamptz not null default now());
alter table science_migration_history enable row level security;
revoke all on science_migration_history from public,anon,authenticated;
grant all on science_migration_history to service_role;
`;
const sql=preamble+parts.join('\n\n')+`\ncommit;\nselect name,sha256,applied_at from science_migration_history order by name;\n`;
manifest.sqlSha256=createHash('sha256').update(sql).digest('hex');
await mkdir(output,{recursive:true,mode:0o700});
try{await writeFile(`${output}/additive-schema.sql`,sql,{mode:0o600,flag:'wx'});}
catch(error){if(error.code!=='EEXIST'||await readFile(`${output}/additive-schema.sql`,'utf8')!==sql)throw error;}
await writeFile(`${output}/additive-schema-manifest.json`,JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
console.log(JSON.stringify({path:`${output}/additive-schema.sql`,migrations:manifest.migrations.length,bytes:Buffer.byteLength(sql),sha256:manifest.sqlSha256}));
