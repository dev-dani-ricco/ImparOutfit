import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { uuid, validate } from '../utils/validation.js';
import { authorizePersonal } from '../services/authorizationService.js';
import { HttpError } from '../utils/http.js';

const schema=Joi.object({
  lookId:uuid.required(),
  lookVersionId:uuid.required(),
  contextId:uuid.required(),
  origin:Joi.string().valid('SYSTEM','EXPERT').required(),
  methodologyVersionRef:Joi.string().trim().min(1).max(160).allow(null)
});
const toAnalysis=row=>({
  id:row.id,
  lookId:row.look_id,
  lookVersionId:row.look_version_id,
  contextId:row.context_id,
  status:row.status,
  origin:row.origin,
  methodologyVersionRef:row.methodology_version_ref,
  createdAt:row.created_at
});

export async function create(req,res) {
  const body=validate(schema,req.body||{});
  if(body.origin==='EXPERT') throw new HttpError(403,'Origin EXPERT exige autorização institucional de análise');
  const look=(await query('SELECT id,person_id FROM looks WHERE id=$1',[body.lookId])).rows[0];
  authorizePersonal(req.auth,look);
  const lookVersion=(await query('SELECT id,look_id,person_id FROM look_versions WHERE id=$1',[body.lookVersionId])).rows[0];
  authorizePersonal(req.auth,lookVersion);
  if(lookVersion.look_id!==look.id) throw new HttpError(404,'LookVersion não pertence a este Look');
  const context=(await query('SELECT id,owner_person_id AS person_id FROM contexts WHERE id=$1',[body.contextId])).rows[0];
  authorizePersonal(req.auth,context);
  const analysis=(await query(`INSERT INTO impar_analyses(
    owner_person_id,look_id,look_version_id,context_id,status,origin,methodology_version_ref
  ) VALUES($1,$2,$3,$4,'DRAFT',$5,$6)
  RETURNING id,look_id,look_version_id,context_id,status,origin,methodology_version_ref,created_at`,[
    req.auth.personId,look.id,lookVersion.id,context.id,body.origin,body.methodologyVersionRef??null
  ])).rows[0];
  res.status(201).json(toAnalysis(analysis));
}

export async function get(req,res) {
  const analysis=(await query(`SELECT id,owner_person_id AS person_id,look_id,look_version_id,context_id,status,origin,methodology_version_ref,created_at
    FROM impar_analyses WHERE id=$1`,[req.params.analysisId])).rows[0];
  authorizePersonal(req.auth,analysis);
  res.json(toAnalysis(analysis));
}

const blockedPayloadKeys=new Set(['chainOfThought','systemPrompt','prompt','rawPrompt','ragContext','knowledgeChunks','secrets','credentials']);
const resultSchema=Joi.object({
  payload:Joi.object().unknown(true).custom((payload,helpers)=>{
    if(Object.keys(payload).some(key=>blockedPayloadKeys.has(key))) return helpers.error('any.invalid');
    return payload;
  }).required()
});
const toResult=row=>({
  id:row.id,
  analysisId:row.analysis_id,
  resultVersion:row.result_version,
  status:row.status,
  payload:row.payload,
  createdAt:row.created_at
});
export async function createResult(req,res) {
  const body=validate(resultSchema,req.body||{});
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const analysis=(await client.query(`SELECT id,owner_person_id AS person_id,status
      FROM impar_analyses WHERE id=$1 FOR UPDATE`,[req.params.analysisId])).rows[0];
    authorizePersonal(req.auth,analysis);
    if(analysis.status!=='DRAFT') throw new HttpError(409,'Analysis não aceita Results fora de DRAFT');
    const versions=(await client.query(`SELECT result_version FROM impar_analysis_results
      WHERE analysis_id=$1 ORDER BY result_version DESC FOR SHARE`,[analysis.id])).rows;
    const next=(versions[0]?.result_version??0)+1;
    const result=(await client.query(`INSERT INTO impar_analysis_results(
      analysis_id,owner_person_id,result_version,status,payload
    ) VALUES($1,$2,$3,'DRAFT',$4)
    RETURNING id,analysis_id,result_version,status,payload,created_at`,[
      analysis.id,req.auth.personId,next,body.payload
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
  const results=(await query(`SELECT id,analysis_id,result_version,status,payload,created_at
    FROM impar_analysis_results WHERE analysis_id=$1 AND owner_person_id=$2
    ORDER BY result_version ASC,id ASC`,[analysis.id,req.auth.personId])).rows;
  res.json(results.map(toResult));
}
