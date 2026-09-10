import Joi from 'joi';
import { query } from '../config/db.js';
import { uuid, validate } from '../utils/validation.js';
import { authorizePersonal } from '../services/authorizationService.js';
import { HttpError } from '../utils/http.js';

const schema=Joi.object({name:Joi.string().trim().max(160).empty('').allow(null).default(null)});

export async function create(req,res) {
  const body=validate(schema,req.body||{});
  const comparison=(await query('INSERT INTO comparisons(owner_person_id,name) VALUES($1,$2) RETURNING id,name,created_at',[req.auth.personId,body.name])).rows[0];
  res.status(201).json({id:comparison.id,name:comparison.name,createdAt:comparison.created_at});
}

const evaluationSchema=Joi.object({
  contextId:uuid,
  origin:Joi.string().valid('USER','SYSTEM').required()
});
const evaluationDto=row=>({
  id:row.id,
  comparisonId:row.comparison_id,
  contextId:row.context_id,
  origin:row.origin,
  status:row.status,
  createdAt:row.created_at
});
export async function createEvaluation(req,res) {
  const body=validate(evaluationSchema,req.body||{});
  const comparison=(await query('SELECT id,owner_person_id AS person_id FROM comparisons WHERE id=$1',[req.params.comparisonId])).rows[0];
  authorizePersonal(req.auth,comparison);
  if(body.contextId) {
    const context=(await query('SELECT id,owner_person_id AS person_id FROM contexts WHERE id=$1',[body.contextId])).rows[0];
    authorizePersonal(req.auth,context);
  }
  const evaluation=(await query(`INSERT INTO comparison_evaluations(comparison_id,owner_person_id,context_id,origin,status)
    VALUES($1,$2,$3,$4,'DRAFT') RETURNING id,comparison_id,context_id,origin,status,created_at`,[
    comparison.id,req.auth.personId,body.contextId??null,body.origin
  ])).rows[0];
  res.status(201).json(evaluationDto(evaluation));
}

const criterionSchema=Joi.object({
  criterionKey:Joi.string().trim().min(1).max(160).required(),
  criterionLabel:Joi.string().trim().max(160).allow('',null),
  position:Joi.number().integer().min(0).required()
});
const criterionDto=row=>({
  id:row.id,
  evaluationId:row.evaluation_id,
  criterionKey:row.criterion_key,
  criterionLabel:row.criterion_label,
  position:row.position,
  createdAt:row.created_at
});
export async function createEvaluationCriterion(req,res) {
  const body=validate(criterionSchema,req.body||{});
  const comparison=(await query('SELECT id,owner_person_id AS person_id FROM comparisons WHERE id=$1',[req.params.comparisonId])).rows[0];
  authorizePersonal(req.auth,comparison);
  const evaluation=(await query(`SELECT id,comparison_id,owner_person_id AS person_id,status FROM comparison_evaluations
    WHERE id=$1 AND comparison_id=$2`,[req.params.evaluationId,comparison.id])).rows[0];
  authorizePersonal(req.auth,evaluation);
  if(evaluation.status!=='DRAFT') throw new HttpError(409,'Evaluation não aceita critérios fora de DRAFT');
  if((await query(`SELECT id FROM comparison_evaluation_criteria
    WHERE evaluation_id=$1 AND lower(criterion_key)=lower($2)`,[evaluation.id,body.criterionKey])).rows[0]) {
    throw new HttpError(409,'criterionKey já existe nesta Evaluation');
  }
  if((await query('SELECT id FROM comparison_evaluation_criteria WHERE evaluation_id=$1 AND position=$2',[evaluation.id,body.position])).rows[0]) {
    throw new HttpError(409,'position já existe nesta Evaluation');
  }
  try {
    const criterion=(await query(`INSERT INTO comparison_evaluation_criteria(
      evaluation_id,owner_person_id,criterion_key,criterion_label,position
    ) VALUES($1,$2,$3,$4,$5) RETURNING id,evaluation_id,criterion_key,criterion_label,position,created_at`,[
      evaluation.id,req.auth.personId,body.criterionKey,body.criterionLabel??null,body.position
    ])).rows[0];
    res.status(201).json(criterionDto(criterion));
  } catch(error) {
    if(error.code==='23505') throw new HttpError(409,'criterionKey ou position já existe nesta Evaluation');
    throw error;
  }
}

