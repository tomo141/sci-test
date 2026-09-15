// This module receives an isolated PGlite database. It never creates a network client.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {digest} from './science-bank.mjs';
import {MODEL_VERSION} from '../../src/lib/science/versions.ts';

export async function rehearseScienceBank(db,filename){
  const bundle=JSON.parse(await readFile(filename,'utf8'));
  assert.equal(bundle.format,'science-bank-v2');
  assert.equal(bundle.contentDigest,digest(bundle.candidates),'Candidate digest mismatch');
  assert.equal(bundle.report.readyForInitialRelease,true,'Initial capacity not ready');
  for(const source of [bundle.legacySource,bundle.productionSource,...bundle.reviewFiles].filter(Boolean)){
    assert.equal(createHash('sha256').update(await readFile(source.path)).digest('hex'),source.sha256,'Source changed after preparation');
  }
  for(const q of bundle.candidates){
    assert.equal(q.review_evidence.contentSha256,digest({domain:q.domain,subdomain:q.subdomain,content:q.content}),'Question content changed');
  }
  const actor=(await db.query('select user_id from science_profiles order by user_id limit 1')).rows[0]?.user_id;
  assert.ok(actor,'The isolated restoration must include a migrated profile');
  // Only the disposable local copy receives this grant; no personal identifier is reported.
  await db.query("insert into science_admins(user_id,reason) values($1,'Disposable local bank rehearsal') on conflict do nothing",[actor]);
  const originalIds=new Set((await db.query('select id from questions')).rows.map(q=>q.id));
  const expectedAliases=new Map(bundle.candidates.flatMap(q=>q.legacy_ids.filter(id=>originalIds.has(id)).map(id=>[id,q.family_id])));
  const gate=(await db.query("select value from science_config where key='release'")).rows[0]?.value;
  const release=(await db.query('insert into science_releases(name,model_version,settings) values($1,$2,$3) returning id',[
    'Actual reviewed bank — local rehearsal',MODEL_VERSION,
    {importManifest:bundle.contentDigest,expectedRevisions:bundle.candidates.map(q=>q.id)}
  ])).rows[0].id;
  let missingAliases=0;
  await db.exec('set role service_role');
  try{
    const batch='select science_import_bank_batch($1,$2,$3,$4::jsonb) result';
    for(let offset=0;offset<bundle.candidates.length;offset+=100){
      const rows=bundle.candidates.slice(offset,offset+100);
      const imported=(await db.query(batch,[release,actor,bundle.contentDigest,JSON.stringify(rows)])).rows[0].result;
      assert.equal(imported.rows,rows.length);
      missingAliases+=imported.legacyAliasesNotPresent;
    }
    // Replay a real batch to verify retry safety without changing its content or parameters.
    await db.query(batch,[release,actor,bundle.contentDigest,JSON.stringify(bundle.candidates.slice(0,100))]);
    const saved=(await db.query(`select q.id,q.domain,q.subdomain,q.content,q.status,q.review_evidence,
      x.usage,ri.a,ri.b,ri.c,ri.focus,ri.anchor,ri.parameter_evidence
      from science_bank_import_items x join science_items q on q.id=x.revision_id
      left join science_release_items ri on ri.release_id=x.release_id and ri.revision_id=x.revision_id
      where x.release_id=$1`,[release])).rows;
    assert.equal(saved.length,bundle.candidates.length,'Repeated import duplicated rows');
    const savedById=new Map(saved.map(q=>[q.id,q]));
    for(const q of bundle.candidates){
      const actual=savedById.get(q.id);
      assert.ok(actual,'A reviewed revision was not imported');
      assert.equal(actual.status,'draft','Import published a question prematurely');
      assert.equal(actual.usage,q.use);
      assert.equal(digest({domain:actual.domain,subdomain:actual.subdomain,content:actual.content}),q.review_evidence.contentSha256,'Stored content mismatch');
      assert.equal(digest(actual.review_evidence),digest(q.review_evidence),'Review evidence mismatch');
      if(q.use==='formal'){
        for(const field of ['a','b','c','focus','anchor'])assert.equal(actual[field],q.parameters[field],`Stored parameter mismatch: ${field}`);
        assert.equal(digest(actual.parameter_evidence),digest(q.parameter_evidence));
      }
    }
    const aliases=new Map((await db.query('select question_id,family_id from science_legacy_families')).rows.map(q=>[q.question_id,q.family_id]));
    for(const [id,family] of expectedAliases)assert.equal(aliases.get(id),family,'Legacy exposure alias mismatch');
    const finish='select science_finish_bank_import($1,$2,$3,$4)';
    await db.query(finish,[release,actor,bundle.contentDigest,'Local rehearsal with the actual reviewed bank']);
    assert.deepEqual((await db.query("select id from science_releases where state='active'")).rows.map(q=>q.id),[release]);
    const capacity=(await db.query(`select q.domain,
      count(*) filter(where x.usage='formal')::int formal,
      count(*) filter(where x.usage='weekly-reserve')::int weekly,
      count(*) filter(where ri.focus)::int focus,
      count(distinct q.subdomain) filter(where x.usage='formal')::int subdomains,
      bool_and(q.status='published' and q.quality_passed and q.rights_checked) approved
      from science_bank_import_items x join science_items q on q.id=x.revision_id
      left join science_release_items ri on ri.release_id=x.release_id and ri.revision_id=x.revision_id
      where x.release_id=$1 group by q.domain order by q.domain`,[release])).rows;
    assert.equal(capacity.length,10);
    for(const c of capacity){
      assert.ok(c.formal>=100&&c.weekly>=2&&c.subdomains===10&&c.focus===20&&c.approved,'Published capacity mismatch');
    }
    await assert.rejects(db.query(finish,[release,actor,bundle.contentDigest,'Repeated activation must be refused']),/invalid_import/);
    // Exercise the two reserved weeks with real questions. These dates affect only this local DB.
    const fields=bundle.report.capacities.map(c=>c.domain);
    const weeks=[['2026-09-14','2026-09-14T00:00:00+09:00','2026-09-21T00:00:00+09:00'],['2026-09-21','2026-09-21T00:00:00+09:00','2026-09-28T00:00:00+09:00']];
    const weeklyIds=[];
    for(let n=0;n<weeks.length;n++){
      const ids=fields.map(domain=>bundle.candidates.filter(q=>q.domain===domain&&q.use==='weekly-reserve')[n].id);
      weeklyIds.push(...ids);
      const args=[...weeks[n],ids];
      assert.equal((await db.query('select science_publish_week($1,$2,$3,$4) created',args)).rows[0].created,true);
      assert.equal((await db.query('select science_publish_week($1,$2,$3,$4) created',args)).rows[0].created,false);
    }
    assert.equal(new Set(weeklyIds).size,20,'Weekly sets reused a family');
    assert.equal((await db.query('select count(*)::int n from science_release_items where release_id=$1 and revision_id=any($2::uuid[])',[release,weeklyIds])).rows[0].n,0,'Formal and weekly supply overlap');
    assert.deepEqual((await db.query("select value from science_config where key='release'")).rows[0]?.value,gate,'Bank import changed the new-attempt gate');
    return {state:'passed',contentDigest:bundle.contentDigest,questions:saved.length,storedContentAndEvidence:'matched',storedParameters:'matched',
      capacity,legacyAliases:expectedAliases.size,legacyAliasesNotPresent:missingAliases,batchRetry:'no_duplicates',
      repeatedActivation:'rejected',weeklySets:2,weeklyFamilies:20,newAttemptGate:'unchanged',
      scope:'Isolated PGlite restoration with actual candidate content; not production, Auth, SMTP or browser end-to-end verification'};
  }finally{await db.exec('reset role');}
}
