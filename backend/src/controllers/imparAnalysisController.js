import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { uuid, validate } from '../utils/validation.js';
import { authorizeInstitutionalCapability, authorizePersonal } from '../services/authorizationService.js';
import { HttpError } from '../utils/http.js';
import { CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION, validateAnalysisResultPayload } from '../services/imparAnalysisResultPayload.js';

const schema=Joi.object({
  lookId:uuid.required(),
  lookVersionId:uuid.required(),
  contextId:uuid.required()
});
const toAnalysis=row=>({
  id:row.id,
  lookId:row.look_id,
  lookVersionId:row.look_version_id,
  contextId:row.context_id,
  status:row.status,
  origin:row.origin,
  methodologyVersionRef:row.methodology_version_ref,
  finalResultId:row.final_result_id,
  createdAt:row.created_at
});

export async function create(req,res) {
  const body=validate(schema,req.body||{});
  const look=(await query('SELECT id,person_id FROM looks WHERE id=$1',[body.lookId])).rows[0];
  authorizePersonal(req.auth,look);
  const lookVersion=(await query('SELECT id,look_id,person_id FROM look_versions WHERE id=$1',[body.lookVersionId])).rows[0];
  authorizePersonal(req.auth,lookVersion);
  if(lookVersion.look_id!==look.id) throw new HttpError(404,'LookVersion não pertence a este Look');
  const context=(await query('SELECT id,owner_person_id AS person_id FROM contexts WHERE id=$1',[body.contextId])).rows[0];
  authorizePersonal(req.auth,context);
  const analysis=(await query(`INSERT INTO impar_analyses(
    owner_person_id,look_id,look_version_id,context_id,status,origin,methodology_version_ref
  ) VALUES($1,$2,$3,$4,'DRAFT',NULL,NULL)
  RETURNING id,look_id,look_version_id,context_id,status,origin,methodology_version_ref,final_result_id,created_at`,[
    req.auth.personId,look.id,lookVersion.id,context.id
  ])).rows[0];
  res.status(201).json(toAnalysis(analysis));
}

export async function get(req,res) {
  const analysis=(await query(`SELECT id,owner_person_id AS person_id,look_id,look_version_id,context_id,status,origin,methodology_version_ref,final_result_id,created_at
    FROM impar_analyses WHERE id=$1`,[req.params.analysisId])).rows[0];
  authorizePersonal(req.auth,analysis);
  res.json(toAnalysis(analysis));
}

