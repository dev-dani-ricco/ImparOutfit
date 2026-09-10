import Joi from 'joi';
import { query } from '../config/db.js';
import { validate } from '../utils/validation.js';
import { authorizePersonal } from '../services/authorizationService.js';
import { HttpError } from '../utils/http.js';

const schema=Joi.object({name:Joi.string().trim().max(160).empty('').allow(null).default(null)});

export async function create(req,res) {
  const body=validate(schema,req.body||{});
  const comparison=(await query('INSERT INTO comparisons(owner_person_id,name) VALUES($1,$2) RETURNING id,name,created_at',[req.auth.personId,body.name])).rows[0];
  res.status(201).json({id:comparison.id,name:comparison.name,createdAt:comparison.created_at});
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