const resultSchema=Joi.object({
  criterionId:uuid.required(),
  lookId:uuid.required(),
  lookVersionId:uuid.required(),
  value:Joi.string().trim().max(500).allow('',null),
  note:Joi.string().trim().max(5000).allow('',null)
});
const resultDto=row=>({
  evaluationId:row.evaluation_id,
  criterionId:row.criterion_id,
  lookId:row.look_id,
  lookVersionId:row.look_version_id,
  value:row.value,
  note:row.note,
  createdAt:row.created_at
});
export async function createEvaluationResult(req,res) {
  const body=validate(resultSchema,req.body||{});
  const comparison=(await query('SELECT id,owner_person_id AS person_id FROM comparisons WHERE id=$1',[req.params.comparisonId])).rows[0];
  authorizePersonal(req.auth,comparison);
  const evaluation=(await query(`SELECT id,comparison_id,owner_person_id AS person_id,status FROM comparison_evaluations
    WHERE id=$1 AND comparison_id=$2`,[req.params.evaluationId,comparison.id])).rows[0];
  authorizePersonal(req.auth,evaluation);
  if(evaluation.status!=='DRAFT') throw new HttpError(409,'Evaluation não aceita Results fora de DRAFT');
  const criterion=(await query(`SELECT id,evaluation_id,owner_person_id AS person_id FROM comparison_evaluation_criteria
    WHERE id=$1 AND evaluation_id=$2`,[body.criterionId,evaluation.id])).rows[0];
  authorizePersonal(req.auth,criterion);
  const look=(await query('SELECT id,person_id FROM looks WHERE id=$1',[body.lookId])).rows[0];
  authorizePersonal(req.auth,look);
  if(!(await query(`SELECT look_id FROM comparison_looks
    WHERE comparison_id=$1 AND look_id=$2 AND owner_person_id=$3`,[comparison.id,look.id,req.auth.personId])).rows[0]) {
    throw new HttpError(404,'Look não pertence a esta Comparison');
  }
  const lookVersion=(await query('SELECT id,look_id,person_id FROM look_versions WHERE id=$1',[body.lookVersionId])).rows[0];
  authorizePersonal(req.auth,lookVersion);
  if(lookVersion.look_id!==look.id) throw new HttpError(404,'LookVersion não pertence a este Look');
  if((await query(`SELECT evaluation_id FROM comparison_evaluation_results
    WHERE evaluation_id=$1 AND look_id=$2 AND criterion_id=$3`,[evaluation.id,look.id,criterion.id])).rows[0]) {
    throw new HttpError(409,'Result já existe para este Look e Criterion');
  }
  try {
    const result=(await query(`INSERT INTO comparison_evaluation_results(
      evaluation_id,comparison_id,look_id,look_version_id,criterion_id,owner_person_id,value,note
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING evaluation_id,criterion_id,look_id,look_version_id,value,note,created_at`,[
      evaluation.id,comparison.id,look.id,lookVersion.id,criterion.id,req.auth.personId,
      body.value??null,body.note??null
    ])).rows[0];
    res.status(201).json(resultDto(result));
  } catch(error) {
    if(error.code==='23505') throw new HttpError(409,'Result já existe ou referências são incompatíveis');
    throw error;
  }
}

const linkSchema=Joi.object({position:Joi.number().integer().min(0).required()});
const linkDto=row=>({comparisonId:row.comparison_id,lookId:row.look_id,position:row.position,linkedAt:row.created_at});
export async function linkLook(req,res) {
  const body=validate(linkSchema,req.body);
  const comparison=(await query('SELECT id,owner_person_id AS person_id FROM comparisons WHERE id=$1',[req.params.comparisonId])).rows[0];
  authorizePersonal(req.auth,comparison);
  const look=(await query('SELECT id,person_id,current_version_id FROM looks WHERE id=$1',[req.params.lookId])).rows[0];
  authorizePersonal(req.auth,look);
  const existing=(await query(`SELECT comparison_id,look_id,position,created_at FROM comparison_looks
    WHERE comparison_id=$1 AND look_id=$2 AND owner_person_id=$3`,[comparison.id,look.id,req.auth.personId])).rows[0];
  if(existing) {
    if(existing.position!==body.position) throw new HttpError(409,'Look já possui outra posição nesta Comparison');
    return res.status(200).json(linkDto(existing));
  }
  if((await query('SELECT look_id FROM comparison_looks WHERE comparison_id=$1 AND position=$2 AND owner_person_id=$3',[comparison.id,body.position,req.auth.personId])).rows[0]) {
    throw new HttpError(409,'Posição já ocupada nesta Comparison');
  }
  try {
    const link=(await query(`INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position)
      VALUES($1,$2,$3,$4) RETURNING comparison_id,look_id,position,created_at`,[comparison.id,look.id,req.auth.personId,body.position])).rows[0];
    res.status(201).json(linkDto(link));
  } catch(error) {
    if(error.code==='23505') throw new HttpError(409,'Look ou posição já vinculados nesta Comparison');
    throw error;
  }
}

export async function get(req,res) {
  const comparison=(await query('SELECT id,owner_person_id AS person_id,name,created_at FROM comparisons WHERE id=$1',[req.params.comparisonId])).rows[0];
  authorizePersonal(req.auth,comparison);
  res.json({id:comparison.id,name:comparison.name,createdAt:comparison.created_at});
}

export async function listLooks(req,res) {
  const comparison=(await query('SELECT id,owner_person_id AS person_id FROM comparisons WHERE id=$1',[req.params.comparisonId])).rows[0];
  authorizePersonal(req.auth,comparison);
  const looks=(await query(`SELECT cl.position,l.id,l.title,l.created_at FROM comparison_looks cl
    JOIN looks l ON l.id=cl.look_id AND l.person_id=cl.owner_person_id
    WHERE cl.comparison_id=$1 AND cl.owner_person_id=$2
    ORDER BY cl.position ASC,l.id ASC`,[comparison.id,req.auth.personId])).rows;
  res.json(looks);
}
