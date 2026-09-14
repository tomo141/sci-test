import test from 'node:test';
import assert from 'node:assert/strict';
import {migrationChecks,countCheck} from './science-deployment-report.mjs';
const expected=[{name:'migration.sql',sha256:'expected'}];

test('an unreadable ledger never says a migration is absent or reveals error details',()=>{
  for(const ledger of [{data:null,error:{code:'',message:'private request details'}},{data:null,error:null},{data:{},error:null},{data:[null],error:null}]){
    const result=migrationChecks(expected,ledger);
    assert.equal(result.schemaReady,false);
    assert.equal(result.migrations[0].state,'unavailable');
    assert.ok(result.ledgerError);
    assert.ok(!JSON.stringify(result).includes('private request details'));
  }
});
test('successful ledger reads distinguish absence, a wrong hash, and the exact applied migration',()=>{
  assert.equal(migrationChecks(expected,{data:[],error:null}).migrations[0].state,'not_recorded');
  assert.equal(migrationChecks(expected,{data:[{...expected[0],sha256:'wrong'}],error:null}).migrations[0].state,'hash_mismatch');
  assert.equal(migrationChecks(expected,{data:expected,error:null}).schemaReady,true);
});
test('counts distinguish verified zero from missing counts and query failures',()=>{
  assert.deepEqual(countCheck('items',{count:0,error:null}),{table:'items',state:'retrieved',count:0,errorCode:null});
  assert.equal(countCheck('items',{error:null}).state,'count_unknown');
  assert.equal(countCheck('items',{count:null,error:null}).count,null);
  assert.deepEqual(countCheck('items',{count:0,error:{code:'PGRST205'}}),{table:'items',state:'unavailable',count:null,errorCode:'PGRST205'});
  assert.equal(countCheck('items',{count:null,error:{code:''}}).errorCode,'transport_or_unknown_error');
});
