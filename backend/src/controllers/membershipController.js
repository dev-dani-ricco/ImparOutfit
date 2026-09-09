import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { validate, uuid } from '../utils/validation.js';
import { HttpError } from '../utils/http.js';
import { grantBundle, authorizeCapability } from '../services/authorizationService.js';

export async function list(req,res) {
  res.json((await query(`SELECT m.id,m.person_id,m.status,COALESCE(array_agg(g.capability_code) FILTER(WHERE g.id IS NOT NULL),'{}') capabilities
    FROM memberships m LEFT JOIN grants g ON g.membership_id=m.id AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now())
    WHERE m.organization_id=$1 GROUP BY m.id`,[req.context.organizationId])).rows);
}
export async function assign(req,res) {
  const b=validate(Joi.object({personId:uuid.required(),bundle:Joi.string().max(40).required()}),req.body);
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM organizations WHERE id=$1 FOR UPDATE',[req.context.organizationId]);
    await authorizeCapability(req.auth,req.context.organizationId,'members.manage',req.context.storeId,client);
    const m=(await client.query(`INSERT INTO memberships(person_id,organization_id,created_by_person_id) VALUES($1,$2,$3)
      ON CONFLICT(person_id,organization_id) DO UPDATE SET status='ACTIVE' RETURNING id`,[b.personId,req.context.organizationId,req.auth.personId])).rows[0];
    // Replacement is explicit: stale grants are revoked rather than accidentally accumulated.
    await client.query('UPDATE grants SET revoked_at=now() WHERE membership_id=$1 AND revoked_at IS NULL',[m.id]);
    await grantBundle(client,m.id,b.bundle,req.auth.personId);
    await ensureAdministrator(client,req.context.organizationId);
    await client.query('COMMIT');
    res.status(201).json({membershipId:m.id});
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
async function ensureAdministrator(db,org) {
  const row=(await db.query(`SELECT g.id FROM memberships m JOIN grants g ON g.membership_id=m.id
    WHERE m.organization_id=$1 AND m.status='ACTIVE' AND g.capability_code='members.manage' AND g.resource_id IS NULL
    AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now()) LIMIT 1`,[org])).rows[0];
  if(!row) throw new HttpError(409,'O contexto precisa manter capacidade de gerir membros');
}
export async function revoke(req,res) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT id FROM organizations WHERE id=$1 FOR UPDATE',[req.context.organizationId]);
    await authorizeCapability(req.auth,req.context.organizationId,'members.manage',req.context.storeId,client);
    const m=(await client.query("UPDATE memberships SET status='REVOKED' WHERE id=$1 AND organization_id=$2 RETURNING id",[req.params.membershipId,req.context.organizationId])).rows[0];
    if(!m) throw new HttpError(404,'Membro não encontrado');
    await client.query('UPDATE grants SET revoked_at=now() WHERE membership_id=$1 AND revoked_at IS NULL',[m.id]);
    await ensureAdministrator(client,req.context.organizationId);
    await client.query('COMMIT');
    res.status(204).end();
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
export async function requestStore(req,res) {
  const b=validate(Joi.object({name:Joi.string().trim().min(2).max(160).required()}),req.body);
  const row=(await query('INSERT INTO store_requests(person_id,name) VALUES($1,$2) RETURNING id,status,created_at',[req.auth.personId,b.name])).rows[0];
  res.status(202).json(row);
}
