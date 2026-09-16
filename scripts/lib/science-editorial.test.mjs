import {test} from 'node:test';
import assert from 'node:assert/strict';
import {editorialRegressions,editorialDigest} from './science-editorial.mjs';
test('new or edited giveaway distractors cannot reuse the existing-debt allowance',()=>{
 const row={familyKey:'fixture',content:{question:'反応は？',choices:['反転する','必ず保持','全く反応しない','必ず平面になる'],correctIndex:0}};
 assert.equal(editorialRegressions([row]).length,1);
 const known=[{key:'fixture',digest:editorialDigest(row.content)}];
 assert.equal(editorialRegressions([row],known).length,0);
 assert.equal(editorialRegressions([{...row,content:{...row.content,question:'別の問いは？'}}],known).length,1);
 assert.equal(editorialRegressions([{...row,content:{...row.content,choices:['反転','保持','平面化','ラセミ化']}}],known).length,0);
});
