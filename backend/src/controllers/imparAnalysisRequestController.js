import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { authorizePersonal } from '../services/authorizationService.js';
import { normalizeIdempotencyKey } from '../execution/primitives.js';
import { validate } from '../utils/validation.js';
import { HttpError } from '../utils/http.js';

const dto=row=>({
  id:row.id,
  analysisId:row.analysis_id,
  state:row.state,
  jobId:row.job_id,
  errorCode:row.error_code,
  createdAt:row.created_at,
  updatedAt:row.updated_at
});

export async function request(req,res){
  validate(Joi.object({}),req.body||{});
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const analysis=(await client.query(
      'SELECT id,owner_person_id AS person_id,status FROM impar_analyses WHERE id=$1 FOR UPDATE',
      [req.params.analysisId]
    )).rows[0];
    authorizePersonal(req.auth,analysis);
    if(analysis.status!=='DRAFT')throw new HttpError(409,'Analysis não aceita solicitação neste estado');

    const existing=(await client.query(
      'SELECT * FROM impar_analysis_requests WHERE analysis_id=$1 AND owner_person_id=$2 FOR UPDATE',
      [analysis.id,req.auth.personId]
    )).rows[0];
    if(existing){
      await client.query('COMMIT');
      return res.status(200).json(dto(existing));
    }

    const key=normalizeIdempotencyKey(
      req.get('Idempotency-Key')??`analysis-request:${analysis.id}`
    );
    const row=(await client.query(
      `INSERT INTO impar_analysis_requests(
        analysis_id,owner_person_id,requested_by_principal_id,idempotency_key
      ) VALUES($1,$2,$3,$4) RETURNING *`,
      [analysis.id,req.auth.personId,req.auth.principalId,key]
    )).rows[0];
    await client.query('COMMIT');
    res.status(201).json(dto(row));
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{
    client.release();
  }
}

export async function get(req,res){
  const analysis=(await query(
    'SELECT id,owner_person_id AS person_id FROM impar_analyses WHERE id=$1',
    [req.params.analysisId]
  )).rows[0];
  authorizePersonal(req.auth,analysis);
  const row=(await query(
    'SELECT * FROM impar_analysis_requests WHERE analysis_id=$1 AND owner_person_id=$2',
    [analysis.id,req.auth.personId]
  )).rows[0];
  if(!row)throw new HttpError(404,'Solicitação não encontrada');
  res.json(dto(row));
}

export async function cancel(req,res){
  validate(Joi.object({}),req.body||{});
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const analysis=(await client.query(
      'SELECT id,owner_person_id AS person_id FROM impar_analyses WHERE id=$1 FOR UPDATE',
      [req.params.analysisId]
    )).rows[0];
    authorizePersonal(req.auth,analysis);
    const current=(await client.query(
      'SELECT * FROM impar_analysis_requests WHERE analysis_id=$1 AND owner_person_id=$2 FOR UPDATE',
      [analysis.id,req.auth.personId]
    )).rows[0];
    if(!current)throw new HttpError(404,'Solicitação não encontrada');
    if(current.state==='CANCELLED'){
      await client.query('COMMIT');
      return res.json(dto(current));
    }
    if(current.state!=='REQUESTED')throw new HttpError(409,'Solicitação já entrou em execução');
    const row=(await client.query(
      `UPDATE impar_analysis_requests
       SET state='CANCELLED',error_code=NULL
       WHERE id=$1 AND state='REQUESTED' RETURNING *`,
      [current.id]
    )).rows[0];
    await client.query('COMMIT');
    res.json(dto(row));
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{
    client.release();
  }
}
