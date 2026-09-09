import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import request from 'supertest';
import sharp from 'sharp';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pool } from '../src/config/db.js';
import { migrate } from '../src/db/migrate.js';
import { authorizeCapability } from '../src/services/authorizationService.js';

process.env.JWT_SECRET=randomBytes(48).toString('hex');
process.env.MEDIA_ROOT=await mkdtemp(join(tmpdir(),'impar-media-test-'));
const {createApp}=await import('../src/app.js');
let db,app,A,B,storeA,storeB,marketing,product,owned,look;
const password='synthetic-password-2026';
const auth=(method,path,user)=>request(app)[method]('/api'+path).auth(user.token,{type:'bearer'});
async function register(label,store=false) {
  const b={name:label,email:label+'@example.com',password,...(store?{profileType:'STORE',store:{storeName:label}}:{})};
  const r=await request(app).post('/api/auth/register').send(b).expect(201);
  return r.body;
}
before(async()=>{
  db=new PGlite({extensions:{pgcrypto}});
  await migrate(db);
  pool.query=db.query.bind(db);
  pool.connect=async()=>({query:db.query.bind(db),release(){}});
  app=createApp();
  A=await register('client-a'); B=await register('client-b');
  storeA=await register('store-a',true);storeB=await register('store-b',true);marketing=await register('marketing');
});
after(async()=>{await db?.close();await pool.end();await rm(process.env.MEDIA_ROOT,{recursive:true,force:true});});

