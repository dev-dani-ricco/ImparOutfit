import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_TASKS,assertTask} from '../src/ai/tasks.js';
import {normalizeIdempotencyKey} from '../src/execution/primitives.js';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {migrate} from '../src/db/migrate.js';
import {pool} from '../src/config/db.js';
import {executeAi} from '../src/ai/gateway.js';
import {resolvePublishedPolicy,loadHistoricalPolicy} from '../src/ai/policyService.js';

let db,policy,v1;
test.before(async()=>{db=new PGlite({extensions:{pgcrypto}});await migrate(db);pool.query=db.query.bind(db);pool.connect=async()=>({query:db.query.bind(db),release(){}});policy=(await db.query("INSERT INTO ai_policies(task) VALUES('IMPAR_ANALYSIS') RETURNING id")).rows[0];v1=(await db.query("INSERT INTO ai_policy_versions(ai_policy_id,version,status,provider_identifier,model_identifier,timeout_ms) VALUES($1,1,'PUBLISHED','synthetic-provider','synthetic-model',10) RETURNING *",[policy.id])).rows[0];});
test.after(async()=>db.close());

test('AI Gateway task boundary recognizes only the institutional Analysis task',()=>{
 assert.equal(assertTask(AI_TASKS.IMPAR_ANALYSIS),'IMPAR_ANALYSIS');
 assert.throws(()=>assertTask('DANI_GUIDANCE'),/TASK_NOT_AVAILABLE/);
 assert.equal(normalizeIdempotencyKey('synthetic-ai-policy'),'synthetic-ai-policy');
});

test('AI Gateway executes only exact governed policies and records sanitized provenance',async()=>{
 const request={task:'IMPAR_ANALYSIS',ownerPersonId:null,requesterPrincipalId:null,consumer:{type:'TEST',id:'00000000-0000-0000-0000-000000000001'}};
 const result=await executeAi(request,{db,adapter:{execute:async(_request,policy)=>({output:{validated:true,provider:policy.provider_identifier},usage:{inputTokens:1,outputTokens:2,totalTokens:3}})}});
 assert.deepEqual(result.output,{validated:true,provider:'synthetic-provider'});assert.equal(result.modelIdentifier,'synthetic-model');
 const row=(await db.query('SELECT task,provider_identifier,model_identifier,status,input_tokens,total_tokens,failure_code FROM ai_executions')).rows[0];assert.deepEqual(row,{task:'IMPAR_ANALYSIS',provider_identifier:'synthetic-provider',model_identifier:'synthetic-model',status:'SUCCEEDED',input_tokens:1,total_tokens:3,failure_code:null});
 await assert.rejects(()=>executeAi({...request,consumer:{type:'TEST',id:'00000000-0000-0000-0000-000000000002'}},{db}),e=>e.code==='PROVIDER_UNAVAILABLE');
 await assert.rejects(()=>executeAi({...request,consumer:{type:'TEST',id:'00000000-0000-0000-0000-000000000003'}},{db,adapter:{execute:async()=>({raw:true})}}),e=>e.code==='INVALID_PROVIDER_RESPONSE');
 await assert.rejects(()=>executeAi({...request,consumer:{type:'TEST',id:'00000000-0000-0000-0000-000000000004'}},{db,adapter:{execute:async()=>new Promise(resolve=>setTimeout(()=>resolve({output:{late:true}}),30))}}),e=>e.code==='PROVIDER_TIMEOUT');
 await db.query("UPDATE ai_policy_versions SET status='RETIRED' WHERE id=$1",[v1.id]);
 await assert.rejects(()=>resolvePublishedPolicy('IMPAR_ANALYSIS',db),e=>e.code==='POLICY_NOT_AVAILABLE');
 assert.equal((await loadHistoricalPolicy(v1.id,'IMPAR_ANALYSIS',db)).id,v1.id);
});
