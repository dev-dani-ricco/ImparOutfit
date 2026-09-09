import Joi from 'joi';
import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { validate, itemSchema } from '../utils/validation.js';
import { withMedia } from '../services/imageService.js';
import { authorizeCapability } from '../services/authorizationService.js';

const publicColumns='id,store_name,description,banner_url,logo_url,social_links,created_at';
export async function myStore(req,res) {
  const row=(await query(`SELECT s.*,
    (SELECT count(*)::int FROM products p WHERE p.store_id=s.id AND p.status='PUBLISHED') pieces,
    (SELECT count(*)::int FROM follows f WHERE f.store_id=s.id) followers,
    (SELECT count(*)::int FROM commercial_saved_items sv JOIN products p ON p.id=sv.product_id WHERE p.store_id=s.id) saves
    FROM stores s WHERE s.id=$1`,[req.context.storeId])).rows[0];
  res.json(row);
}
export async function updateStore(req,res) {
  const b=validate(Joi.object({storeName:Joi.string().min(2).max(160),description:Joi.string().max(2000).allow('',null)}).min(1),req.body);
  const row=(await query('UPDATE stores SET store_name=COALESCE($2,store_name),description=CASE WHEN $4 THEN $3 ELSE description END WHERE id=$1 RETURNING '+publicColumns,[req.context.storeId,b.storeName,b.description,Object.hasOwn(b,'description')])).rows[0];
  res.json(row);
}
export async function listStores(_req,res) { res.json((await query('SELECT '+publicColumns+" FROM stores WHERE organization_id IN (SELECT id FROM organizations WHERE status='ACTIVE') ORDER BY created_at DESC LIMIT 100")).rows); }
export async function getStore(req,res) {
  const row=(await query('SELECT '+publicColumns+' FROM stores WHERE id=$1 AND organization_id IN (SELECT id FROM organizations WHERE status=\'ACTIVE\')',[req.params.id])).rows[0];
  if(!row) throw new HttpError(404,'Loja não encontrada');
  res.json(row);
}
export async function createStoreItems(req,res) {
  const b=validate(itemSchema,req.body);
  const row=await withMedia(req.files||[],req.auth,'CATALOG',req.context.organizationId,async(client,ids)=>{
    await authorizeCapability(req.auth,req.context.organizationId,'catalog.write',req.context.storeId,client);
    const item=(await client.query(`INSERT INTO products(store_id,created_by_person_id,name,category,color,sizes,price,purchase_link)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,store_id,name,category,created_at`,[req.context.storeId,req.auth.personId,b.name,b.category,b.color,b.sizes?b.sizes.split(','):[],b.price||null,b.purchaseLink])).rows[0];
    for(const id of ids) await client.query('INSERT INTO product_media(product_id,media_id) VALUES($1,$2)',[item.id,id]);
    return {...item,kind:'COMMERCIAL_PREVIEW',image_urls:ids.map(id=>'/api/products/'+item.id+'/media/'+id)};
  });
  res.status(201).json(row);
}
export async function storeEngagement(req,res) {
  res.json((await query(`SELECT p.id product_id,p.name,count(s.id)::int saves FROM products p
    LEFT JOIN commercial_saved_items s ON s.product_id=p.id WHERE p.store_id=$1 GROUP BY p.id ORDER BY saves DESC`,[req.context.storeId])).rows);
}