test('migrations apply cleanly, rerun deterministically and refuse unsafe rollback',async()=>{
  const count=(await readdir(new URL('../sql/',import.meta.url))).filter(n=>/^\d{3}_.*\.sql$/.test(n)&&!n.endsWith('.down.sql')).length;
  assert.equal((await migrate(db)).length,count);
  await assert.rejects(()=>migrate(db,{down:true}),/No safe down/);
  assert.equal((await migrate(db)).length,count);
});
test('entitlements remove legacy 50 cap and enforce database-configured limits',async()=>{
  await db.exec('BEGIN');
  try {
    for(let i=0;i<51;i++) {
      const e=(await db.query("INSERT INTO ownership_events(person_id,source,recorded_by_person_id,attested_at) VALUES($1,'MANUAL_CATALOG',$1,now()) RETURNING id",[A.user.person_id])).rows[0];
      await db.query("INSERT INTO wardrobe_items(person_id,ownership_event_id,name,category) VALUES($1,$2,'Synthetic','tops')",[A.user.person_id,e.id]);
    }
    assert.equal((await auth('get','/wardrobe/capacity',A)).body.limit,null);
    await db.query("UPDATE plan_limits SET limit_value=3 WHERE plan_id='FREE'");
    await auth('post','/wardrobe/items',A).send({name:'Denied',category:'tops',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}).expect(409);
  } finally {await db.exec('ROLLBACK');}
});
test('B: person/customer and store membership coexist; account claim contains no global role authority',async()=>{
  assert.ok(storeA.user.person_id);
  assert.ok(storeA.user.contexts[0].capabilities.includes('catalog.write'));
  const claims=JSON.parse(Buffer.from(storeA.token.split('.')[1],'base64url'));
  assert.equal(claims.profileType,undefined);
  await auth('get','/profile',storeA).expect(200);
  await auth('get','/wardrobe/items',storeA).expect(200,[]);
  await auth('get','/stores/me',storeA).expect(200);
});
test('A/G: private wardrobe and look reads conceal other persons; unauthenticated resources return 401',async()=>{
  owned=(await auth('post','/wardrobe/items',A).send({name:'Real shirt',category:'tops',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}).expect(201)).body;
  assert.equal(owned.kind,'OWNED_ITEM');
  await auth('get','/wardrobe/items/'+owned.id,A).expect(200);
  await auth('get','/wardrobe/items/'+owned.id,B).expect(404);
  await auth('get','/wardrobe/items',B).expect(200,[]);
  await request(app).get('/api/wardrobe/items/'+owned.id).expect(401);
  await auth('post','/wardrobe/items',A).send({name:'No attestation',category:'tops'}).expect(400);
  await auth('post','/wardrobe/items',A).send({name:'Fake purchase',category:'tops',ownershipSource:'VERIFIED_PURCHASE',ownershipAttested:true}).expect(400);
});
test('C/D: store scope checked; MARKETING cannot edit catalog, store administration or grants',async()=>{
  const a=storeA.user.contexts[0],b=storeB.user.contexts[0];
  await auth('put','/stores/me',storeA).set('X-Organization-Id',b.organization_id).send({storeName:'Forbidden'}).expect(403);
  await auth('post','/stores/'+a.store_id+'/memberships',storeA).send({personId:marketing.user.person_id,bundle:'MARKETING'}).expect(201);
  await auth('post','/stores/items',marketing).send({name:'Forbidden',category:'tops'}).expect(403);
  await auth('put','/stores/me',marketing).send({storeName:'Forbidden'}).expect(403);
  await auth('post','/stores/'+a.store_id+'/memberships',marketing).send({personId:B.user.person_id,bundle:'ADMIN'}).expect(403);
  product=(await auth('post','/stores/items',storeA).send({name:'Commercial shirt',category:'tops'}).expect(201)).body;
  await auth('post','/showcases',marketing).send({title:'Allowed campaign',itemIds:[product.id]}).expect(201);
  const other=(await auth('post','/stores/items',storeB).send({name:'Other catalog',category:'tops'}).expect(201)).body;
  await auth('post','/showcases',marketing).send({title:'Forbidden cross-store',itemIds:[other.id]}).expect(403);
  await auth('post','/showcases',marketing).send({title:'Forbidden personal',itemIds:[owned.id]}).expect(403);
});
test('E/F: save/preview does not create ownership or use wardrobe capacity; mixed look is private',async()=>{
  const before=(await auth('get','/wardrobe/capacity',A).expect(200)).body.used;
  const saved=(await auth('post','/products/'+product.id+'/save',A).send({}).expect(201)).body;
  assert.equal(saved.kind,'COMMERCIAL_PREVIEW');
  await auth('post','/products/'+product.id+'/save',A).send({}).expect(201);
  assert.equal((await auth('get','/commercial-saves',A).expect(200)).body.length,1);
  await auth('get','/commercial-saves',B).expect(200,[]);
  await auth('post','/items/'+product.id+'/copy-to-wardrobe',A).send({}).expect(410);
  look=(await auth('post','/looks',A).send({title:'Mixed preview',items:[
    {kind:'OWNED_ITEM',wardrobeItemId:owned.id},{kind:'COMMERCIAL_PREVIEW',productId:product.id},{kind:'SPONSORED_PREVIEW',productId:product.id}
  ]}).expect(201)).body;
  assert.equal((await auth('get','/wardrobe/capacity',A).expect(200)).body.used,before);
  assert.equal((await db.query('SELECT count(*)::int n FROM ownership_events')).rows[0].n,1);
  await auth('get','/looks/'+look.id,B).expect(404);
  await auth('post','/looks',B).send({title:'Foreign item',items:[{kind:'OWNED_ITEM',wardrobeItemId:owned.id}]}).expect(404);
  await auth('post','/looks',A).send({title:'Product as owned',items:[{kind:'OWNED_ITEM',productId:product.id}]}).expect(400);
  const v=(await auth('post','/looks/'+look.id+'/versions',A).send({title:'Version 2',items:[{kind:'COMMERCIAL_PREVIEW',productId:product.id}]}).expect(201)).body;
  assert.equal(v.version,2);
  assert.equal((await auth('get','/looks/'+look.id,A).expect(200)).body.versions.length,2);
});
test('private profile and media remain authorized; spoofed images fail and public route cannot expose them',async()=>{
  await auth('put','/profile',A).send({age:30,waist:70}).expect(200);
  assert.equal((await auth('get','/profile',B)).body.age,null);
  assert.equal((await auth('put','/profile',A).send({waist:null}).expect(200)).body.waist,null);
  await auth('put','/profile',A).send({hairStyle:'Longo'}).expect(200);
  assert.equal((await auth('put','/profile',A).send({hairStyle:null}).expect(200)).body.avatarConfig.hairStyle,undefined);
  const png=await sharp({create:{width:3,height:3,channels:3,background:'red'}}).png().toBuffer();
  await auth('post','/profile/photo',A).attach('photo',Buffer.from('not an image'),'photo.jpg').expect(415);
  const photo=(await auth('post','/profile/photo',A).attach('photo',png,'../photo.png').expect(200)).body;
  const path=photo.profilePhotoUrl.replace('/api',''),id=path.split('/').at(-1);
  const received=await auth('get',path,A).expect(200);
  assert.match(received.headers['cache-control'],/no-store/);
  await auth('get',path,B).expect(404);
  await request(app).get('/api'+path).expect(401);
  await request(app).get('/api/products/'+product.id+'/media/'+id).expect(404);
  const access=(await auth('post',path+'/access',A).expect(200)).body;
  assert.equal(access.requiresAuthorization,true);
  assert.equal(access.url,photo.profilePhotoUrl);
  assert.equal(JSON.stringify(photo).includes('storage_key'),false);
});
test('public DTOs and aggregate analytics exclude personal identifiers',async()=>{
  const list=(await request(app).get('/api/stores').expect(200)).body;
  for(const row of list)for(const field of ['owner_user_id','cnpj','organization_id'])assert.equal(row[field],undefined);
  const metrics=(await auth('get','/stores/engagement/saves',storeA).expect(200)).body;
  assert.equal(metrics[0].saves,1);
  assert.equal(JSON.stringify(metrics).includes(A.user.person_id),false);
});
test('revoked and expired grants are effective immediately; tokens revoke on logout',async()=>{
  const context=storeA.user.contexts[0];
  const m=(await db.query('SELECT id FROM memberships WHERE person_id=$1',[marketing.user.person_id])).rows[0];
  await db.query("UPDATE grants SET expires_at=now()-interval '1 second' WHERE membership_id=$1 AND capability_code='marketing.write'",[m.id]);
  await auth('post','/showcases',marketing).send({title:'Expired',itemIds:[]}).expect(403);
  await auth('delete','/stores/'+context.store_id+'/memberships/'+m.id,storeA).expect(204);
  await auth('get','/stores/me',marketing).expect(403);
  await auth('post','/auth/logout',B).expect(204);
  await auth('get','/profile',B).expect(401);
});
test('legacy schema adoption preserves copied records without asserting ownership',async()=>{
  const legacy=new PGlite({extensions:{pgcrypto}});
  try {
    for(const name of ['001_schema.sql','002_wardrobe_plans.sql','003_customer_profile.sql']) await legacy.exec(await readFile(new URL('../sql/'+name,import.meta.url),'utf8'));
    const u=(await legacy.query("INSERT INTO users(name,email,password_hash,profile_type) VALUES('Synthetic','legacy@example.test','unusable','STORE') RETURNING id")).rows[0];
    const s=(await legacy.query("INSERT INTO stores(owner_user_id,store_name) VALUES($1,'Synthetic store') RETURNING id",[u.id])).rows[0];
    const p=(await legacy.query("INSERT INTO items(store_id,owner_type,name,category) VALUES($1,'STORE','Catalog','tops') RETURNING id",[s.id])).rows[0];
    await legacy.query("INSERT INTO items(owner_user_id,owner_type,source_item_id,source_store_id,name,category) VALUES($1,'WARDROBE',$2,$3,'Copy','tops')",[u.id,p.id,s.id]);
    await assert.rejects(()=>migrate(legacy),/Legacy schema detected/);
    await migrate(legacy,{adoptLegacy:true});
    assert.equal((await legacy.query('SELECT count(*)::int n FROM items')).rows[0].n,2);
    assert.equal((await legacy.query('SELECT count(*)::int n FROM wardrobe_items')).rows[0].n,0);
    assert.equal((await legacy.query('SELECT count(*)::int n FROM commercial_saved_items')).rows[0].n,1);
    assert.equal((await legacy.query('SELECT reason FROM legacy_item_reviews')).rows[0].reason,'COMMERCIAL_COPY');
  } finally {await legacy.close();}
});

