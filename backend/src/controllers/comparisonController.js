import Joi from 'joi';
import { query } from '../config/db.js';
import { validate } from '../utils/validation.js';

const schema=Joi.object({name:Joi.string().trim().max(160).empty('').allow(null).default(null)});

export async function create(req,res) {
  const body=validate(schema,req.body||{});
  const comparison=(await query('INSERT INTO comparisons(owner_person_id,name) VALUES($1,$2) RETURNING id,name,created_at',[req.auth.personId,body.name])).rows[0];
  res.status(201).json({id:comparison.id,name:comparison.name,createdAt:comparison.created_at});
}
