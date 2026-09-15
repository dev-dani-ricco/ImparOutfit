import 'dotenv/config';
import {spawn} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pool} from '../config/db.js';
import {storage} from '../services/imageService.js';
import {transaction,claimJob,transition,retryAvailable} from './service.js';
import {policy} from './domain.js';
import {inspectGlb} from './glb.js';
const repo=fileURLToPath(new URL('../../../',import.meta.url));
const python=process.env.RECONSTRUCTION_PYTHON||join(repo,'private/tools/reconstruction-env/Scripts/python.exe');
const script=join(repo,'tools/reconstruction/reconstruct.py');
const root=resolve(process.env.RECONSTRUCTION_ROOT||join(repo,'private/reconstruction'));
export function executePython(manifestPath){
 return new Promise((resolveRun,reject)=>{
  const child=spawn(python,[script,'--manifest',manifestPath],{shell:false,windowsHide:true,stdio:['ignore','ignore','ignore'],env:{...process.env,OMP_NUM_THREADS:'2',OPENBLAS_NUM_THREADS:'2'}});
  const timeout=setTimeout(()=>{child.kill();reject(new Error('PROCESS_TIMEOUT'));},policy.maxProcessingMs);
  child.once('error',()=>{clearTimeout(timeout);reject(new Error('WORKER_UNAVAILABLE'));});
  child.once('exit',code=>{clearTimeout(timeout);code===0?resolveRun():reject(new Error('WORKER_EXIT'));});
 });
}
export async function runOnce({execute=executePython}={}){
 // Queue claim committed before CPU processing. lease permits explicit recovery after crashes.
 const job=await transaction(claimJob);if(!job)return null;
 const started=Date.now();let stagedKey;
 try{
  const inputs=(await pool.query(`SELECT m.storage_key,m.sha256,i.azimuth,i.elevation FROM reconstruction_inputs i
   JOIN media_assets m ON m.id=i.media_id WHERE i.job_id=$1 AND m.status='READY' ORDER BY i.created_at,i.media_id`,[job.id])).rows;
  const work=join(root,job.id,randomUUID());await mkdir(work,{recursive:true,mode:0o700});
  const manifest={jobId:job.id,personId:job.person_id,category:job.category,pipelineVersion:policy.version,
   inputRevision:job.input_revision,policy,inputs:inputs.map(i=>({...i,path:storage.path(i.storage_key)}))};
  const path=join(work,'manifest.json');await writeFile(path,JSON.stringify(manifest),{mode:0o600});
  await execute(path);
  const resultPath=join(work,'result.json');
  if((await stat(resultPath)).size>2*1024*1024)throw new Error('RESULT_TOO_LARGE');
  const result=JSON.parse(await readFile(resultPath,'utf8'));
  if(!['QUALITY_CHECK','NEEDS_MORE_INPUT','FAILED'].includes(result.status))throw new Error('INVALID_WORKER_STATE');
  let buffer,metadata;
  if(result.status==='QUALITY_CHECK'){
   if(result.output!=='reconstruction.glb'||result.provenance?.pipelineVersion!==policy.version)throw new Error('OUTPUT_PROVENANCE');
   const expected=inputs.map(i=>i.sha256).sort();
   if(JSON.stringify(expected)!==JSON.stringify(result.provenance.inputHashes))throw new Error('INPUT_PROVENANCE');
   const outputPath=join(work,result.output);
   if((await stat(outputPath)).size>policy.maxOutputBytes)throw new Error('OUTPUT_TOO_LARGE');
   buffer=await readFile(outputPath);
   if(createHash('sha256').update(buffer).digest('hex')!==result.sha256)throw new Error('OUTPUT_INTEGRITY');
   metadata={...inspectGlb(buffer),provenance:result.provenance,inputRevision:job.input_revision};
   stagedKey=randomUUID()+'.glb';await storage.put(stagedKey,buffer);
  }
  await transaction(async c=>{
   const current=(await c.query('SELECT * FROM reconstruction_jobs WHERE id=$1 FOR UPDATE',[job.id])).rows[0];
   if(current.state!=='PROCESSING'||current.input_revision!==job.input_revision)throw new Error('STALE_JOB');
   let output;
   if(buffer){output=(await c.query('INSERT INTO reconstruction_outputs(job_id,person_id,storage_key,mime,bytes,sha256,metadata) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [job.id,job.person_id,stagedKey,'model/gltf-binary',buffer.length,result.sha256,metadata])).rows[0];
    await c.query("INSERT INTO asset_versions(person_id,reconstruction_output_id,version,asset_type,provenance,quality,lifecycle) VALUES($1,$2,(SELECT COALESCE(max(version),0)+1 FROM asset_versions WHERE person_id=$1 AND asset_type='RECONSTRUCTION_GLB'),'RECONSTRUCTION_GLB',$3,$4,'DERIVED')",[job.person_id,output.id,result.provenance,{}]);}
   const metrics={...result.metrics,...(metadata?{triangles:metadata.triangles,vertices:metadata.vertices,invalidGeometry:metadata.invalidGeometry}:{}),
    processing_duration:(Date.now()-started)/1000,first_pass_success:false,category:job.category};
   const updated=await transition(c,current,result.status,{metrics,code:result.error_code||null,guidance:result.guidance||['Inspecione geometria, completude, cor e dimensão antes de compor.']});
   await c.query('UPDATE reconstruction_attempts SET state=$3,metrics=$4,completed_at=CASE WHEN $3 IN (\'QUALITY_CHECK\',\'NEEDS_MORE_INPUT\',\'FAILED\') THEN now() ELSE NULL END WHERE job_id=$1 AND sequence=$2',[job.id,current.attempt,updated.state,metrics]);
  });
  return {id:job.id,state:result.status};
 }catch(error){
  if(stagedKey)await storage.delete(stagedKey);
  await transaction(async c=>{
   const current=(await c.query('SELECT * FROM reconstruction_jobs WHERE id=$1 FOR UPDATE',[job.id])).rows[0];
   if(current.state==='PROCESSING'){const metrics={reconstruction_success:false,first_pass_success:false,processing_duration:(Date.now()-started)/1000,failure_reason:knownFailure(error.message),category:job.category};await transition(c,current,'FAILED',{code:knownFailure(error.message),metrics});await c.query("UPDATE reconstruction_attempts SET state='FAILED',metrics=$3,completed_at=now() WHERE job_id=$1 AND sequence=$2",[job.id,current.attempt,metrics]);}
  });
  return {id:job.id,state:'FAILED',code:knownFailure(error.message)};
 }
}
function knownFailure(message){
 return ['PROCESS_TIMEOUT','WORKER_UNAVAILABLE','WORKER_EXIT','OUTPUT_PROVENANCE','INPUT_PROVENANCE','OUTPUT_INTEGRITY','OUTPUT_TOO_LARGE','STALE_JOB'].includes(message)?message:'WORKER_VALIDATION_FAILED';
}
export async function recoverExpired(){
 return transaction(async c=>{
  const rows=(await c.query("SELECT * FROM reconstruction_jobs WHERE state='PROCESSING' AND lease_until<now() FOR UPDATE SKIP LOCKED")).rows;
  let recovered=0;
  for(const j of rows){
   // PGlite does not fully emulate row locks across concurrent test connections. The
   // conditional lease clear is the portable ownership gate; PostgreSQL also keeps
   // the SKIP LOCKED fast path above.
   const claimed=(await c.query("UPDATE reconstruction_jobs SET lease_until=NULL WHERE id=$1 AND state='PROCESSING' AND lease_until<now() RETURNING *",[j.id])).rows[0];
   if(!claimed)continue;
   const metrics={...claimed.metrics,reconstruction_success:false,first_pass_success:false,failure_reason:'WORKER_LEASE_EXPIRED',category:claimed.category};
   const failed=await transition(c,claimed,'FAILED',{code:'WORKER_LEASE_EXPIRED',metrics});
   await c.query("UPDATE reconstruction_attempts SET state='FAILED',metrics=$3,completed_at=now() WHERE job_id=$1 AND sequence=$2",[claimed.id,claimed.attempt,metrics]);
   if(retryAvailable(failed))await transition(c,failed,'QUEUED');
   recovered++;
  }
  return recovered;
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  await recoverExpired();
  // Local POC executes one job per invocation; scheduler can repeat without a paid queue.
  console.log(JSON.stringify(await runOnce()||{state:'IDLE'}));
 }finally{await pool.end();}
}
