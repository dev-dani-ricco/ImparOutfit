import { pool } from '../config/db.js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { resolvePublishedPolicy } from '../ai/policyService.js';
import { resolvePublishedPrompt } from '../ai/promptService.js';
import { sha256Json } from '../execution/primitives.js';

const fail=code=>Object.assign(new Error(code),{code});
const knownCodes=new Set([
  'EXECUTION_PRINCIPAL_NOT_CONFIGURED',
  'EXECUTION_PRINCIPAL_NOT_AUTHORIZED',
  'DEFAULT_METHODOLOGY_NOT_CONFIGURED',
  'DEFAULT_METHODOLOGY_NOT_AVAILABLE',
  'METHODOLOGY_NOT_AVAILABLE',
  'KNOWLEDGE_NOT_AVAILABLE',
  'POLICY_NOT_AVAILABLE',
  'PROMPT_NOT_AVAILABLE',
  'ANALYSIS_NOT_AVAILABLE'
]);

async function assertExecutor(db,principalId){
  if(!principalId)throw fail('EXECUTION_PRINCIPAL_NOT_CONFIGURED');
  const row=(await db.query(`
    SELECT p.id
    FROM principals p
    JOIN memberships m ON m.person_id=p.person_id AND m.status='ACTIVE'
    JOIN organizations o ON o.id=m.organization_id AND o.kind='INSTITUTIONAL' AND o.status='ACTIVE'
    JOIN grants g ON g.membership_id=m.id
      AND g.resource_id IS NULL
      AND g.revoked_at IS NULL
      AND (g.expires_at IS NULL OR g.expires_at>now())
    WHERE p.id=$1 AND p.principal_type='HUMAN' AND p.status='ACTIVE'
      AND g.capability_code IN ('impar.analysis.execute','impar.analysis.methodology.assign')
    GROUP BY p.id
    HAVING count(DISTINCT g.capability_code)=2
  `,[principalId])).rows[0];
  if(!row)throw fail('EXECUTION_PRINCIPAL_NOT_AUTHORIZED');
  return row.id;
}

async function resolveMethodology(db,analysis,methodologyKey){
  if(analysis.methodology_version_id){
    const existing=(await db.query(
      "SELECT id FROM methodology_versions WHERE id=$1 AND status='PUBLISHED'",
      [analysis.methodology_version_id]
    )).rows[0];
    if(!existing)throw fail('METHODOLOGY_NOT_AVAILABLE');
    return existing.id;
  }
  if(!methodologyKey)throw fail('DEFAULT_METHODOLOGY_NOT_CONFIGURED');
  const selected=(await db.query(`
    SELECT v.id
    FROM methodologies m
    JOIN methodology_versions v ON v.methodology_id=m.id
    WHERE m.key=$1 AND m.status='ACTIVE' AND v.status='PUBLISHED'
    ORDER BY v.version DESC
    LIMIT 1
  `,[methodologyKey])).rows[0];
  if(!selected)throw fail('DEFAULT_METHODOLOGY_NOT_AVAILABLE');
  await db.query(
    'UPDATE impar_analyses SET methodology_version_id=$1 WHERE id=$2 AND methodology_version_id IS NULL',
    [selected.id,analysis.id]
  );
  return selected.id;
}

async function snapshotKnowledge(db,methodologyVersionId){
  const total=(await db.query(
    'SELECT count(*)::int count FROM methodology_version_knowledge WHERE methodology_version_id=$1',
    [methodologyVersionId]
  )).rows[0].count;
  const rows=(await db.query(`
    SELECT k.id
    FROM methodology_version_knowledge b
    JOIN authorized_knowledge_versions k ON k.id=b.authorized_knowledge_version_id
    WHERE b.methodology_version_id=$1 AND k.status='PUBLISHED'
    ORDER BY k.id
  `,[methodologyVersionId])).rows;
  if(!total||rows.length!==total)throw fail('KNOWLEDGE_NOT_AVAILABLE');
  return rows.map(row=>row.id);
}

