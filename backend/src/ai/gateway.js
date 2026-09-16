import {query} from '../config/db.js';
import {assertTask} from './tasks.js';
import {resolvePublishedPolicy,loadHistoricalPolicy} from './policyService.js';
const fail=code=>Object.assign(new Error(code),{code});
export const unavailableAdapter={execute:async()=>{throw fail('PROVIDER_UNAVAILABLE');}};
export async function executeAi(request,{adapter=unavailableAdapter,db={query}}={}){
 const task=assertTask(request.task);const policy=request.aiPolicyVersionId?await loadHistoricalPolicy(request.aiPolicyVersionId,task,db):await resolvePublishedPolicy(task,db);
 const started=Date.now();let status='FAILED',failure=null,result;
 try{const output=await Promise.race([adapter.execute({task,aiPolicyVersionId:policy.id,requesterPrincipalId:request.requesterPrincipalId??null,ownerPersonId:request.ownerPersonId??null,consumer:request.consumer,input:request.input??{}},policy),new Promise((_,reject)=>setTimeout(()=>reject(fail('PROVIDER_TIMEOUT')),policy.timeout_ms))]);if(!output||typeof output.output!=='object')throw fail('INVALID_PROVIDER_RESPONSE');result={task,aiPolicyVersionId:policy.id,providerIdentifier:policy.provider_identifier,modelIdentifier:policy.model_identifier,output:output.output,usage:output.usage??null,latencyMs:Date.now()-started};status='SUCCEEDED';}catch(e){failure=['PROVIDER_UNAVAILABLE','PROVIDER_TIMEOUT','INVALID_PROVIDER_RESPONSE'].includes(e.code)?e.code:'PROVIDER_UNAVAILABLE';}
 await db.query(`INSERT INTO ai_executions(task,ai_policy_version_id,requester_principal_id,owner_person_id,consumer_type,consumer_id,provider_identifier,model_identifier,status,input_tokens,output_tokens,total_tokens,latency_ms,correlation_id,failure_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[task,policy.id,request.requesterPrincipalId??null,request.ownerPersonId??null,request.consumer.type,request.consumer.id,policy.provider_identifier,policy.model_identifier,status,result?.usage?.inputTokens??null,result?.usage?.outputTokens??null,result?.usage?.totalTokens??null,Date.now()-started,request.correlationId??null,failure]);
 if(failure)throw fail(failure);return result;
}
