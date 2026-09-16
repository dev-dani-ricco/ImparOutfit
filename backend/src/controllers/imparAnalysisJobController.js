import {authorizeInstitutionalCapability,authorizePersonal} from '../services/authorizationService.js';
import {HttpError} from '../utils/http.js';
import {jobDto,transaction,authorizedJob,retryAvailable} from '../imparAnalysis/jobService.js';
import {normalizeIdempotencyKey,sha256Json} from '../execution/primitives.js';
import {resolvePublishedPolicy} from '../ai/policyService.js';

const fingerprint=sha256Json;
const keyFor=(req,fingerprintValue)=>normalizeIdempotencyKey(req.get('Idempotency-Key')??`analysis:${fingerprintValue}`);

export async function enqueue(req,res){
 const result=await transaction(async c=>{
  const analysis=(await c.query('SELECT * FROM impar_analyses WHERE id=$1 FOR UPDATE',[req.params.analysisId])).rows[0];
  authorizePersonal(req.auth,{...analysis,person_id:analysis.owner_person_id});await authorizeInstitutionalCapability(req.auth,'impar.analysis.execute',c);
  if(analysis.status!=='DRAFT')throw new HttpError(409,'Analysis não aceita execução neste estado');
  if(!analysis.methodology_version_id)throw new HttpError(409,'Analysis não possui MethodologyVersion atribuída');
  const methodology=(await c.query("SELECT id FROM methodology_versions WHERE id=$1 AND status='PUBLISHED'",[analysis.methodology_version_id])).rows[0];
  if(!methodology)throw new HttpError(409,'MethodologyVersion não está apta à execução');
  const all=(await c.query('SELECT count(*)::int count FROM methodology_version_knowledge WHERE methodology_version_id=$1',[methodology.id])).rows[0].count;
  const knowledge=(await c.query("SELECT k.id FROM methodology_version_knowledge b JOIN authorized_knowledge_versions k ON k.id=b.authorized_knowledge_version_id WHERE b.methodology_version_id=$1 AND k.status='PUBLISHED' ORDER BY k.id",[methodology.id])).rows;
  if(!all||knowledge.length!==all)throw new HttpError(409,'MethodologyVersion não possui Knowledge autorizado apto');
  const policy=await resolvePublishedPolicy('IMPAR_ANALYSIS',c);
  const envelope={analysisId:analysis.id,lookVersionId:analysis.look_version_id,contextId:analysis.context_id,methodologyVersionId:methodology.id,authorizedKnowledgeVersionIds:knowledge.map(row=>row.id),aiPolicyVersionId:policy.id};
  const hash=fingerprint(envelope),key=keyFor(req,hash);
  // Serializes equal domain operations on both PostgreSQL and the PGlite test
  // harness; the database unique constraint remains the final invariant.
  await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${analysis.owner_person_id}:${key}`]);
  const existing=(await c.query('SELECT * FROM impar_analysis_jobs WHERE owner_person_id=$1 AND idempotency_key=$2 FOR UPDATE',[analysis.owner_person_id,key])).rows[0];
  if(existing){if(existing.envelope_fingerprint!==hash)throw new HttpError(409,'Idempotency-Key já foi usada com outro envelope',{code:'VERSION_CONFLICT'});return {job:existing,replayed:true};}
  const job=(await c.query(`INSERT INTO impar_analysis_jobs(analysis_id,owner_person_id,requested_by_principal_id,look_version_id,context_id,methodology_version_id,ai_policy_version_id,idempotency_key,envelope_fingerprint)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[analysis.id,analysis.owner_person_id,req.auth.principalId,analysis.look_version_id,analysis.context_id,methodology.id,policy.id,key,hash])).rows[0];
  for(const row of knowledge)await c.query('INSERT INTO impar_analysis_job_knowledge(job_id,authorized_knowledge_version_id) VALUES($1,$2)',[job.id,row.id]);
  return {job,replayed:false};
 });
 res.status(result.replayed?200:201).json(jobDto(result.job));
}
export async function get(req,res){res.json(jobDto(await authorizedJob(req.auth,req.params.analysisId,req.params.jobId)));}
export async function retry(req,res){const job=await transaction(async c=>{const current=await authorizedJob(req.auth,req.params.analysisId,req.params.jobId,c,true);await authorizeInstitutionalCapability(req.auth,'impar.analysis.execute',c);if(current.state!=='FAILED'||!retryAvailable(current))throw new HttpError(409,'Job não pode ser reenfileirado');const queued=(await c.query("UPDATE impar_analysis_jobs SET state='QUEUED',error_code=NULL,completed_at=NULL WHERE id=$1 AND state='FAILED' RETURNING *",[current.id])).rows[0];if(!queued)throw new HttpError(409,'Job não pode ser reenfileirado');return queued;});res.status(202).json(jobDto(job));}
export async function cancel(req,res){const job=await transaction(async c=>{const current=await authorizedJob(req.auth,req.params.analysisId,req.params.jobId,c,true);await authorizeInstitutionalCapability(req.auth,'impar.analysis.execute',c);if(current.state==='CANCELLED')return current;if(current.state!=='QUEUED')throw new HttpError(409,'Job não pode ser cancelado neste estado');const cancelled=(await c.query("UPDATE impar_analysis_jobs SET state='CANCELLED',completed_at=now() WHERE id=$1 AND state='QUEUED' RETURNING *",[current.id])).rows[0];if(!cancelled)throw new HttpError(409,'Job não pode ser cancelado neste estado');return cancelled;});res.json(jobDto(job));}
