// Rehearse the exact activation SQL with reviewed content and synthetic accounts, without networking.
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const db=new PGlite(),hash=x=>createHash('sha256').update(x).digest('hex');
try{
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
 for(const name of (await readdir('supabase/migrations')).filter(n=>/^\d{4}_.*\.sql$/.test(n)).sort())await db.exec((await readFile('supabase/migrations/'+name,'utf8')).replace('create extension if not exists pgcrypto;',''));
 await db.exec("create table science_migration_history(name text primary key,sha256 text,applied_at timestamptz default now())");
 await db.query("insert into science_migration_history(name,sha256) values('0032_science_measurement_version.sql',$1)",[hash(await readFile('supabase/migrations/0032_science_measurement_version.sql'))]);
 await db.exec("insert into auth.users(id,email,email_confirmed_at) values('18000000-0000-4000-8000-000000000070','tomoyoshi@rikei-talk.com',now());insert into science_admins(user_id,reason) values('18000000-0000-4000-8000-000000000070','Synthetic local operator for release rehearsal')");
 const bank=JSON.parse(await readFile('implementation/local/question-bank/candidate.json','utf8')).candidates.filter(q=>q.use==='formal');
 for(const q of bank)await db.query("insert into science_items(id,family_id,version,domain,subdomain,content,status,quality_passed,rights_checked) values($1,$2,$3,$4,$5,$6,'published',true,true)",[q.id,q.family_id,q.version,q.domain,q.subdomain,q.content]);
 const source='c3370bed-460e-4e40-af4f-7a7e13565c77';
 await db.query("insert into science_releases(id,name,model_version) values($1,'Reviewed bank rehearsal','science-3pl-reference-v1')",[source]);
 for(const q of bank)await db.query('insert into science_release_items(release_id,revision_id,a,b,c,anchor,focus,parameter_evidence) values($1,$2,$3,$4,$5,$6,$7,$8)',[source,q.id,q.parameters.a,q.parameters.b,q.parameters.c,q.parameters.anchor,q.parameters.focus,q.parameter_evidence]);
 await db.query("update science_releases set state='active' where id=$1",[source]);
 const sql=await readFile('implementation/operations/activate-p70-score.sql','utf8');await db.exec(sql);
 const releases=(await db.query('select model_version,state,(select count(*) from science_release_items where release_id=r.id)::int as count from science_releases r order by created_at')).rows;
 if(releases.length!==2||releases[0].state!=='retired'||releases[1].state!=='active'||releases.some(r=>r.count!==1000))throw new Error('release_readback_failed');
 let repeatedRejected=false;try{await db.exec(sql);}catch(e){await db.exec('rollback');if(!String(e).includes('unexpected_active_release'))throw e;repeatedRejected=true;}
 if(!repeatedRejected)throw new Error('repeated_activation_accepted');
 const report={checkedAt:new Date().toISOString(),state:'passed',sqlSha256:hash(sql),syntheticAccounts:true,reviewedFormalItems:bank.length,releases,repeatedRejected,networkUsed:false};
 await writeFile('implementation/checks/p70-release-rehearsal.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await db.close();}
