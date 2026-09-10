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
import { createLookVariation } from '../src/controllers/lookController.js';

process.env.JWT_SECRET=randomBytes(48).toString('hex');
process.env.MEDIA_ROOT=await mkdtemp(join(tmpdir(),'impar-media-test-'));
process.env.TRUST_PROXY_HOPS='1';
const {createApp}=await import('../src/app.js');
let db,app,A,B,storeA,storeB,marketing,product,owned,look,reviewer,institution;
const password='synthetic-password-2026';
let authRequestNumber=1;
const auth=(method,path,user)=>{
  const requestNumber=authRequestNumber++;
  const testIp=`198.18.${Math.floor(requestNumber/254)}.${requestNumber%254||1}`;
  return request(app)[method]('/api'+path).auth(user.token,{type:'bearer'}).set('X-Forwarded-For',testIp);
};
async function register(label,store=false) {
  const b={name:label,email:label+'@example.com',password,...(store?{profileType:'STORE',store:{storeName:label}}:{})};
  const r=await request(app).post('/api/auth/register').send(b).expect(201);
  if(store){
    assert.equal(r.body.user.contexts.length,0);
    await auth('get','/stores/me',r.body).expect(403);
    await auth('post','/store-requests/'+r.body.user.store_requests[0].id+'/review',reviewer)
      .send({institutionId:institution,decision:'ACTIVE',reason:'Synthetic institutional approval'}).expect(200);
    r.body.user=(await auth('get','/auth/me',r.body)).body;
  }
  return r.body;
}
async function createVersionedLookFixture(user=A) {
  if(!owned) owned=(await auth('post','/wardrobe/items',user).send({name:'Fixture owned shirt',category:'tops',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}).expect(201)).body;
  if(!product) product=(await auth('post','/stores/items',storeA).send({name:'Fixture commercial shirt',category:'tops'}).expect(201)).body;
  const version1Items=[{kind:'OWNED_ITEM',wardrobeItemId:owned.id}];
  const created=(await auth('post','/looks',user).send({title:'Versioned fixture look',items:version1Items}).expect(201)).body;
  const version2Items=[
    {kind:'OWNED_ITEM',wardrobeItemId:owned.id},
    {kind:'COMMERCIAL_PREVIEW',productId:product.id}
  ];
  const version2=(await auth('post','/looks/'+created.id+'/versions',user)
    .send({title:'Versioned fixture look',items:version2Items}).expect(201)).body;
  const current=(await auth('get','/looks/'+created.id,user).expect(200)).body;
  const currentVersionId=(await db.query('SELECT current_version_id FROM looks WHERE id=$1',[created.id])).rows[0].current_version_id;
  assert.equal(currentVersionId,version2.versionId);
  assert.equal(current.versions.length,2);
  assert.ok(current.versions.some(version=>version.id===created.versionId));
  assert.ok(current.versions.some(version=>version.id===version2.versionId));
  return {
    personId:user.user.person_id,
    lookId:created.id,
    version1Id:created.versionId,
    version2Id:version2.versionId,
    currentVersionId,
    version1Items,
    version2Items
  };
}
before(async()=>{
  db=new PGlite({extensions:{pgcrypto}});
  await migrate(db);
  pool.query=db.query.bind(db);
  pool.connect=async()=>({query:db.query.bind(db),release(){}});
  app=createApp();
  reviewer=await register('institution-reviewer');
  institution=(await db.query("INSERT INTO organizations(name,created_by_person_id,kind,status) VALUES('Synthetic institution',$1,'INSTITUTIONAL','ACTIVE') RETURNING id",[reviewer.user.person_id])).rows[0].id;
  const reviewerMember=(await db.query('INSERT INTO memberships(person_id,organization_id,created_by_person_id) VALUES($1,$2,$1) RETURNING id',[reviewer.user.person_id,institution])).rows[0];
  await db.query("INSERT INTO grants(membership_id,capability_code,granted_by_person_id) VALUES($1,'store_requests.review',$2)",[reviewerMember.id,reviewer.user.person_id]);
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
test('store requests require submission and institutional authority; suspension removes access and visibility',async()=>{
  const draft=(await auth('post','/store-requests',A).send({name:'Synthetic pending'}).expect(201)).body;
  assert.equal(draft.status,'DRAFT');
  await auth('post','/store-requests/'+draft.id+'/submit',B).expect(404);
  await auth('post','/store-requests/'+draft.id+'/submit',A).expect(202);
  await auth('post','/store-requests/'+draft.id+'/review',A).send({institutionId:institution,decision:'ACTIVE',reason:'Forbidden self review'}).expect(403);
  await auth('post','/store-requests/'+draft.id+'/review',reviewer).send({institutionId:institution,decision:'ACTIVE',reason:'Test approval'}).expect(200);
  const sid=(await auth('get','/auth/me',A)).body.contexts[0].store_id;
  await request(app).get('/api/stores/'+sid).expect(200);
  await auth('post','/store-requests/'+draft.id+'/review',reviewer).send({institutionId:institution,decision:'SUSPENDED',reason:'Test suspension'}).expect(200);
  await auth('get','/stores/me',A).expect(403);
  await request(app).get('/api/stores/'+sid).expect(404);
  assert.equal((await auth('get','/auth/me',A)).body.contexts.length,0);
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
test('Context schema keeps progressive fields independent and prevents cross-person Look links',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const contextA=(await db.query(`INSERT INTO contexts(owner_person_id,occasion,starts_at,location_text,provenance)
    VALUES($1,'Synthetic occasion',now(),'Synthetic location','USER_DECLARED') RETURNING id,owner_person_id`,[A.user.person_id])).rows[0];
  const contextB=(await db.query("INSERT INTO contexts(owner_person_id,provenance) VALUES($1,'EXPERT_VALIDATED') RETURNING id",[B.user.person_id])).rows[0];
  await db.query('INSERT INTO look_contexts(look_id,context_id,owner_person_id) VALUES($1,$2,$3)',[fixture.lookId,contextA.id,A.user.person_id]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_contexts WHERE look_id=$1 AND context_id=$2',[fixture.lookId,contextA.id])).rows[0].count,1);
  await assert.rejects(()=>db.query('INSERT INTO look_contexts(look_id,context_id,owner_person_id) VALUES($1,$2,$3)',[fixture.lookId,contextA.id,A.user.person_id]));
  await assert.rejects(()=>db.query('INSERT INTO look_contexts(look_id,context_id,owner_person_id) VALUES($1,$2,$3)',[fixture.lookId,contextB.id,A.user.person_id]));
  await assert.rejects(()=>db.query("INSERT INTO contexts(owner_person_id,provenance) VALUES($1,'INVALID')",[A.user.person_id]));
});
test('Collection schema organizes Looks without trip fields or cross-person links',async()=>{
  const first=await createVersionedLookFixture(A);
  const second=await createVersionedLookFixture(A);
  const collectionA=(await db.query("INSERT INTO collections(owner_person_id,name,description) VALUES($1,'Synthetic collection','Generic organization') RETURNING id",[A.user.person_id])).rows[0];
  const collectionA2=(await db.query("INSERT INTO collections(owner_person_id,name) VALUES($1,'Synthetic collection') RETURNING id",[A.user.person_id])).rows[0];
  const collectionB=(await db.query("INSERT INTO collections(owner_person_id,name) VALUES($1,'Other collection') RETURNING id",[B.user.person_id])).rows[0];
  await db.query('INSERT INTO collection_looks(collection_id,look_id,owner_person_id) VALUES($1,$2,$3)',[collectionA.id,first.lookId,A.user.person_id]);
  await db.query('INSERT INTO collection_looks(collection_id,look_id,owner_person_id) VALUES($1,$2,$3)',[collectionA.id,second.lookId,A.user.person_id]);
  await db.query('INSERT INTO collection_looks(collection_id,look_id,owner_person_id) VALUES($1,$2,$3)',[collectionA2.id,first.lookId,A.user.person_id]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collection_looks WHERE collection_id=$1',[collectionA.id])).rows[0].count,2);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collection_looks WHERE look_id=$1',[first.lookId])).rows[0].count,2);
  await assert.rejects(()=>db.query('INSERT INTO collection_looks(collection_id,look_id,owner_person_id) VALUES($1,$2,$3)',[collectionA.id,first.lookId,A.user.person_id]));
  await assert.rejects(()=>db.query('INSERT INTO collection_looks(collection_id,look_id,owner_person_id) VALUES($1,$2,$3)',[collectionB.id,first.lookId,B.user.person_id]));
  await assert.rejects(()=>db.query("INSERT INTO collections(owner_person_id,name) VALUES($1,'   ')",[A.user.person_id]));
});
test('Comparison schema keeps ordered same-person Look candidates without a minimum size',async()=>{
  const first=await createVersionedLookFixture(A);
  const second=await createVersionedLookFixture(A);
  const third=(await auth('post','/looks',A).send({title:'Third comparison Look',items:[{kind:'OWNED_ITEM',wardrobeItemId:owned.id}]}).expect(201)).body;
  const ownedB=(await auth('post','/wardrobe/items',B).send({name:'B comparison shirt',category:'tops',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}).expect(201)).body;
  const lookB=(await auth('post','/looks',B).send({title:'B comparison Look',items:[{kind:'OWNED_ITEM',wardrobeItemId:ownedB.id}]}).expect(201)).body;
  const comparisonA=(await db.query("INSERT INTO comparisons(owner_person_id,name) VALUES($1,'Synthetic comparison') RETURNING id",[A.user.person_id])).rows[0];
  const comparisonA2=(await db.query("INSERT INTO comparisons(owner_person_id,name) VALUES($1,'Another comparison') RETURNING id",[A.user.person_id])).rows[0];
  const empty=(await db.query("INSERT INTO comparisons(owner_person_id) VALUES($1) RETURNING id",[A.user.person_id])).rows[0];
  assert.equal((await db.query('SELECT count(*)::int AS count FROM comparison_looks WHERE comparison_id=$1',[empty.id])).rows[0].count,0);
  await db.query('INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position) VALUES($1,$2,$3,$4)',[comparisonA.id,first.lookId,A.user.person_id,0]);
  await db.query('INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position) VALUES($1,$2,$3,$4)',[comparisonA.id,second.lookId,A.user.person_id,1]);
  await db.query('INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position) VALUES($1,$2,$3,$4)',[comparisonA2.id,first.lookId,A.user.person_id,0]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM comparison_looks WHERE comparison_id=$1',[comparisonA.id])).rows[0].count,2);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM comparison_looks WHERE look_id=$1',[first.lookId])).rows[0].count,2);
  await assert.rejects(()=>db.query('INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position) VALUES($1,$2,$3,$4)',[comparisonA.id,first.lookId,A.user.person_id,2]));
  await assert.rejects(()=>db.query('INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position) VALUES($1,$2,$3,$4)',[comparisonA.id,third.id,A.user.person_id,1]));
  await assert.rejects(()=>db.query('INSERT INTO comparison_looks(comparison_id,look_id,owner_person_id,position) VALUES($1,$2,$3,$4)',[comparisonA.id,lookB.id,A.user.person_id,2]));
});
test('POST /contexts creates only private progressive Context records',async()=>{
  const full=(await auth('post','/contexts',A).send({
    occasion:'Synthetic dinner',startsAt:'2026-09-10T19:30:00.000Z',locationText:'Synthetic location',
    climateReference:'Synthetic climate',formality:'Optional formality',objective:'Synthetic objective',notes:'Synthetic notes',
    provenance:'EXPERT_VALIDATED'
  }).expect(201)).body;
  assert.equal(full.occasion,'Synthetic dinner');
  assert.equal(full.provenance,'EXPERT_VALIDATED');
  assert.ok(full.createdAt);
  const fullRow=(await db.query('SELECT owner_person_id,occasion,provenance FROM contexts WHERE id=$1',[full.id])).rows[0];
  assert.deepEqual(fullRow,{owner_person_id:A.user.person_id,occasion:'Synthetic dinner',provenance:'EXPERT_VALIDATED'});
  const progressive=(await auth('post','/contexts',A).send({}).expect(201)).body;
  assert.equal(progressive.provenance,'USER_DECLARED');
  for(const field of ['occasion','startsAt','locationText','climateReference','formality','objective','notes']) assert.equal(progressive[field],null);
  const countBeforeInvalid=(await db.query('SELECT count(*)::int AS count FROM contexts WHERE owner_person_id=$1',[A.user.person_id])).rows[0].count;
  const countBeforeOwnerInjection=(await db.query('SELECT count(*)::int AS count FROM contexts WHERE owner_person_id=$1',[B.user.person_id])).rows[0].count;
  await auth('post','/contexts',A).send({provenance:'INVALID'}).expect(400);
  await auth('post','/contexts',A).send({owner_person_id:B.user.person_id}).expect(400);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM contexts WHERE owner_person_id=$1',[A.user.person_id])).rows[0].count,countBeforeInvalid);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM contexts WHERE owner_person_id=$1',[B.user.person_id])).rows[0].count,countBeforeOwnerInjection);
});
test('POST /collections creates generic private Collections without owner injection',async()=>{
  const first=(await auth('post','/collections',A).send({name:'Synthetic collection',description:'Optional description'}).expect(201)).body;
  assert.equal(first.name,'Synthetic collection');
  assert.equal(first.description,'Optional description');
  assert.ok(first.createdAt);
  assert.deepEqual((await db.query('SELECT owner_person_id,name,description FROM collections WHERE id=$1',[first.id])).rows[0],{
    owner_person_id:A.user.person_id,name:'Synthetic collection',description:'Optional description'
  });
  const withoutDescription=(await auth('post','/collections',A).send({name:'No description'}).expect(201)).body;
  assert.equal(withoutDescription.description,null);
  const repeated=(await auth('post','/collections',A).send({name:'Synthetic collection'}).expect(201)).body;
  assert.notEqual(repeated.id,first.id);
  const countBeforeInvalid=(await db.query('SELECT count(*)::int AS count FROM collections WHERE owner_person_id=$1',[A.user.person_id])).rows[0].count;
  const bCountBeforeInjection=(await db.query('SELECT count(*)::int AS count FROM collections WHERE owner_person_id=$1',[B.user.person_id])).rows[0].count;
  await auth('post','/collections',A).send({name:'   '}).expect(400);
  await auth('post','/collections',A).send({name:''}).expect(400);
  await auth('post','/collections',A).send({name:'Injected owner',personId:B.user.person_id}).expect(400);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collections WHERE owner_person_id=$1',[A.user.person_id])).rows[0].count,countBeforeInvalid);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collections WHERE owner_person_id=$1',[B.user.person_id])).rows[0].count,bCountBeforeInjection);
});
test('POST /collections/:collectionId/looks/:lookId links only same-person resources once',async()=>{
  const first=await createVersionedLookFixture(A);
  const second=await createVersionedLookFixture(A);
  const collectionA=(await auth('post','/collections',A).send({name:'Collection A'}).expect(201)).body;
  const collectionB=(await auth('post','/collections',A).send({name:'Collection B'}).expect(201)).body;
  const ownedB=(await auth('post','/wardrobe/items',B).send({name:'B owned shirt',category:'tops',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}).expect(201)).body;
  const lookB=(await auth('post','/looks',B).send({title:'B Look',items:[{kind:'OWNED_ITEM',wardrobeItemId:ownedB.id}]}).expect(201)).body;
  const linked=(await auth('post','/collections/'+collectionA.id+'/looks/'+first.lookId,A).send({}).expect(201)).body;
  assert.equal(linked.collectionId,collectionA.id);
  assert.equal(linked.lookId,first.lookId);
  assert.ok(linked.linkedAt);
  assert.deepEqual((await db.query('SELECT collection_id,look_id,owner_person_id FROM collection_looks WHERE collection_id=$1 AND look_id=$2',[collectionA.id,first.lookId])).rows[0],{
    collection_id:collectionA.id,look_id:first.lookId,owner_person_id:A.user.person_id
  });
  assert.deepEqual((await auth('post','/collections/'+collectionA.id+'/looks/'+first.lookId,A).send({}).expect(200)).body,linked);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collection_looks WHERE collection_id=$1 AND look_id=$2',[collectionA.id,first.lookId])).rows[0].count,1);
  await auth('post','/collections/'+collectionA.id+'/looks/'+second.lookId,A).send({}).expect(201);
  await auth('post','/collections/'+collectionB.id+'/looks/'+first.lookId,A).send({}).expect(201);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collection_looks WHERE collection_id=$1',[collectionA.id])).rows[0].count,2);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collection_looks WHERE look_id=$1',[first.lookId])).rows[0].count,2);
  await auth('post','/collections/'+collectionA.id+'/looks/'+lookB.id,B).send({}).expect(404);
  await auth('post','/collections/'+collectionA.id+'/looks/'+lookB.id,A).send({}).expect(404);
  await auth('post','/collections/00000000-0000-4000-8000-000000000003/looks/'+first.lookId,A).send({}).expect(404);
  await auth('post','/collections/'+collectionA.id+'/looks/00000000-0000-4000-8000-000000000004',A).send({}).expect(404);
  assert.deepEqual((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[first.lookId])).rows[0],{current_version_id:first.version2Id});
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_versions WHERE look_id=$1',[first.lookId])).rows[0].count,2);
  assert.deepEqual((await db.query('SELECT name FROM collections WHERE id=$1',[collectionA.id])).rows[0],{name:'Collection A'});
});
test('Collection read endpoints expose only linked private Looks',async()=>{
  const first=await createVersionedLookFixture(A);
  const second=await createVersionedLookFixture(A);
  const unlinked=(await auth('post','/looks',A).send({title:'Unlinked Look',items:[{kind:'OWNED_ITEM',wardrobeItemId:owned.id}]}).expect(201)).body;
  const collectionA=(await auth('post','/collections',A).send({name:'Readable Collection',description:'Private collection'}).expect(201)).body;
  const collectionB=(await auth('post','/collections',A).send({name:'Second Collection'}).expect(201)).body;
  const empty=(await auth('post','/collections',A).send({name:'Empty Collection'}).expect(201)).body;
  await auth('post','/collections/'+collectionA.id+'/looks/'+first.lookId,A).send({}).expect(201);
  await auth('post','/collections/'+collectionA.id+'/looks/'+second.lookId,A).send({}).expect(201);
  await auth('post','/collections/'+collectionB.id+'/looks/'+first.lookId,A).send({}).expect(201);
  const byId=(await auth('get','/collections/'+collectionA.id,A).expect(200)).body;
  assert.deepEqual(byId,{id:collectionA.id,name:'Readable Collection',description:'Private collection',createdAt:byId.createdAt});
  assert.ok(byId.createdAt);
  await auth('get','/collections/'+collectionA.id,B).expect(404);
  const looksA=(await auth('get','/collections/'+collectionA.id+'/looks',A).expect(200)).body;
  assert.equal(looksA.length,2);
  assert.deepEqual(new Set(looksA.map(lookRow=>lookRow.id)),new Set([first.lookId,second.lookId]));
  assert.equal(looksA.some(lookRow=>lookRow.id===unlinked.id),false);
  await auth('get','/collections/'+collectionA.id+'/looks',B).expect(404);
  assert.deepEqual((await auth('get','/collections/'+empty.id+'/looks',A).expect(200)).body,[]);
  const looksB=(await auth('get','/collections/'+collectionB.id+'/looks',A).expect(200)).body;
  assert.deepEqual(looksB.map(lookRow=>lookRow.id),[first.lookId]);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM collection_looks WHERE look_id=$1',[first.lookId])).rows[0].count,2);
  assert.deepEqual((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[first.lookId])).rows[0],{current_version_id:first.version2Id});
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_versions WHERE look_id=$1',[first.lookId])).rows[0].count,2);
});
test('POST /looks/:lookId/contexts/:contextId links only same-person resources once',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const contextA=(await auth('post','/contexts',A).send({occasion:'Context A'}).expect(201)).body;
  const contextB=(await auth('post','/contexts',B).send({occasion:'Context B'}).expect(201)).body;
  const linked=(await auth('post','/looks/'+fixture.lookId+'/contexts/'+contextA.id,A).send({}).expect(201)).body;
  assert.equal(linked.lookId,fixture.lookId);
  assert.equal(linked.contextId,contextA.id);
  assert.ok(linked.linkedAt);
  assert.deepEqual((await db.query('SELECT look_id,context_id,owner_person_id FROM look_contexts WHERE look_id=$1 AND context_id=$2',[fixture.lookId,contextA.id])).rows[0],{
    look_id:fixture.lookId,context_id:contextA.id,owner_person_id:A.user.person_id
  });
  const repeated=(await auth('post','/looks/'+fixture.lookId+'/contexts/'+contextA.id,A).send({}).expect(200)).body;
  assert.deepEqual(repeated,linked);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_contexts WHERE look_id=$1 AND context_id=$2',[fixture.lookId,contextA.id])).rows[0].count,1);
  await auth('post','/looks/'+fixture.lookId+'/contexts/'+contextB.id,B).send({}).expect(404);
  await auth('post','/looks/'+fixture.lookId+'/contexts/'+contextB.id,A).send({}).expect(404);
  await auth('post','/looks/00000000-0000-4000-8000-000000000001/contexts/'+contextA.id,A).send({}).expect(404);
  await auth('post','/looks/'+fixture.lookId+'/contexts/00000000-0000-4000-8000-000000000002',A).send({}).expect(404);
  assert.deepEqual((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[fixture.lookId])).rows[0],{current_version_id:fixture.version2Id});
  assert.deepEqual((await db.query('SELECT owner_person_id,occasion FROM contexts WHERE id=$1',[contextA.id])).rows[0],{owner_person_id:A.user.person_id,occasion:'Context A'});
});
test('Context read endpoints expose only associated private Contexts in deterministic order',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const context1=(await auth('post','/contexts',A).send({occasion:'Earlier',startsAt:'2026-09-10T09:00:00.000Z'}).expect(201)).body;
  const context2=(await auth('post','/contexts',A).send({occasion:'Later',startsAt:'2026-09-10T18:00:00.000Z'}).expect(201)).body;
  const unlinked=(await auth('post','/contexts',A).send({occasion:'Unlinked'}).expect(201)).body;
  await auth('post','/looks/'+fixture.lookId+'/contexts/'+context1.id,A).send({}).expect(201);
  await auth('post','/looks/'+fixture.lookId+'/contexts/'+context2.id,A).send({}).expect(201);
  const byId=(await auth('get','/contexts/'+context1.id,A).expect(200)).body;
  assert.equal(byId.id,context1.id);
  assert.equal(byId.occasion,'Earlier');
  assert.equal(byId.provenance,'USER_DECLARED');
  await auth('get','/contexts/'+context1.id,B).expect(404);
  const listed=(await auth('get','/looks/'+fixture.lookId+'/contexts',A).expect(200)).body;
  assert.deepEqual(listed.map(context=>context.id),[context1.id,context2.id]);
  assert.equal(listed.some(context=>context.id===unlinked.id),false);
  await auth('get','/looks/'+fixture.lookId+'/contexts',B).expect(404);
  const emptyLook=(await auth('post','/looks',A).send({title:'No context fixture',items:[{kind:'OWNED_ITEM',wardrobeItemId:owned.id}]}).expect(201)).body;
  assert.deepEqual((await auth('get','/looks/'+emptyLook.id+'/contexts',A).expect(200)).body,[]);
});
test('createLookVariation copies the current source snapshot into an independent Look',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const result=await createLookVariation({
    personId:fixture.personId,
    sourceLookVersionId:fixture.version2Id,
    name:'Variação teste'
  });
  assert.ok(result.variationId);
  assert.equal(result.sourceLookId,fixture.lookId);
  assert.equal(result.sourceLookVersionId,fixture.version2Id);
  assert.ok(result.resultingLookId);
  assert.notEqual(result.resultingLookId,fixture.lookId);
  assert.ok(result.resultingLookVersionId);
  const variation=(await db.query('SELECT owner_person_id,source_look_id,source_look_version_id,resulting_look_id FROM look_variations WHERE id=$1',[result.variationId])).rows[0];
  assert.deepEqual(variation,{
    owner_person_id:fixture.personId,
    source_look_id:fixture.lookId,
    source_look_version_id:fixture.version2Id,
    resulting_look_id:result.resultingLookId
  });
  const resultingLook=(await db.query('SELECT person_id,current_version_id FROM looks WHERE id=$1',[result.resultingLookId])).rows[0];
  assert.equal(resultingLook.person_id,fixture.personId);
  assert.equal(resultingLook.current_version_id,result.resultingLookVersionId);
  assert.deepEqual((await db.query('SELECT version FROM look_versions WHERE id=$1',[result.resultingLookVersionId])).rows[0],{version:1});
  const snapshot=(await db.query(`SELECT kind,wardrobe_item_id AS "wardrobeItemId",product_id AS "productId",position
    FROM look_items WHERE look_version_id=$1 ORDER BY position`,[result.resultingLookVersionId])).rows;
  assert.deepEqual(snapshot,fixture.version2Items.map((item,position)=>({
    kind:item.kind,
    wardrobeItemId:item.wardrobeItemId??null,
    productId:item.productId??null,
    position
  })));
  assert.deepEqual((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[fixture.lookId])).rows[0],{current_version_id:fixture.version2Id});
  assert.deepEqual((await db.query('SELECT id FROM look_versions WHERE id=$1',[fixture.version2Id])).rows[0],{id:fixture.version2Id});
});
test('createLookVariation conceals another person source and leaves no partial variation',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const personB=await register('variation-intruder');
  const countForB=async()=>({
    looks:(await db.query('SELECT count(*)::int AS count FROM looks WHERE person_id=$1',[personB.user.person_id])).rows[0].count,
    versions:(await db.query('SELECT count(*)::int AS count FROM look_versions WHERE person_id=$1',[personB.user.person_id])).rows[0].count,
    items:(await db.query('SELECT count(*)::int AS count FROM look_items WHERE person_id=$1',[personB.user.person_id])).rows[0].count,
    variations:(await db.query('SELECT count(*)::int AS count FROM look_variations WHERE owner_person_id=$1',[personB.user.person_id])).rows[0].count
  });
  const beforeCounts=await countForB();
  await assert.rejects(
    ()=>createLookVariation({personId:personB.user.person_id,sourceLookVersionId:fixture.version2Id,name:'Tentativa indevida'}),
    error=>error.status===404
  );
  assert.deepEqual(await countForB(),beforeCounts);
  assert.deepEqual((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[fixture.lookId])).rows[0],{current_version_id:fixture.version2Id});
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_versions WHERE id IN ($1,$2)',[fixture.version1Id,fixture.version2Id])).rows[0].count,2);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_items WHERE look_version_id=$1',[fixture.version2Id])).rows[0].count,fixture.version2Items.length);
});
test('createLookVariation rolls back every transient write after a controlled late failure',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const countForA=async()=>({
    looks:(await db.query('SELECT count(*)::int AS count FROM looks WHERE person_id=$1',[fixture.personId])).rows[0].count,
    versions:(await db.query('SELECT count(*)::int AS count FROM look_versions WHERE person_id=$1',[fixture.personId])).rows[0].count,
    items:(await db.query('SELECT count(*)::int AS count FROM look_items WHERE person_id=$1',[fixture.personId])).rows[0].count,
    variations:(await db.query('SELECT count(*)::int AS count FROM look_variations WHERE owner_person_id=$1',[fixture.personId])).rows[0].count
  });
  const beforeCounts=await countForA();
  const sourceSnapshot=(await db.query(`SELECT kind,wardrobe_item_id,product_id,position
    FROM look_items WHERE look_version_id=$1 ORDER BY position`,[fixture.version2Id])).rows;
  const originalConnect=pool.connect;
  let injected=false,releaseCalled=false;
  pool.connect=async()=>{
    const client=await originalConnect();
    return {
      async query(text,values) {
        if(!injected && text.includes('INSERT INTO look_variations')) {
          injected=true;
          throw new Error('controlled late variation insert failure');
        }
        return client.query(text,values);
      },
      release() {
        releaseCalled=true;
        client.release();
      }
    };
  };
  try {
    await assert.rejects(
      ()=>createLookVariation({personId:fixture.personId,sourceLookVersionId:fixture.version2Id,name:'Falha controlada'}),
      /controlled late variation insert failure/
    );
  } finally {
    pool.connect=originalConnect;
  }
  assert.equal(injected,true);
  assert.equal(releaseCalled,true);
  assert.deepEqual(await countForA(),beforeCounts);
  assert.deepEqual((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[fixture.lookId])).rows[0],{current_version_id:fixture.version2Id});
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_versions WHERE id IN ($1,$2)',[fixture.version1Id,fixture.version2Id])).rows[0].count,2);
  assert.deepEqual((await db.query(`SELECT kind,wardrobe_item_id,product_id,position
    FROM look_items WHERE look_version_id=$1 ORDER BY position`,[fixture.version2Id])).rows,sourceSnapshot);
});
test('POST /looks/:id/variations creates only an authorized variation from its matching Look version',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const created=(await auth('post','/looks/'+fixture.lookId+'/variations',A)
    .send({sourceLookVersionId:fixture.version2Id,name:'Variação HTTP'}).expect(201)).body;
  assert.ok(created.variationId);
  assert.equal(created.sourceLookId,fixture.lookId);
  assert.equal(created.sourceLookVersionId,fixture.version2Id);
  assert.ok(created.resultingLookId);
  assert.notEqual(created.resultingLookId,fixture.lookId);
  assert.ok(created.resultingLookVersionId);
  assert.equal((await db.query('SELECT current_version_id FROM looks WHERE id=$1',[created.resultingLookId])).rows[0].current_version_id,created.resultingLookVersionId);
  const countVariations=(await db.query('SELECT count(*)::int AS count FROM look_variations WHERE owner_person_id=$1',[fixture.personId])).rows[0].count;
  await auth('post','/looks/'+fixture.lookId+'/variations',B)
    .send({sourceLookVersionId:fixture.version2Id,name:'Tentativa indevida'}).expect(404);
  await auth('post','/looks/'+created.resultingLookId+'/variations',A)
    .send({sourceLookVersionId:fixture.version2Id,name:'Caminho inconsistente'}).expect(404);
  await auth('post','/looks/'+fixture.lookId+'/variations',A).send({}).expect(400);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM look_variations WHERE owner_person_id=$1',[fixture.personId])).rows[0].count,countVariations);
});
test('LookVariation read endpoints return only the authenticated source owner records',async()=>{
  const fixture=await createVersionedLookFixture(A);
  const created=(await auth('post','/looks/'+fixture.lookId+'/variations',A)
    .send({sourceLookVersionId:fixture.version2Id,name:'Variação para leitura'}).expect(201)).body;
  const variation=(await auth('get','/look-variations/'+created.variationId,A).expect(200)).body;
  assert.deepEqual(variation,{
    variationId:created.variationId,
    name:'Variação para leitura',
    sourceLookId:fixture.lookId,
    sourceLookVersionId:fixture.version2Id,
    resultingLookId:created.resultingLookId,
    createdAt:variation.createdAt
  });
  assert.ok(variation.createdAt);
  const listed=(await auth('get','/looks/'+fixture.lookId+'/variations',A).expect(200)).body;
  assert.equal(listed.length,1);
  assert.deepEqual(listed[0],variation);
  await auth('get','/look-variations/'+created.variationId,B).expect(404);
  await auth('get','/looks/'+fixture.lookId+'/variations',B).expect(404);
  assert.deepEqual((await auth('get','/looks/'+created.resultingLookId+'/variations',A).expect(200)).body,[]);
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

test('reconstruction inputs, jobs and outputs are isolated; fake success cannot reach READY',async()=>{
 const {runOnce}=await import('../src/reconstruction/worker.js');
 const j=(await auth('post','/reconstruction/jobs',A).send({itemId:owned.id,category:'TOP'}).expect(201)).body;
 assert.ok(j.capture_session_id);
 const session=(await auth('get','/reconstruction/sessions/'+j.capture_session_id,A).expect(200)).body;
 assert.equal(session.protocol_version,'TOP_CAPTURE_V1');assert.equal(session.expected_shots.length,36);
 await auth('get','/reconstruction/sessions/'+j.capture_session_id,marketing).expect(404);
 await auth('post','/reconstruction/jobs',marketing).send({itemId:owned.id,category:'TOP'}).expect(404);
 await auth('get','/reconstruction/jobs/'+j.id,marketing).expect(404);
 await request(app).get('/api/reconstruction/jobs/'+j.id).expect(401);
 await auth('get','/reconstruction/jobs/'+j.id+'/output',marketing).expect(404);
 const need=(await auth('post','/reconstruction/jobs/'+j.id+'/submit',A).expect(202)).body;
 assert.equal(need.state,'NEEDS_MORE_INPUT');
 for(let i=0;i<12;i++){
  const png=await sharp({create:{width:4,height:4,channels:3,background:{r:i*19,g:70,b:90}}}).png().toBuffer();
  await auth('post','/reconstruction/jobs/'+j.id+'/inputs',A).field('azimuth',String(i*30)).field('elevation',i<6?'LOW':'HIGH').attach('photos',png,'capture.png').expect(201);
 }
 const queued=(await auth('post','/reconstruction/jobs/'+j.id+'/submit',A).expect(202)).body;
 assert.equal(queued.state,'QUEUED');
 await auth('post','/reconstruction/jobs/'+j.id+'/submit',A).expect(409);
 // This adapter is a hostile protocol test, never evidence of real reconstruction.
 const {writeFile}=await import('node:fs/promises');const {dirname}=await import('node:path');
 const result=await runOnce({execute:async path=>writeFile(join(dirname(path),'result.json'),JSON.stringify({status:'READY',metrics:{reconstruction_success:true}}))});
 assert.equal(result.state,'FAILED');
 assert.equal((await auth('get','/reconstruction/jobs/'+j.id,A)).body.state,'FAILED');
 assert.equal((await db.query('SELECT count(*)::int n FROM reconstruction_outputs WHERE job_id=$1',[j.id])).rows[0].n,0);
 await auth('post','/reconstruction/jobs/'+j.id+'/inspection',A).send({inspection:{complete:true,isolatedItem:true,colorFaithful:true,categoryConfirmed:true},dimension:{axis:'y',valueMeters:.4,source:'USER_DECLARED'}}).expect(409);
 const foreign=(await db.query("SELECT id FROM media_assets WHERE person_id=$1 LIMIT 1",[A.user.person_id])).rows[0];
 const other=(await auth('post','/wardrobe/items',marketing).send({name:'Other owner',category:'TOP',ownershipSource:'MANUAL_CATALOG',ownershipAttested:true}).expect(201)).body;
 const otherJob=(await auth('post','/reconstruction/jobs',marketing).send({itemId:other.id,category:'TOP'}).expect(201)).body;
 await assert.rejects(()=>db.query("INSERT INTO reconstruction_inputs(job_id,person_id,media_id,azimuth,elevation) VALUES($1,$2,$3,0,'MID')",[otherJob.id,marketing.user.person_id,foreign.id]),e=>e.code==='23514');
});

test('worker output stays private and in QUALITY_CHECK until inspection; invalid quality cannot be overridden',async()=>{
 const {runOnce}=await import('../src/reconstruction/worker.js');
 const {syntheticGlb}=await import('../fixtures/syntheticGlb.js');
 const {createHash}=await import('node:crypto');
 const {writeFile}=await import('node:fs/promises');const {dirname}=await import('node:path');
 const j=(await db.query("SELECT * FROM reconstruction_jobs WHERE person_id=$1 AND state='FAILED' ORDER BY created_at DESC LIMIT 1",[A.user.person_id])).rows[0];
 await auth('post','/reconstruction/jobs/'+j.id+'/submit',A).expect(202);
 const buffer=syntheticGlb();
 const result=await runOnce({execute:async path=>{
  const manifest=JSON.parse(await readFile(path,'utf8'));
  await writeFile(join(dirname(path),'reconstruction.glb'),buffer);
  await writeFile(join(dirname(path),'result.json'),JSON.stringify({status:'QUALITY_CHECK',output:'reconstruction.glb',sha256:createHash('sha256').update(buffer).digest('hex'),provenance:{pipelineVersion:manifest.pipelineVersion,inputHashes:manifest.inputs.map(i=>i.sha256).sort()},metrics:{registeredRatio:.3,reprojectionError:1,triangles:450,invalidGeometry:0,reconstruction_success:true}}));
 }});
 assert.equal(result.state,'QUALITY_CHECK');
 await auth('get','/reconstruction/jobs/'+j.id+'/output',A).expect(200).expect('Content-Type',/model\/gltf-binary/);
 await auth('get','/reconstruction/jobs/'+j.id+'/output',marketing).expect(404);
 await request(app).get('/api/reconstruction/jobs/'+j.id+'/output').expect(401);
 const inspected=(await auth('post','/reconstruction/jobs/'+j.id+'/inspection',A).send({inspection:{complete:true,isolatedItem:true,colorFaithful:true,categoryConfirmed:true},dimension:{axis:'y',valueMeters:.3,source:'USER_DECLARED'}}).expect(200)).body;
 assert.equal(inspected.state,'NEEDS_MORE_INPUT');assert.equal(inspected.metrics.first_pass_success,false);
});
