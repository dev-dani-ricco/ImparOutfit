import Joi from 'joi';
import { query } from '../config/db.js';
import { validate } from '../utils/validation.js';

const schema=Joi.object({
  name:Joi.string().trim().min(1).max(160).required(),
  description:Joi.string().trim().max(2000).allow('',null)
});
const toCollection=row=>({id:row.id,name:row.name,description:row.description,createdAt:row.created_at});

export async function create(req,res) {
  const body=validate(schema,req.body);
  const collection=(await query(`INSERT INTO collections(owner_person_id,name,description)
    VALUES($1,$2,$3) RETURNING id,name,description,created_at`,[req.auth.personId,body.name,body.description??null])).rows[0];
  res.status(201).json(toCollection(collection));
}
