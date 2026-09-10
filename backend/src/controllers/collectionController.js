import Joi from 'joi';
import { query } from '../config/db.js';
import { validate } from '../utils/validation.js';
import { authorizePersonal } from '../services/authorizationService.js';

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

export async function linkLook(req,res) {
  const collection=(await query('SELECT id,owner_person_id AS person_id FROM collections WHERE id=$1',[req.params.collectionId])).rows[0];
  authorizePersonal(req.auth,collection);
  const look=(await query('SELECT id,person_id,current_version_id FROM looks WHERE id=$1',[req.params.lookId])).rows[0];
  authorizePersonal(req.auth,look);
  let link=(await query(`INSERT INTO collection_looks(collection_id,look_id,owner_person_id)
    VALUES($1,$2,$3) ON CONFLICT(collection_id,look_id) DO NOTHING RETURNING collection_id,look_id,created_at`,[collection.id,look.id,req.auth.personId])).rows[0];
  const created=Boolean(link);
  if(!link) link=(await query('SELECT collection_id,look_id,created_at FROM collection_looks WHERE collection_id=$1 AND look_id=$2 AND owner_person_id=$3',[collection.id,look.id,req.auth.personId])).rows[0];
  res.status(created?201:200).json({collectionId:link.collection_id,lookId:link.look_id,linkedAt:link.created_at});
}
