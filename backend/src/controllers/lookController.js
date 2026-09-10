import Joi from 'joi';
import { pool, query } from '../config/db.js';
import { validate, uuid } from '../utils/validation.js';
import { authorizePersonal } from '../services/authorizationService.js';
import { HttpError } from '../utils/http.js';

const schema=Joi.object({title:Joi.string().min(1).max(160).required(),items:Joi.array().min(1).max(30).items(Joi.object({
  kind:Joi.string().valid('OWNED_ITEM','COMMERCIAL_PREVIEW','SPONSORED_PREVIEW').required(),
  wardrobeItemId:uuid,productId:uuid,
}).xor('wardrobeItemId','productId')).required()});
const variationSchema=Joi.object({
  sourceLookVersionId:uuid.required(),
  name:Joi.string().trim().min(1).max(160).optional()
});
async function version(req,res,existing=false) {
  const b=validate(schema,req.body), client=await pool.connect();
  try {
    await client.query('BEGIN');
    let look;
    if(existing) {
      look=(await client.query('SELECT id,person_id FROM looks WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
      authorizePersonal(req.auth,look);
      await client.query('UPDATE looks SET title=$2 WHERE id=$1',[look.id,b.title]);
    } else {
      look=(await client.query('INSERT INTO looks(user_id,person_id,title,is_public) VALUES($1,$2,$3,false) RETURNING id',[req.auth.accountId,req.auth.personId,b.title])).rows[0];
    }
    const next=(await client.query('SELECT COALESCE(max(version),0)+1 AS next FROM look_versions WHERE look_id=$1',[look.id])).rows[0].next;
    const parent=existing?(await client.query('SELECT current_version_id FROM looks WHERE id=$1',[look.id])).rows[0].current_version_id:null;
    const v=(await client.query('INSERT INTO look_versions(look_id,person_id,version,parent_version_id,created_by_person_id) VALUES($1,$2,$3,$4,$2) RETURNING id,version',[look.id,req.auth.personId,next,parent])).rows[0];
    for(const [position,item] of b.items.entries()) {
      if(item.kind==='OWNED_ITEM') {
        if(!item.wardrobeItemId || item.productId) throw new HttpError(400,'OWNED_ITEM exige peça possuída');
        authorizePersonal(req.auth,(await client.query('SELECT person_id FROM wardrobe_items WHERE id=$1',[item.wardrobeItemId])).rows[0]);
      } else {
        if(!item.productId || item.wardrobeItemId) throw new HttpError(400,'Preview exige produto comercial');
        if(!(await client.query("SELECT id FROM products WHERE id=$1 AND status='PUBLISHED'",[item.productId])).rows[0]) throw new HttpError(404,'Produto não encontrado');
      }
      await client.query('INSERT INTO look_items(look_version_id,person_id,kind,wardrobe_item_id,product_id,position) VALUES($1,$2,$3,$4,$5,$6)',[v.id,req.auth.personId,item.kind,item.wardrobeItemId||null,item.productId||null,position]);
    }
    await client.query("UPDATE looks SET current_version_id=$2,status='ACTIVE' WHERE id=$1",[look.id,v.id]);await client.query('COMMIT');
    res.status(201).json({id:look.id,versionId:v.id,version:v.version,items:b.items});
  } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
export const create=(req,res)=>version(req,res);
export const addVersion=(req,res)=>version(req,res,true);
export async function createLookVariation({personId,sourceLookVersionId,name}={}) {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const source=(await client.query(`SELECT v.id,v.look_id,v.person_id,v.version,l.user_id,l.title
      FROM look_versions v JOIN looks l ON l.id=v.look_id WHERE v.id=$1 FOR UPDATE`,[sourceLookVersionId])).rows[0];
    authorizePersonal({personId},source);
    const items=(await client.query(`SELECT kind,wardrobe_item_id,product_id,position
      FROM look_items WHERE look_version_id=$1 ORDER BY position FOR SHARE`,[source.id])).rows;
    const resulting=(await client.query(`INSERT INTO looks(user_id,person_id,title,is_public,status)
      VALUES($1,$2,$3,false,'ACTIVE') RETURNING id`,[source.user_id,personId,name||source.title])).rows[0];
    const resultingVersion=(await client.query(`INSERT INTO look_versions(look_id,person_id,version,created_by_person_id)
      VALUES($1,$2,1,$2) RETURNING id`,[resulting.id,personId])).rows[0];
    for(const item of items) await client.query(`INSERT INTO look_items(look_version_id,person_id,kind,wardrobe_item_id,product_id,position)
      VALUES($1,$2,$3,$4,$5,$6)`,[resultingVersion.id,personId,item.kind,item.wardrobe_item_id,item.product_id,item.position]);
    await client.query('UPDATE looks SET current_version_id=$2 WHERE id=$1',[resulting.id,resultingVersion.id]);
    const variation=(await client.query(`INSERT INTO look_variations(owner_person_id,source_look_id,source_look_version_id,resulting_look_id,name)
      VALUES($1,$2,$3,$4,$5) RETURNING id`,[personId,source.look_id,source.id,resulting.id,name||null])).rows[0];
    await client.query('COMMIT');
    return {variationId:variation.id,sourceLookId:source.look_id,sourceLookVersionId:source.id,resultingLookId:resulting.id,resultingLookVersionId:resultingVersion.id};
  } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
export async function createVariation(req,res) {
  const body=validate(variationSchema,req.body);
  const source=(await query('SELECT id,look_id,person_id FROM look_versions WHERE id=$1',[body.sourceLookVersionId])).rows[0];
  authorizePersonal(req.auth,source);
  if(source.look_id!==req.params.id) throw new HttpError(404,'Recurso não encontrado');
  res.status(201).json(await createLookVariation({
    personId:req.auth.personId,
    sourceLookVersionId:body.sourceLookVersionId,
    name:body.name
  }));
}
export async function list(req,res) {
  res.json((await query('SELECT id,title,created_at FROM looks WHERE person_id=$1 ORDER BY created_at DESC',[req.auth.personId])).rows);
}
export async function get(req,res) {
  const look=(await query('SELECT id,person_id,title,created_at FROM looks WHERE id=$1',[req.params.id])).rows[0];
  authorizePersonal(req.auth,look);
  const versions=(await query(`SELECT v.id,v.version,v.created_at,COALESCE(jsonb_agg(jsonb_build_object(
    'kind',i.kind,'wardrobeItemId',i.wardrobe_item_id,'productId',i.product_id,'position',i.position) ORDER BY i.position) FILTER(WHERE i.id IS NOT NULL),'[]') items
    FROM look_versions v LEFT JOIN look_items i ON i.look_version_id=v.id WHERE v.look_id=$1 GROUP BY v.id ORDER BY v.version DESC`,[look.id])).rows;
  res.json({...look,versions});
}
