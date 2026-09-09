import Joi from 'joi';
import {pool,query} from '../config/db.js';
import {validate,uuid} from '../utils/validation.js';
import {HttpError} from '../utils/http.js';
import {authorizePersonal,authorizeCapability,grantBundle} from '../services/authorizationService.js';
const name=Joi.string().trim().min(2).max(160).required();
export async function create(req,res){
 const b=validate(Joi.object({name}),req.body);
 res.status(201).json((await query('INSERT INTO store_requests(person_id,name) VALUES($1,$2) RETURNING id,name,status',[req.auth.personId,b.name])).rows[0]);
}
export async function list(req,res){
 res.set('Cache-Control','private, no-store').json((await query('SELECT id,name,status,created_at FROM store_requests WHERE person_id=$1 ORDER BY created_at DESC',[req.auth.personId])).rows);
}
export async function submit(req,res){
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const r=(await client.query('SELECT * FROM store_requests WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
  authorizePersonal(req.auth,r);
  if(r.status!=='DRAFT')throw new HttpError(409,'Solicitação não está em rascunho');
  await client.query("UPDATE store_requests SET status='PENDING_REVIEW' WHERE id=$1",[r.id]);
  await client.query("INSERT INTO store_request_events(request_id,actor_person_id,from_status,to_status) VALUES($1,$2,'DRAFT','PENDING_REVIEW')",[r.id,req.auth.personId]);
  await client.query('COMMIT');res.status(202).json({id:r.id,status:'PENDING_REVIEW'});
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
export async function review(req,res){
 const b=validate(Joi.object({institutionId:uuid.required(),decision:Joi.string().valid('ACTIVE','REJECTED','SUSPENDED').required(),reason:Joi.string().trim().min(3).max(1000).required()}),req.body);
 const client=await pool.connect();
 try{
  await client.query('BEGIN');
  const institution=(await client.query("SELECT id FROM organizations WHERE id=$1 AND kind='INSTITUTIONAL' AND status='ACTIVE' FOR SHARE",[b.institutionId])).rows[0];
  if(!institution)throw new HttpError(403,'Contexto institucional necessário');
  await authorizeCapability(req.auth,b.institutionId,'store_requests.review',null,client);
  const r=(await client.query('SELECT * FROM store_requests WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
  if(!r)throw new HttpError(404,'Solicitação não encontrada');
  if(r.person_id===req.auth.personId)throw new HttpError(403,'Solicitante não pode revisar a própria loja');
  const allowed={PENDING_REVIEW:['ACTIVE','REJECTED'],ACTIVE:['SUSPENDED'],SUSPENDED:['ACTIVE','REJECTED']};
  if(!allowed[r.status]?.includes(b.decision))throw new HttpError(409,'Transição institucional inválida');
  let org=r.organization_id;
  if(b.decision==='ACTIVE'&&!org){
   org=(await client.query("INSERT INTO organizations(name,created_by_person_id,status) VALUES($1,$2,'ACTIVE') RETURNING id",[r.name,req.auth.personId])).rows[0].id;
   const account=(await client.query('SELECT id FROM accounts WHERE person_id=$1 AND status=\'ACTIVE\'',[r.person_id])).rows[0];
   if(!account)throw new HttpError(409,'Conta solicitante indisponível');
   await client.query('INSERT INTO stores(owner_user_id,organization_id,store_name,cnpj,description,social_links) VALUES($1,$2,$3,$4,$5,$6)',[account.id,org,r.name,r.details.cnpj||null,r.details.description||null,r.details.socialLinks||{}]);
   const m=(await client.query('INSERT INTO memberships(person_id,organization_id,created_by_person_id) VALUES($1,$2,$3) RETURNING id',[r.person_id,org,req.auth.personId])).rows[0];
   await grantBundle(client,m.id,'OWNER',req.auth.personId);
  }
  if(org)await client.query('UPDATE organizations SET status=$2 WHERE id=$1',[org,b.decision]);
  await client.query('UPDATE store_requests SET status=$2,organization_id=$3,reviewed_by_person_id=$4 WHERE id=$1',[r.id,b.decision,org,req.auth.personId]);
  await client.query('INSERT INTO store_request_events(request_id,actor_person_id,from_status,to_status,reason) VALUES($1,$2,$3,$4,$5)',[r.id,req.auth.personId,r.status,b.decision,b.reason]);
  await client.query('COMMIT');res.json({id:r.id,status:b.decision,organization_id:org});
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
