import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareBank} from './science-bank.mjs';
import {subdomainsByDomain} from '../../src/lib/data/taxonomy.ts';
const ids=[1,2,3].map(n=>`80000000-0000-4000-8000-${String(n).padStart(12,'0')}`);
const legacy=[{id:ids[0],question_text:'Original?'},{id:ids[1],question_text:'Original？'},{id:ids[2],question_text:'Another wording'}];
const patch={legacyId:ids[0],equivalentLegacyIds:[ids[2]],domain:'数学',subdomain:'数と代数',reason:'Checked all four choices against the definition',parameters:{b:0,basis:'Fixture author judgement, not calibrated'},content:{question:'Which is the number one?',choices:['1','2','3','4'],correctIndex:0,explanation:'The numeral 1 denotes one.',distractorRationales:['correct','two','three','four'],sources:[{title:'Fixture source',url:'https://example.invalid/reference'}]},review:{status:'content_checked',reviewer:'Fixture',observedAt:'2026-09-14',sourceLocation:'Fixture chapter and definition',sourceChecked:true,uniqueAnswerChecked:true,distractorRationalesChecked:true,rightsBasis:'Original fixture for the test suite',releaseApproval:'approved'}};
test('combines exact-stem and explicit aliases without counting repeats as fresh supply',()=>{
  const result=prepareBank(legacy,[patch]);assert.equal(result.candidates.length,1);assert.deepEqual(result.candidates[0].legacy_ids,ids);assert.equal(result.report.readyForInitialRelease,false);
  assert.throws(()=>prepareBank(legacy,[patch,{...patch,legacyId:ids[2],equivalentLegacyIds:[],content:{...patch.content,question:'Another question about one?'}}]),/multiple families/);
  assert.throws(()=>prepareBank(legacy,[patch,{...patch,legacyId:ids[2],equivalentLegacyIds:[]}]),/Duplicate proposed question stem/);
});
test('never promotes pending, invalid, or unsupported attestations',()=>{
  assert.equal(prepareBank(legacy,[{...patch,review:{...patch.review,releaseApproval:'pending'}}]).candidates.length,0);
  assert.throws(()=>prepareBank(legacy,[{...patch,review:{...patch.review,rightsBasis:undefined}}]),/Rights evidence/);
  assert.throws(()=>prepareBank(legacy,[{...patch,parameters:undefined}]),/difficulty/);
  assert.throws(()=>prepareBank(legacy,[{...patch,content:{...patch.content,choices:['1','１','3','4']}}]));
  assert.throws(()=>prepareBank(legacy,[{...patch,subdomain:'力学'}]));
});
test('keeps question identity stable across parameter changes while hashing changed content',()=>{
  const a=prepareBank(legacy,[patch]).candidates[0],b=prepareBank(legacy,[{...patch,parameters:{...patch.parameters,b:1}}]).candidates[0];
  assert.equal(a.id,b.id);assert.equal(a.review_evidence.contentSha256,b.review_evidence.contentSha256);
  const c=prepareBank(legacy,[{...patch,content:{...patch.content,question:'Which numeral means one?'}}]).candidates[0];
  assert.equal(a.id,c.id);assert.notEqual(a.review_evidence.contentSha256,c.review_evidence.contentSha256);
});
test('includes archived and previous wording when rebuilding exposure families',()=>{
  const archived={id:'80000000-0000-4000-8000-000000000004',question_text:'Before the rewrite'};
  const history=[{...legacy[0],previous_question_texts:['Before the rewrite']},...legacy.slice(1),archived];
  assert.deepEqual(prepareBank(history,[patch]).candidates[0].legacy_ids,[...ids,archived.id]);
});
test('starts a reproducible campaign across small fields and difficulty while preserving the source',()=>{
  const questions=subdomainsByDomain.数学.flatMap((subdomain,i)=>[-2,-1,0,1,2].map((b,j)=>({...patch,legacyId:undefined,equivalentLegacyIds:[],familyKey:`fixture:${i}:${j}`,subdomain,parameters:{b,basis:'Initial test judgement, never calibrated'},content:{...patch.content,question:`Fixture ${i}, ${j}?`}})));
  const before=JSON.stringify(questions),a=prepareBank([],questions),b=prepareBank([],questions.toReversed());
  const focused=a.candidates.filter(q=>q.parameters.focus);
  assert.equal(focused.length,20);assert.equal(new Set(focused.map(q=>q.subdomain)).size,10);
  assert.equal(Math.min(...focused.map(q=>q.parameters.b)),-2);assert.equal(Math.max(...focused.map(q=>q.parameters.b)),2);
  assert.equal(a.contentDigest,b.contentDigest);assert.equal(JSON.stringify(questions),before);
  assert.ok(focused.every(q=>!q.parameters.anchor&&q.parameter_evidence.calibrated===false));
});
test('keeps explicit focus choices and excludes anchors and weekly reserves from the campaign',()=>{
  const make=(n,parameters={},use='formal')=>({...patch,legacyId:undefined,equivalentLegacyIds:[],familyKey:`fixture:${n}`,parameters:{...patch.parameters,...parameters},use,content:{...patch.content,question:`Fixture question ${n}?`}});
  const result=prepareBank([],[make(1,{focus:true}),make(2,{anchor:true}),make(3,{},'weekly-reserve'),make(4)]);
  assert.deepEqual(result.candidates.filter(q=>q.parameters.focus).map(q=>q.family_id),['operator:fixture:1','operator:fixture:4']);
  assert.equal(result.candidates[0].parameter_evidence.focusCampaign.selection,'reviewer');
  assert.throws(()=>prepareBank([],[make(1,{focus:true,anchor:true})]),/non-anchor formal/);
  assert.throws(()=>prepareBank([],[make(1,{focus:true},'weekly-reserve')]),/non-anchor formal/);
});
