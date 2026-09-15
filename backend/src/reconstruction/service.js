import {query,pool} from '../config/db.js';
import {HttpError} from '../utils/http.js';
import {authorizePersonal,authorizeCapability} from '../services/authorizationService.js';
import {canTransition,policy,reconstructionMaxRetries} from './domain.js';
export async function authorizedJob(auth,id,db={query},lock=false){
 const job=(await db.query('SELECT * FROM reconstruction_jobs WHERE id=$1'+(lock?' FOR UPDATE':''),[id])).rows[0];
 authorizePersonal(auth,job);
 if(job.organization_id)await authorizeCapability(auth,job.organization_id,'catalog.write',job.product_id,db);
 return job;
}
export async function transition(db,job,to,{actor=null,code=null,metrics=null,guidance=null}={}){
 if(!canTransition(job.state,to))throw new HttpError(409,'Transição de reconstrução inválida');
 const row=(await db.query(`UPDATE reconstruction_jobs SET state=$3,error_code=$4,
 metrics=COALESCE($5,metrics),guidance=COALESCE($6,guidance),recapture_count=recapture_count+CASE WHEN $3='NEEDS_MORE_INPUT' THEN 1 ELSE 0 END,
 completed_at=CASE WHEN $3 IN ('READY','FAILED','NEEDS_MORE_INPUT') THEN now() ELSE NULL END
 WHERE id=$1 AND state=$2 RETURNING *`,[job.id,job.state,to,code,metrics,guidance?JSON.stringify(guidance):null])).rows[0];
 if(!row)throw new HttpError(409,'Job alterado por outro processo');
 await db.query('INSERT INTO reconstruction_events(job_id,actor_person_id,from_state,to_state,code) VALUES($1,$2,$3,$4,$5)',[job.id,actor,job.state,to,code]);
 return row;
}
export async function transaction(work){
 const c=await pool.connect();
 try{await c.query('BEGIN');const out=await work(c);await c.query('COMMIT');return out;}
 catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
// `attempt` advances atomically on each worker claim and is the single retry-budget source.
export function retryAvailable(job){return job.attempt<=reconstructionMaxRetries();}
export function jobDto(j){
 const {lease_until,requested_by_principal_id,idempotency_key,idempotency_fingerprint,...safe}=j;return safe;
}
export async function claimJob(db){
 // SKIP LOCKED is the PostgreSQL fast path; the conditional update also makes
 // ownership atomic under PGlite's lighter lock emulation.
 const j=(await db.query(`SELECT * FROM reconstruction_jobs WHERE state='QUEUED' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`)).rows[0];
 if(!j)return null;
 const claimed=(await db.query("UPDATE reconstruction_jobs SET state='PROCESSING',attempt=attempt+1,started_at=now(),lease_until=now()+($2::int*interval '1 millisecond'),completed_at=NULL WHERE id=$1 AND state='QUEUED' RETURNING *",[j.id,policy.maxProcessingMs+60000])).rows[0];
 if(!claimed)return null;
 await db.query("INSERT INTO reconstruction_events(job_id,from_state,to_state) VALUES($1,'QUEUED','PROCESSING')",[claimed.id]);
 await db.query("INSERT INTO reconstruction_attempts(job_id,sequence,input_revision,pipeline_version,state) VALUES($1,$2,$3,$4,'PROCESSING') ON CONFLICT(job_id,sequence) DO NOTHING",[claimed.id,claimed.attempt,claimed.input_revision,claimed.pipeline_version]);
 return claimed;
}
