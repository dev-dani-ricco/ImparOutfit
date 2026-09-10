import Joi from 'joi';
import { query } from '../config/db.js';
import { validate } from '../utils/validation.js';

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
