import Joi from 'joi';
import { query } from '../config/db.js';
import { withMedia } from '../services/imageService.js';
import { requireWardrobeSlot } from '../services/wardrobePlanService.js';
import { authorizePersonal } from '../services/authorizationService.js';
import { validate, itemSchema } from '../utils/validation.js';
import { HttpError } from '../utils/http.js';

export const productSelect = `SELECT p.id,p.store_id,p.name,p.category,p.color,p.sizes,p.price,p.purchase_link,p.created_at,
  'COMMERCIAL_PREVIEW' AS kind,
  COALESCE((SELECT array_agg('/api/products/'||p.id||'/media/'||pm.media_id) FROM product_media pm WHERE pm.product_id=p.id),p.legacy_image_urls) image_urls
  FROM products p`;
export const wardrobeSelect = `SELECT w.*,COALESCE((SELECT array_agg('/api/media/'||wm.media_id) FROM wardrobe_media wm WHERE wm.wardrobe_item_id=w.id),'{}') image_urls
  FROM wardrobe_items w`;
export async function listItems(req,res) {
  if(req.query.mine==='true' || req.query.mine==='1') {
    if(!req.auth) throw new HttpError(401,'Autenticação necessária');
    return listWardrobe(req,res);
  }
  return res.json((await query(productSelect+" WHERE p.status='PUBLISHED' AND ($1::uuid IS NULL OR p.store_id=$1) ORDER BY p.created_at DESC LIMIT 100",[req.query.storeId||null])).rows);
}
export async function listWardrobe(req,res) {
  res.set('Cache-Control','private, no-store').json((await query(wardrobeSelect+' WHERE w.person_id=$1 ORDER BY w.created_at DESC',[req.auth.personId])).rows);
}
export async function getWardrobeItem(req,res) {
  const row=(await query(wardrobeSelect+' WHERE w.id=$1',[req.params.id])).rows[0];
  authorizePersonal(req.auth,row);
  res.set('Cache-Control','private, no-store').json(row);
}
export async function createWardrobeItem(req,res) {
  const b=validate(itemSchema.keys({
    ownershipSource:Joi.string().valid('MANUAL_CATALOG','REAL_CAPTURE').required(),
    ownershipAttested:Joi.boolean().valid(true).required(),
  }).fork(['price','purchaseLink'],s=>s.forbidden()),req.body);
  if(b.ownershipSource==='REAL_CAPTURE' && !req.files?.length) throw new HttpError(400,'Captura real exige uma foto');
  const item=await withMedia(req.files||[],req.auth,'WARDROBE',null,async(client,mediaIds)=>{
    await requireWardrobeSlot(req.auth.accountId,client);
    const event=(await client.query(`INSERT INTO ownership_events(person_id,source,recorded_by_person_id,attested_at,evidence_media_id)
      VALUES($1,$2,$1,now(),$3) RETURNING id`,[req.auth.personId,b.ownershipSource,mediaIds[0]||null])).rows[0];
    const row=(await client.query(`INSERT INTO wardrobe_items(person_id,ownership_event_id,name,category,color,sizes)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[req.auth.personId,event.id,b.name,b.category,b.color,b.sizes?b.sizes.split(','):[]])).rows[0];
    for(const id of mediaIds) await client.query('INSERT INTO wardrobe_media(wardrobe_item_id,media_id) VALUES($1,$2)',[row.id,id]);
    return {...row,image_urls:mediaIds.map(id=>'/api/media/'+id)};
  });
  res.status(201).json(item);
}
export async function saveProduct(req,res) {
  const b=validate(Joi.object({kind:Joi.string().valid('COMMERCIAL_PREVIEW','SPONSORED_PREVIEW').default('COMMERCIAL_PREVIEW')}),req.body||{});
  const row=(await query(`INSERT INTO commercial_saved_items(person_id,product_id,kind)
    SELECT $1,id,$3 FROM products WHERE id=$2 AND status='PUBLISHED'
    ON CONFLICT(person_id,product_id) DO UPDATE SET product_id=EXCLUDED.product_id RETURNING id,product_id,kind,created_at`,[req.auth.personId,req.params.id,b.kind])).rows[0];
  if(!row) throw new HttpError(404,'Produto não encontrado');
  res.status(201).json(row);
}
export async function listSaves(req,res) {
  res.set('Cache-Control','private, no-store').json((await query(`SELECT s.id,s.product_id,s.kind,s.created_at,p.name,p.store_id
    FROM commercial_saved_items s JOIN products p ON p.id=s.product_id WHERE s.person_id=$1 ORDER BY s.created_at DESC`,[req.auth.personId])).rows);
}
export async function removeSave(req,res) {
  await query('DELETE FROM commercial_saved_items WHERE person_id=$1 AND product_id=$2',[req.auth.personId,req.params.id]);
  res.status(204).end();
}
export async function legacyCopy(_req,res) {
  res.set('Deprecation','true').status(410).json({error:'Cópia para o armário removida. Salve como referência comercial.',code:'OWNERSHIP_NOT_IMPLIED',replacement:'POST /api/products/{id}/save'});
}
export async function legacyReviews(req,res) {
  res.json((await query(`SELECT r.legacy_item_id,r.reason,r.status,i.name,i.category FROM legacy_item_reviews r
    JOIN items i ON i.id=r.legacy_item_id WHERE r.person_id=$1`,[req.auth.personId])).rows);
}