const resultSchema=Joi.object({
  payload:Joi.any().required()
});
const toResult=row=>({
  id:row.id,
  analysisId:row.analysis_id,
  resultVersion:row.result_version,
  resultSchemaVersion:row.result_schema_version,
  status:row.status,
  payload:row.payload,
  createdAt:row.created_at
});
export async function createResult(req,res) {
  const body=validate(resultSchema,req.body||{});
  const payload=validateAnalysisResultPayload(CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,body.payload);
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const analysis=(await client.query(`SELECT id,owner_person_id AS person_id,status
      FROM impar_analyses WHERE id=$1 FOR UPDATE`,[req.params.analysisId])).rows[0];
    authorizePersonal(req.auth,analysis);
    await authorizeInstitutionalCapability(req.auth,'impar.analysis.execute',client);
    if(analysis.status!=='DRAFT') throw new HttpError(409,'Analysis não aceita Results fora de DRAFT');
    const versions=(await client.query(`SELECT result_version FROM impar_analysis_results
      WHERE analysis_id=$1 ORDER BY result_version DESC FOR SHARE`,[analysis.id])).rows;
    const next=(versions[0]?.result_version??0)+1;
    const result=(await client.query(`INSERT INTO impar_analysis_results(
      analysis_id,owner_person_id,result_version,result_schema_version,status,payload,created_by_person_id
    ) VALUES($1,$2,$3,$4,'DRAFT',$5,$6)
    RETURNING id,analysis_id,result_version,result_schema_version,status,payload,created_at`,[
      analysis.id,req.auth.personId,next,CURRENT_ANALYSIS_RESULT_SCHEMA_VERSION,payload,req.auth.personId
    ])).rows[0];
    await client.query('COMMIT');
    res.status(201).json(toResult(result));
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

export async function listResults(req,res) {
  const analysis=(await query('SELECT id,owner_person_id AS person_id FROM impar_analyses WHERE id=$1',[req.params.analysisId])).rows[0];
  authorizePersonal(req.auth,analysis);
  const results=(await query(`SELECT id,analysis_id,result_version,result_schema_version,status,payload,created_at
    FROM impar_analysis_results WHERE analysis_id=$1 AND owner_person_id=$2
    ORDER BY result_version ASC,id ASC`,[analysis.id,req.auth.personId])).rows;
  res.json(results.map(toResult));
}

export async function finalizeResult(req,res) {
  validate(Joi.object({}),req.body||{});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const analysis=(await client.query(`SELECT id,owner_person_id AS person_id,status
      FROM impar_analyses WHERE id=$1 FOR UPDATE`,[req.params.analysisId])).rows[0];
    authorizePersonal(req.auth,analysis);
    const result=(await client.query(`SELECT id,analysis_id,owner_person_id AS person_id,result_version,result_schema_version,status,payload,created_at
      FROM impar_analysis_results WHERE id=$1 AND analysis_id=$2 FOR UPDATE`,[req.params.resultId,analysis.id])).rows[0];
    authorizePersonal(req.auth,result);
    await authorizeInstitutionalCapability(req.auth,'impar.analysis.execute',client);
    if(analysis.status!=='DRAFT') throw new HttpError(409,'Analysis não aceita finalização de Results fora de DRAFT');
    if(result.status==='FINAL') {
      await client.query('COMMIT');
      return res.status(200).json(toResult(result));
    }
    const finalized=(await client.query(`UPDATE impar_analysis_results SET status='FINAL',finalized_by_person_id=$4
      WHERE id=$1 AND analysis_id=$2 AND owner_person_id=$3 AND status='DRAFT'
      RETURNING id,analysis_id,result_version,result_schema_version,status,payload,created_at`,[
      result.id,analysis.id,req.auth.personId,req.auth.personId
    ])).rows[0];
    if(!finalized) throw new HttpError(409,'Result não pode ser finalizado neste estado');
    await client.query('COMMIT');
    res.json(toResult(finalized));
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

const completeSchema=Joi.object({resultId:uuid.required()});
export async function complete(req,res) {
  const body=validate(completeSchema,req.body||{});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const analysis=(await client.query(`SELECT id,owner_person_id AS person_id,look_id,look_version_id,context_id,status,origin,
      methodology_version_ref,final_result_id,created_at FROM impar_analyses WHERE id=$1 FOR UPDATE`,[req.params.analysisId])).rows[0];
    authorizePersonal(req.auth,analysis);
    const result=(await client.query(`SELECT id,analysis_id,owner_person_id AS person_id,status
      FROM impar_analysis_results WHERE id=$1 AND analysis_id=$2 AND owner_person_id=$3 FOR UPDATE`,[
      body.resultId,analysis.id,req.auth.personId
    ])).rows[0];
    authorizePersonal(req.auth,result);
    await authorizeInstitutionalCapability(req.auth,'impar.analysis.execute',client);
    if(analysis.status==='COMPLETED') {
      if(analysis.final_result_id!==result.id) throw new HttpError(409,'Analysis já possui Result final diferente');
      await client.query('COMMIT');
      return res.json(toAnalysis(analysis));
    }
    if(result.status!=='FINAL') throw new HttpError(409,'Result precisa estar FINAL para concluir a Analysis');
    const completed=(await client.query(`UPDATE impar_analyses SET status='COMPLETED',final_result_id=$1,completed_by_person_id=$4
      WHERE id=$2 AND owner_person_id=$3 AND status='DRAFT'
      RETURNING id,look_id,look_version_id,context_id,status,origin,methodology_version_ref,final_result_id,created_at`,[
      result.id,analysis.id,req.auth.personId,req.auth.personId
    ])).rows[0];
    if(!completed) throw new HttpError(409,'Analysis não pode ser concluída neste estado');
    await client.query('COMMIT');
    res.json(toAnalysis(completed));
  } catch(error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