test('resource-scoped grants do not authorize another resource or the entire context',async()=>{
  const context=storeA.user.contexts[0];
  const m=(await db.query('INSERT INTO memberships(person_id,organization_id,created_by_person_id) VALUES($1,$2,$3) RETURNING id',[A.user.person_id,context.organization_id,storeA.user.person_id])).rows[0];
  await db.query('INSERT INTO grants(membership_id,capability_code,resource_id,granted_by_person_id) VALUES($1,$2,$3,$4)',[m.id,'catalog.write',product.id,storeA.user.person_id]);
  await authorizeCapability({personId:A.user.person_id},context.organization_id,'catalog.write',product.id,db);
  await assert.rejects(()=>authorizeCapability({personId:A.user.person_id},context.organization_id,'catalog.write',owned.id,db),e=>e.status===403);
  await assert.rejects(()=>authorizeCapability({personId:A.user.person_id},context.organization_id,'catalog.write',null,db),e=>e.status===403);
});
test('database constraints reject cross-person ownership, media and Look references',async()=>{
  await assert.rejects(()=>db.query('INSERT INTO wardrobe_items(person_id,ownership_event_id,name,category) VALUES($1,$2,$3,$4)',[B.user.person_id,owned.ownership_event_id,'Foreign','tops']),e=>['23503','23505'].includes(e.code));
  const media=(await db.query("SELECT id FROM media_assets WHERE purpose='PROFILE'")).rows[0];
  await assert.rejects(()=>db.query('UPDATE customer_profiles SET photo_media_id=$1 WHERE user_id=$2',[media.id,B.user.id]),e=>e.code==='23514');
  const l=(await db.query('INSERT INTO looks(user_id,person_id,title) VALUES($1,$2,$3) RETURNING id',[B.user.id,B.user.person_id,'Synthetic foreign'])).rows[0];
  const v=(await db.query('INSERT INTO look_versions(look_id,person_id,version) VALUES($1,$2,1) RETURNING id',[l.id,B.user.person_id])).rows[0];
  await assert.rejects(()=>db.query("INSERT INTO look_items(look_version_id,person_id,kind,wardrobe_item_id,position) VALUES($1,$2,'OWNED_ITEM',$3,0)",[v.id,B.user.person_id,owned.id]),e=>e.code==='23503');
  await assert.rejects(()=>db.query('UPDATE looks SET is_public=true WHERE id=$1',[l.id]),e=>e.code==='23514');
});
test('last administrator cannot be revoked and corrupted migration ledger is refused',async()=>{
  const context=storeB.user.contexts[0];
  await auth('delete','/stores/'+context.store_id+'/memberships/'+context.membership_id,storeB).expect(409);
  await auth('get','/stores/me',storeB).expect(200);
  const prior=(await db.query("SELECT checksum FROM schema_migrations WHERE version='006_lookup_indexes.sql'")).rows[0].checksum;
  await db.query("UPDATE schema_migrations SET checksum='tampered' WHERE version='006_lookup_indexes.sql'");
  await assert.rejects(()=>migrate(db),/checksum mismatch/);
  await db.query("UPDATE schema_migrations SET checksum=$1 WHERE version='006_lookup_indexes.sql'",[prior]);
});
