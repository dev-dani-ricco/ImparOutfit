import {pool} from '../config/db.js';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,validateAnalysisResultPayload} from '../services/imparAnalysisResultPayload.js';
import {resolveAuthorizedKnowledgeContent} from '../services/authorizedKnowledgeContentResolver.js';
import {resolvePromptContent} from '../services/promptContentResolver.js';
import {claimJob,markFailure,transaction} from './jobService.js';
import {executeAi} from '../ai/gateway.js';
import {omniRouteAdapter} from '../ai/omniRouteAdapter.js';
import {retrieveAuthorizedKnowledge} from '../ai/governedKnowledgeRetrieval.js';
import {loadAnalysisInputSnapshot} from './inputSnapshot.js';

export async function runOnce({resolveKnowledge=resolveAuthorizedKnowledgeContent,resolvePrompt=resolvePromptContent,adapter=omniRouteAdapter}={}){
 const job=await transaction(claimJob);if(!job)return null;
 try{
  const knowledge=(await pool.query('SELECT authorized_knowledge_version_id FROM impar_analysis_job_knowledge WHERE job_id=$1 ORDER BY authorized_knowledge_version_id',[job.id])).rows.map(row=>row.authorized_knowledge_version_id);
  const retrieval=await retrieveAuthorizedKnowledge(knowledge,resolveKnowledge);
  const analysisSnapshot=await loadAnalysisInputSnapshot(job,{query:pool.query.bind(pool)});
  if(!job.ai_policy_version_id||!job.prompt_version_id)throw Object.assign(new Error('PROMPT_NOT_AVAILABLE'),{code:'PROMPT_NOT_AVAILABLE'});
  const execution=await executeAi({task:'IMPAR_ANALYSIS',aiPolicyVersionId:job.ai_policy_version_id,promptVersionId:job.prompt_version_id,retrieval,requesterPrincipalId:job.requested_by_principal_id,ownerPersonId:job.owner_person_id,consumer:{type:'IMPAR_ANALYSIS_JOB',id:job.id},input:{analysisId:job.analysis_id,lookVersionId:job.look_version_id,contextId:job.context_id,methodologyVersionId:job.methodology_version_id,authorizedKnowledgeVersionIds:knowledge,knowledgeContext:retrieval.context,analysisSnapshot}},{adapter,resolvePrompt});
  const payload=validateAnalysisResultPayload(CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,execution.output);
  await transaction(async db=>{
   const current=(await db.query('SELECT * FROM impar_analysis_jobs WHERE id=$1 FOR UPDATE',[job.id])).rows[0];
   if(current.state!=='PROCESSING'||current.result_id)throw new Error('STALE_JOB');
   const analysis=(await db.query("SELECT status,final_result_id FROM impar_analyses WHERE id=$1 AND owner_person_id=$2 FOR UPDATE",[current.analysis_id,current.owner_person_id])).rows[0];
   if(!analysis||analysis.status!=='DRAFT'||analysis.final_result_id)throw new Error('STALE_ANALYSIS');
   const next=(await db.query('SELECT COALESCE(max(result_version),0)+1 AS next FROM impar_analysis_results WHERE analysis_id=$1',[current.analysis_id])).rows[0].next;
   const result=(await db.query("INSERT INTO impar_analysis_results(analysis_id,owner_person_id,result_version,result_schema_version,status,payload) VALUES($1,$2,$3,$4,'DRAFT',$5) RETURNING id",[current.analysis_id,current.owner_person_id,next,CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,payload])).rows[0];
   await db.query("UPDATE impar_analysis_attempts SET state='SUCCEEDED',completed_at=now() WHERE job_id=$1 AND sequence=$2",[current.id,current.attempt]);
   await db.query("UPDATE impar_analysis_jobs SET state='SUCCEEDED',result_id=$2,completed_at=now(),lease_until=NULL WHERE id=$1 AND state='PROCESSING'",[current.id,result.id]);
  });
  return {id:job.id,state:'SUCCEEDED'};
 }catch(error){const code=['PROVIDER_UNAVAILABLE','PROVIDER_TIMEOUT','INVALID_PROVIDER_RESPONSE','POLICY_NOT_AVAILABLE','PROMPT_NOT_AVAILABLE','INVALID_PROMPT_CONTENT','KNOWLEDGE_NOT_AVAILABLE','INVALID_KNOWLEDGE_CONTENT','ANALYSIS_INPUT_NOT_AVAILABLE'].includes(error.code)?error.code:(error.status===503?'SERVICE_UNAVAILABLE':'PROCESSING_FAILED');await transaction(db=>markFailure(db,job,code));return {id:job.id,state:'FAILED',code};}
}
export const runProductionOnce=()=>runOnce({adapter:omniRouteAdapter});
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(await runProductionOnce()||{state:'IDLE'}));}finally{await pool.end();}}
