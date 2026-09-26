import {query} from '../config/db.js';
import {assertTask} from './tasks.js';
import {resolvePublishedPolicy,loadHistoricalPolicy} from './policyService.js';
import {resolvePublishedPrompt,loadHistoricalPrompt} from './promptService.js';
import {resolvePromptContent} from '../services/promptContentResolver.js';

const fail=code=>Object.assign(new Error(code),{code});
export const unavailableAdapter={execute:async()=>{throw fail('PROVIDER_UNAVAILABLE');}};

async function withTimeout(promise,timeoutMs){
  let timer;
  try{
    return await Promise.race([
      promise,
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(fail('PROVIDER_TIMEOUT')),timeoutMs);})
    ]);
  }finally{
    if(timer)clearTimeout(timer);
  }
}

export async function executeAi(request,{adapter=unavailableAdapter,resolvePrompt=resolvePromptContent,db={query}}={}){
  const task=assertTask(request.task);
  const policy=request.aiPolicyVersionId?await loadHistoricalPolicy(request.aiPolicyVersionId,task,db):await resolvePublishedPolicy(task,db);
  const prompt=request.promptVersionId?(await loadHistoricalPrompt(request.promptVersionId,task,db)):null;
  const started=Date.now();let status='FAILED',failure=null,result;
  try{
    const instruction=prompt?await resolvePrompt(prompt):null;
    if(prompt&&(typeof instruction!=='string'||!instruction.trim()))throw fail('INVALID_PROMPT_CONTENT');
    const output=await withTimeout(
      adapter.execute({task,aiPolicyVersionId:policy.id,promptVersionId:prompt?.id??null,instruction,requesterPrincipalId:request.requesterPrincipalId??null,ownerPersonId:request.ownerPersonId??null,consumer:request.consumer,input:request.input??{}},policy),
      policy.timeout_ms
    );
    if(!output||typeof output.output!=='object')throw fail('INVALID_PROVIDER_RESPONSE');
    result={task,aiPolicyVersionId:policy.id,promptVersionId:prompt?.id??null,providerIdentifier:policy.provider_identifier,modelIdentifier:policy.model_identifier,output:output.output,usage:output.usage??null,latencyMs:Date.now()-started};
    status='SUCCEEDED';
  }catch(e){
    failure=['PROVIDER_UNAVAILABLE','PROVIDER_TIMEOUT','INVALID_PROVIDER_RESPONSE','PROMPT_NOT_AVAILABLE','INVALID_PROMPT_CONTENT'].includes(e.code)?e.code:'PROVIDER_UNAVAILABLE';
  }
  await db.query(`INSERT INTO ai_executions(task,ai_policy_version_id,prompt_version_id,requester_principal_id,owner_person_id,consumer_type,consumer_id,provider_identifier,model_identifier,status,input_tokens,output_tokens,total_tokens,latency_ms,correlation_id,failure_code,retrieval_strategy,retrieval_version,authorized_knowledge_version_ids,selected_knowledge_units,retrieval_unit_count) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,[task,policy.id,prompt?.id??null,request.requesterPrincipalId??null,request.ownerPersonId??null,request.consumer.type,request.consumer.id,policy.provider_identifier,policy.model_identifier,status,result?.usage?.inputTokens??null,result?.usage?.outputTokens??null,result?.usage?.totalTokens??null,Date.now()-started,request.correlationId??null,failure,request.retrieval?.strategy??null,request.retrieval?.version??null,request.retrieval?.authorizedKnowledgeVersionIds??null,request.retrieval?.units?.map(unit=>({id:unit.id,authorizedKnowledgeVersionId:unit.authorizedKnowledgeVersionId,hash:unit.hash}))??null,request.retrieval?.units?.length??null]);
  if(failure)throw fail(failure);
  return result;
}
