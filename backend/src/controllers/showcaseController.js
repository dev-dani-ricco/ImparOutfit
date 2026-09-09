import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { validate, uuid } from '../utils/validation.js';
import { authorizeCapability } from '../services/authorizationService.js';

export async function createShowcase(req,res) {
  const b=validate(Joi.object({title:Joi.string().min(1).max(160).required(),description:Joi.string().max(2000).allow('',null),
    itemIds:Joi.array().items(uuid).unique().max(100).default([]),startsAt:Joi.date().iso().allow(null),endsAt:Joi.date().iso().allow(null)}),req.body);
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await authorizeCapability(req.auth,req.context.organizationId,'marketing.write',req.context.storeId,client);
    const products=(await client.query("SELECT id FROM products WHERE id=ANY($1::uuid[]) AND store_id=$2 AND status='PUBLISHED' FOR SHARE",[b.itemIds,req.context.storeId])).rows;
    if(products.length!==b.itemIds.length) throw new HttpError(403,'Vitrine exige produtos publicados deste contexto');
    const sh=(await client.query('INSERT INTO showcases(store_id,title,description,starts_at,ends_at) VALUES($1,$2,$3,$4,$5) RETURNING id,store_id,title,description,created_at',[req.context.storeId,b.title,b.description,b.startsAt,b.endsAt])).rows[0];
    for(const p of products) await client.query('INSERT INTO showcase_products(showcase_id,product_id,store_id) VALUES($1,$2,$3)',[sh.id,p.id,req.context.storeId]);
    await client.query('COMMIT');
    res.status(201).json({...sh,item_ids:b.itemIds});
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
export async function listShowcases(req,res) {
  res.json((await query(`SELECT sh.id,sh.store_id,sh.title,sh.description,sh.starts_at,sh.ends_at,sh.created_at,s.store_name,
    COALESCE(array_agg(sp.product_id) FILTER(WHERE sp.product_id IS NOT NULL),'{}') item_ids
    FROM showcases sh JOIN stores s ON s.id=sh.store_id LEFT JOIN showcase_products sp ON sp.showcase_id=sh.id
    WHERE ($1::uuid IS NULL OR sh.store_id=$1) GROUP BY sh.id,s.id ORDER BY sh.created_at DESC LIMIT 100`,[req.query.storeId||null])).rows);
}
