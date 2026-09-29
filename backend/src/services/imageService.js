import { randomUUID, createHash } from 'node:crypto';
import { createStorage } from '../storage/index.js';
import { pool, query } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { authorizePersonal, authorizeCapability } from './authorizationService.js';

export const storage = createStorage();
export async function withMedia(files, auth, purpose, organizationId, work) {
  const prepared = [];
  const client = await pool.connect();
  try {
    for (const file of files) {
      if (!file.normalized) throw new Error('Upload was not validated');
      const id = randomUUID();
      const asset = { id, key: id + '.webp', ...file.normalized };
      await storage.put(asset.key, asset.buffer, asset.mime);
      prepared.push(asset);
    }
    await client.query('BEGIN');
    for (const asset of prepared) await client.query(`INSERT INTO media_assets(id,person_id,organization_id,purpose,storage_key,mime,bytes,sha256)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[asset.id,auth.personId,organizationId,purpose,asset.key,asset.mime,asset.buffer.length,createHash('sha256').update(asset.buffer).digest('hex')]);
    const result = await work(client, prepared.map(a=>a.id));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(()=>{});
    await Promise.allSettled(prepared.map(a=>storage.delete(a.key)));
    throw error;
  } finally { client.release(); }
}
export async function authorizedMedia(req) {
  const asset=(await query("SELECT * FROM media_assets WHERE id=$1 AND status='READY'",[req.params.id])).rows[0];
  if (!asset) throw new HttpError(404,'Mídia não encontrada');
  if (asset.purpose==='CATALOG') await authorizeCapability(req.auth,asset.organization_id,'store.read');
  else authorizePersonal(req.auth,asset);
  return asset;
}
export async function deliver(asset,res) {
  let buffer;
  try { buffer=await storage.get(asset.storage_key); } catch { throw new HttpError(404,'Mídia indisponível'); }
  res.set({'Content-Type':asset.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="image.webp"'}).send(buffer);
}
export async function readMedia(req,res) { return deliver(await authorizedMedia(req),res); }
export async function mediaAccess(req,res) {
  const asset=await authorizedMedia(req);
  const signed=await storage.getSignedReadUrl(asset.storage_key,{expiresIn:60});
  res.set('Cache-Control','no-store').json(signed ? {url:signed,expiresIn:60,requiresAuthorization:false} : {url:'/api/media/'+asset.id,expiresIn:null,requiresAuthorization:true});
}
export async function readCatalogMedia(req,res) {
  const asset=(await query(`SELECT m.* FROM media_assets m JOIN product_media pm ON pm.media_id=m.id
    JOIN products p ON p.id=pm.product_id JOIN stores s ON s.id=p.store_id
    JOIN organizations o ON o.id=s.organization_id AND o.status='ACTIVE'
    WHERE m.id=$1 AND p.id=$2 AND p.status='PUBLISHED' AND m.purpose='CATALOG' AND m.organization_id=s.organization_id AND m.status='READY'`,[req.params.mediaId,req.params.id])).rows[0];
  if (!asset) throw new HttpError(404,'Mídia não encontrada');
  return deliver(asset,res);
}
