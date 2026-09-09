import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { validate } from '../utils/validation.js';
import { grantBundle } from '../services/authorizationService.js';

const password = Joi.string().min(10).max(72).custom((value, helpers) => Buffer.byteLength(value) > 72 ? helpers.error('any.invalid') : value);
const schema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(), email: Joi.string().trim().lowercase().email().max(254).required(),
  password: password.required(), profileType: Joi.string().valid('PERSON','STORE').default('PERSON'),
  store: Joi.object({ storeName: Joi.string().min(2).max(160).required(), cnpj: Joi.string().max(30).allow('',null), description: Joi.string().max(2000).allow('',null), socialLinks: Joi.object().default({}) }),
});
const sign = account => jwt.sign({ ver: account.token_version }, process.env.JWT_SECRET, {
  algorithm: 'HS256', subject: account.id, issuer: 'universo-impar', audience: 'universo-impar-app', expiresIn: '1h',
});
export async function identity(accountId, db = { query }) {
  const user = (await db.query(`SELECT u.id,p.id person_id,p.display_name name,u.email,u.profile_type,u.wardrobe_plan
    FROM accounts a JOIN users u ON u.id=a.id JOIN persons p ON p.id=a.person_id WHERE a.id=$1`, [accountId])).rows[0];
  if (!user) throw new HttpError(401,'Conta indisponível');
  user.contexts = (await db.query(`SELECT m.id membership_id,m.organization_id,s.id store_id,s.store_name,
    COALESCE(array_agg(DISTINCT g.capability_code) FILTER (WHERE g.id IS NOT NULL AND g.resource_id IS NULL),'{}') capabilities
    FROM memberships m JOIN stores s ON s.organization_id=m.organization_id
    LEFT JOIN grants g ON g.membership_id=m.id AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>now())
    WHERE m.person_id=$1 AND m.status='ACTIVE' GROUP BY m.id,s.id`, [user.person_id])).rows;
  return user;
}
export async function register(req,res) {
  const value=validate(schema,req.body);
  if(value.profileType==='STORE' && !value.store) throw new HttpError(400,'Dados da loja obrigatórios');
  const hash=await bcrypt.hash(value.password,12);
  const client=await pool.connect();
  let user, account;
  try {
    await client.query('BEGIN');
    user=(await client.query('INSERT INTO users(name,email,password_hash,profile_type) VALUES($1,$2,$3,$4) RETURNING id',[value.name,value.email,hash,value.profileType])).rows[0];
    const person=(await client.query('INSERT INTO persons(display_name) VALUES($1) RETURNING id',[value.name])).rows[0];
    account=(await client.query('INSERT INTO accounts(id,person_id) VALUES($1,$2) RETURNING *',[user.id,person.id])).rows[0];
    await client.query("INSERT INTO identifiers(person_id,kind,value) VALUES($1,'EMAIL',$2)",[person.id,value.email]);
    await client.query('INSERT INTO customer_profiles(user_id) VALUES($1)',[user.id]);
    await client.query("INSERT INTO person_entitlements(person_id,plan_id,source) SELECT $1,id,'INITIAL_ACCESS' FROM plans WHERE is_default",[person.id]);
    if(value.store) {
      // Legacy self-service onboarding retained. Every registrant is also a person/customer.
      const org=(await client.query('INSERT INTO organizations(name,created_by_person_id) VALUES($1,$2) RETURNING id',[value.store.storeName,person.id])).rows[0];
      await client.query('INSERT INTO stores(owner_user_id,organization_id,store_name,cnpj,description,social_links) VALUES($1,$2,$3,$4,$5,$6)',[user.id,org.id,value.store.storeName,value.store.cnpj,value.store.description,value.store.socialLinks]);
      const member=(await client.query('INSERT INTO memberships(person_id,organization_id,created_by_person_id) VALUES($1,$2,$1) RETURNING id',[person.id,org.id])).rows[0];
      await grantBundle(client,member.id,'OWNER',person.id);
    }
    user=await identity(user.id,client);
    await client.query('COMMIT');
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  res.status(201).json({token:sign(account),user});
}
export async function login(req,res) {
  const value=validate(Joi.object({email:Joi.string().trim().lowercase().email().required(),password:Joi.string().max(256).required()}),req.body);
  const row=(await query(`SELECT u.password_hash,a.* FROM users u JOIN accounts a ON a.id=u.id
    WHERE lower(trim(u.email))=$1 AND a.status='ACTIVE'`,[value.email])).rows[0];
  if(!row || !(await bcrypt.compare(value.password,row.password_hash))) throw new HttpError(401,'Credenciais inválidas');
  res.json({token:sign(row),user:await identity(row.id)});
}
export async function me(req,res) { res.json(await identity(req.auth.accountId)); }
export async function logout(req,res) {
  await query('UPDATE accounts SET token_version=token_version+1 WHERE id=$1',[req.auth.accountId]);
  res.status(204).end();
}
