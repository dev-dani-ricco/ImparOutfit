import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import Joi from 'joi'; import { pool, query } from '../config/db.js'; import { HttpError } from '../utils/http.js';
const schema = Joi.object({ name:Joi.string().min(2).required(), email:Joi.string().email().required(), password:Joi.string().min(6).required(), profileType:Joi.string().valid('PERSON','STORE').required(), store:Joi.object({ storeName:Joi.string().min(2).required(), cnpj:Joi.string().allow('',null), description:Joi.string().allow('',null), socialLinks:Joi.object().default({}) }).optional() });
const sign = (u)=> jwt.sign({ id:u.id, profileType:u.profile_type, email:u.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
export async function register(req,res){
  const {value,error}=schema.validate(req.body); if(error) throw new HttpError(400,error.message);
  const client=await pool.connect();
  try { await client.query('BEGIN');
    const hash=await bcrypt.hash(value.password,10);
    const user=(await client.query('INSERT INTO users(name,email,password_hash,profile_type) VALUES($1,$2,$3,$4) RETURNING id,name,email,profile_type',[value.name,value.email,hash,value.profileType])).rows[0];
    if(value.profileType==='STORE'){
      if(!value.store) throw new HttpError(400,'Dados da loja obrigatórios');
      await client.query('INSERT INTO stores(owner_user_id,store_name,cnpj,description,social_links) VALUES($1,$2,$3,$4,$5)',[user.id,value.store.storeName,value.store.cnpj,value.store.description,value.store.socialLinks]);
    }
    await client.query('COMMIT'); res.status(201).json({ token:sign(user), user });
  } catch(e){ await client.query('ROLLBACK').catch(()=>{}); if(e.code==='23505') throw new HttpError(409,'E-mail já cadastrado'); throw e; }
  finally { client.release(); }
}
export async function login(req,res){ const {email,password}=req.body; const user=(await query('SELECT * FROM users WHERE email=$1',[email])).rows[0]; if(!user || !(await bcrypt.compare(password,user.password_hash))) throw new HttpError(401,'Credenciais inválidas'); res.json({ token:sign(user), user:{id:user.id,name:user.name,email:user.email,profile_type:user.profile_type} }); }
export async function me(req,res){ const user=(await query('SELECT id,name,email,profile_type,avatar_url,created_at FROM users WHERE id=$1',[req.user.id])).rows[0]; res.json(user); }
