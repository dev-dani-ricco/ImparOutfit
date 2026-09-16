import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeIdempotencyKey,retryWithinBudget,sha256Json,withTransaction} from '../src/execution/primitives.js';

test('shared execution primitives preserve transaction, fingerprint, key and retry contracts',async()=>{
 const calls=[];const pool={connect:async()=>({query:async sql=>{calls.push(sql);if(sql==='WORK')return 'ok';},release:()=>calls.push('RELEASE')})};
 assert.equal(await withTransaction(pool,async client=>client.query('WORK')),'ok');
 assert.deepEqual(calls,['BEGIN','WORK','COMMIT','RELEASE']);
 const rollback=[];const failedPool={connect:async()=>({query:async sql=>rollback.push(sql),release:()=>rollback.push('RELEASE')})};
 await assert.rejects(()=>withTransaction(failedPool,async()=>{throw new Error('synthetic');}),/synthetic/);
 assert.deepEqual(rollback,['BEGIN','ROLLBACK','RELEASE']);
 assert.equal(sha256Json({domain:'x',value:1}),sha256Json({domain:'x',value:1}));
 assert.notEqual(sha256Json({domain:'x',value:1}),sha256Json({domain:'x',value:2}));
 assert.equal(normalizeIdempotencyKey('safe-key'), 'safe-key');
 assert.equal(normalizeIdempotencyKey(undefined),null);
 assert.throws(()=>normalizeIdempotencyKey('bad key'),/Idempotency-Key/);
 assert.equal(retryWithinBudget(2,2),true);assert.equal(retryWithinBudget(3,2),false);
});