async function enqueue(db,request,{principalId,methodologyKey}){
  const executor=await assertExecutor(db,principalId);
  const analysis=(await db.query(
    'SELECT * FROM impar_analyses WHERE id=$1 AND owner_person_id=$2 FOR UPDATE',
    [request.analysis_id,request.owner_person_id]
  )).rows[0];
  if(!analysis||analysis.status!=='DRAFT')throw fail('ANALYSIS_NOT_AVAILABLE');

  const methodologyVersionId=await resolveMethodology(db,analysis,methodologyKey);
  const knowledge=await snapshotKnowledge(db,methodologyVersionId);
  const policy=await resolvePublishedPolicy('IMPAR_ANALYSIS',db);
  const prompt=await resolvePublishedPrompt('IMPAR_ANALYSIS',db);
  const envelope={
    analysisId:analysis.id,
    lookVersionId:analysis.look_version_id,
    contextId:analysis.context_id,
    methodologyVersionId,
    authorizedKnowledgeVersionIds:knowledge,
    aiPolicyVersionId:policy.id,
    promptVersionId:prompt.id
  };
  const fingerprint=sha256Json(envelope);
  const key=`analysis-request:${request.id}`;

  let job=(await db.query(
    'SELECT * FROM impar_analysis_jobs WHERE owner_person_id=$1 AND idempotency_key=$2 FOR UPDATE',
    [analysis.owner_person_id,key]
  )).rows[0];

  if(job&&job.envelope_fingerprint!==fingerprint)throw fail('ANALYSIS_NOT_AVAILABLE');
  if(!job){
    job=(await db.query(`
      INSERT INTO impar_analysis_jobs(
        analysis_id,owner_person_id,requested_by_principal_id,look_version_id,context_id,
        methodology_version_id,ai_policy_version_id,prompt_version_id,idempotency_key,envelope_fingerprint
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `,[
      analysis.id,analysis.owner_person_id,executor,analysis.look_version_id,analysis.context_id,
      methodologyVersionId,policy.id,prompt.id,key,fingerprint
    ])).rows[0];
    for(const id of knowledge){
      await db.query(
        'INSERT INTO impar_analysis_job_knowledge(job_id,authorized_knowledge_version_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
        [job.id,id]
      );
    }
  }

  const updated=(await db.query(`
    UPDATE impar_analysis_requests
    SET state='ENQUEUED',accepted_by_principal_id=$2,job_id=$3,error_code=NULL
    WHERE id=$1 AND state='REQUESTED'
    RETURNING *
  `,[request.id,executor,job.id])).rows[0];
  return {request:updated,job};
}

export async function runRequestOnce({
  principalId=process.env.IMPAR_EXECUTION_PRINCIPAL_ID,
  methodologyKey=process.env.IMPAR_DEFAULT_METHODOLOGY_KEY
}={}){
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const request=(await client.query(
      "SELECT * FROM impar_analysis_requests WHERE state='REQUESTED' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1"
    )).rows[0];
    if(!request){
      await client.query('COMMIT');
      return null;
    }
    try{
      const result=await enqueue(client,request,{principalId,methodologyKey});
      await client.query('COMMIT');
      return {id:request.id,state:'ENQUEUED',jobId:result.job.id};
    }catch(error){
      const code=knownCodes.has(error.code)?error.code:'REQUEST_PROCESSING_FAILED';
      await client.query(
        "UPDATE impar_analysis_requests SET state='FAILED',error_code=$2 WHERE id=$1",
        [request.id,code]
      );
      await client.query('COMMIT');
      return {id:request.id,state:'FAILED',code};
    }
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{
    client.release();
  }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    console.log(JSON.stringify(await runRequestOnce()||{state:'IDLE'}));
  }finally{
    await pool.end();
  }
}
