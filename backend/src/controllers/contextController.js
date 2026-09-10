import Joi from 'joi';
import { query } from '../config/db.js';
import { validate } from '../utils/validation.js';
import { authorizePersonal } from '../services/authorizationService.js';

const provenance=Joi.string().valid('USER_DECLARED','IMAGE_INFERRED','SYSTEM_ESTIMATED','MERCHANT_DECLARED','EXPERT_VALIDATED').default('USER_DECLARED');
const optionalText=max=>Joi.string().trim().max(max).allow('',null);
const schema=Joi.object({
  occasion:optionalText(160),
  startsAt:Joi.date().iso().allow(null),
  locationText:optionalText(500),
  climateReference:optionalText(500),
  formality:optionalText(80),
  objective:optionalText(500),
  notes:optionalText(5000),
  provenance
});
const toContext=row=>({
  id:row.id,
  occasion:row.occasion,
  startsAt:row.starts_at,
  locationText:row.location_text,
  climateReference:row.climate_reference,
  formality:row.formality,
  objective:row.objective,
  notes:row.notes,
  provenance:row.provenance,
  createdAt:row.created_at
});

export async function create(req,res) {
  const body=validate(schema,req.body||{});
  const context=(await query(`INSERT INTO contexts(
    owner_person_id,occasion,starts_at,location_text,climate_reference,formality,objective,notes,provenance
  ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[
    req.auth.personId,body.occasion??null,body.startsAt??null,body.locationText??null,
    body.climateReference??null,body.formality??null,body.objective??null,body.notes??null,body.provenance
  ])).rows[0];
  res.status(201).json(toContext(context));
}

export async function linkLook(req,res) {
  const look=(await query('SELECT id,person_id,current_version_id FROM looks WHERE id=$1',[req.params.lookId])).rows[0];
  authorizePersonal(req.auth,look);
  const context=(await query('SELECT id,owner_person_id AS person_id FROM contexts WHERE id=$1',[req.params.contextId])).rows[0];
  authorizePersonal(req.auth,context);
  let link=(await query(`INSERT INTO look_contexts(look_id,context_id,owner_person_id)
    VALUES($1,$2,$3) ON CONFLICT(look_id,context_id) DO NOTHING RETURNING look_id,context_id,created_at`,[look.id,context.id,req.auth.personId])).rows[0];
  const created=Boolean(link);
  if(!link) link=(await query('SELECT look_id,context_id,created_at FROM look_contexts WHERE look_id=$1 AND context_id=$2 AND owner_person_id=$3',[look.id,context.id,req.auth.personId])).rows[0];
  res.status(created?201:200).json({lookId:link.look_id,contextId:link.context_id,linkedAt:link.created_at});
}
