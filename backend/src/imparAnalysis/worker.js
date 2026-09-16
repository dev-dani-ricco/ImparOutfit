import {pool} from '../config/db.js';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,validateAnalysisResultPayload} from '../services/imparAnalysisResultPayload.js';
import {resolveAuthorizedKnowledgeContent} from '../services/authorizedKnowledgeContentResolver.js';
import {claimJob,markFailure,transaction} from './jobService.js';

export async function runOnce({resolveKnowledge=resolveAuthorizedKnowledgeContent}={}){
 const job=await transaction(claimJob);if(!job)return null;
 try{
  const knowledge=(await pool.query('SELECT authorized_knowledge_version_id FROM impar_analysis_job_knowledge WHERE job_id=$1 ORDER BY authorized_knowledge_version_id',[job.id])).rows.map(row=>row.authorized_knowledge_version_id);
  for(const id of knowledge)await resolveKnowledge(id);
  const payload=validateAnalysisResultPayload(CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,{executionValidated:true,analysisId:job.analysis_id,lookVersionId:job.look_version_id,contextId:job.context_id,methodologyVersionId:job.methodology_version_id,authorizedKnowledgeVersionIds:knowledge});
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
 }catch(error){const code=error.status===503?'SERVICE_UNAVAILABLE':'PROCESSING_FAILED';await transaction(db=>markFailure(db,job,code));return {id:job.id,state:'FAILED',code};}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{console.log(JSON.stringify(await runOnce()||{state:'IDLE'}));}finally{await pool.end();}}
