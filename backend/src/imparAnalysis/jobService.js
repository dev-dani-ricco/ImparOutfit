import {pool,query} from '../config/db.js';
import {HttpError} from '../utils/http.js';
import {authorizePersonal} from '../services/authorizationService.js';

export const DEFAULT_IMPAR_ANALYSIS_MAX_RETRIES=2;
export const analysisMaxRetries=()=>{const value=Number.parseInt(process.env.IMPAR_ANALYSIS_MAX_RETRIES??String(DEFAULT_IMPAR_ANALYSIS_MAX_RETRIES),10);return Number.isSafeInteger(value)&&value>=0?value:DEFAULT_IMPAR_ANALYSIS_MAX_RETRIES;};
export const retryAvailable=job=>job.attempt<=analysisMaxRetries();
export async function transaction(work){const c=await pool.connect();try{await c.query('BEGIN');const out=await work(c);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
export async function authorizedJob(auth,analysisId,jobId,db={query},lock=false){
 const job=(await db.query(`SELECT * FROM impar_analysis_jobs WHERE id=$1 AND analysis_id=$2${lock?' FOR UPDATE':''}`,[jobId,analysisId])).rows[0];
 authorizePersonal(auth,job);return job;
}
export const jobDto=job=>{const {idempotency_key,envelope_fingerprint,lease_until,...safe}=job;return safe;};
export async function claimJob(db){
 while(true){
  const candidate=(await db.query("SELECT * FROM impar_analysis_jobs WHERE state='QUEUED' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1")).rows[0];
  if(!candidate)return null;
  const claimed=(await db.query("UPDATE impar_analysis_jobs SET state='PROCESSING',attempt=attempt+1,started_at=now(),lease_until=now()+interval '6 minutes',completed_at=NULL WHERE id=$1 AND state='QUEUED' RETURNING *",[candidate.id])).rows[0];
  if(!claimed)continue;
  await db.query("INSERT INTO impar_analysis_attempts(job_id,sequence,state) VALUES($1,$2,'PROCESSING')",[claimed.id,claimed.attempt]);
  return claimed;
 }
}
export async function markFailure(db,job,code){
 const failed=(await db.query("UPDATE impar_analysis_jobs SET state='FAILED',error_code=$2,completed_at=now(),lease_until=NULL WHERE id=$1 AND state='PROCESSING' RETURNING *",[job.id,code])).rows[0];
 if(!failed)return null;
 await db.query("UPDATE impar_analysis_attempts SET state='FAILED',error_code=$3,completed_at=now() WHERE job_id=$1 AND sequence=$2",[job.id,job.attempt,code]);
 return failed;
}
export async function recoverExpired(){return transaction(async db=>{
 const jobs=(await db.query("SELECT * FROM impar_analysis_jobs WHERE state='PROCESSING' AND lease_until<now() FOR UPDATE SKIP LOCKED")).rows;let recovered=0;
 for(const candidate of jobs){
  const owned=(await db.query("UPDATE impar_analysis_jobs SET lease_until=NULL WHERE id=$1 AND state='PROCESSING' AND lease_until<now() RETURNING *",[candidate.id])).rows[0];
  if(!owned)continue;
  const failed=await markFailure(db,owned,'WORKER_LEASE_EXPIRED');
  if(failed&&retryAvailable(failed))await db.query("UPDATE impar_analysis_jobs SET state='QUEUED',error_code=NULL,completed_at=NULL WHERE id=$1 AND state='FAILED'",[failed.id]);
  recovered++;
 }
 return recovered;
});}
