// Local, disposable test environment. Binds loopback only; never deploy this script.
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import bcrypt from 'bcryptjs';
import express from 'express';
import {pool} from '../src/config/db.js';
import {migrate} from '../src/db/migrate.js';
import {syntheticGlb} from '../fixtures/syntheticGlb.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
process.env.JWT_SECRET=randomBytes(48).toString('hex');
process.env.MEDIA_ROOT=join(root,'private/poc-local/media');
process.env.RECONSTRUCTION_ROOT=join(root,'private/poc-local/jobs');
process.env.CORS_ORIGIN='http://localhost:4175,http://127.0.0.1:4175';
const db=new PGlite({extensions:{pgcrypto}});await migrate(db);
let tail=Promise.resolve();
async function acquire(){let release;const prior=tail;tail=new Promise(r=>{release=r;});await prior;return release;}
pool.connect=async()=>{const release=await acquire();return {query:db.query.bind(db),release};};
pool.query=async(...args)=>{const release=await acquire();try{return await db.query(...args);}finally{release();}};
const {createApp}=await import('../src/app.js');
const {storage}=await import('../src/services/imageService.js');
const {inspectGlb}=await import('../src/reconstruction/glb.js');
const {runOnce}=await import('../src/reconstruction/worker.js');
const user=(await db.query("INSERT INTO users(name,email,password_hash,profile_type) VALUES('Pessoa fictícia POC','poc@example.com',$1,'PERSON') RETURNING id",[await bcrypt.hash('local-poc-synthetic-2026',12)])).rows[0];
const person=(await db.query("INSERT INTO persons(display_name) VALUES('Pessoa fictícia POC') RETURNING id")).rows[0];
await db.query('INSERT INTO accounts(id,person_id) VALUES($1,$2)',[user.id,person.id]);
await db.query('INSERT INTO customer_profiles(user_id) VALUES($1)',[user.id]);
await db.query("INSERT INTO person_entitlements(person_id,plan_id,source) VALUES($1,'FREE','SYNTHETIC_TEST')",[person.id]);
if(process.argv.includes('--renderer-control')){
 // Strictly a synthetic geometry fixture for renderer testing. Not a reconstructed garment.
 const buffer=syntheticGlb();const metadata=inspectGlb(buffer);
 for(let i=0;i<2;i++){
  const ev=(await db.query("INSERT INTO ownership_events(person_id,source,recorded_by_person_id,attested_at) VALUES($1,'MANUAL_CATALOG',$1,now()) RETURNING id",[person.id])).rows[0];
  const item=(await db.query("INSERT INTO wardrobe_items(person_id,ownership_event_id,name,category) VALUES($1,$2,$3,'TOP') RETURNING id",[person.id,ev.id,'CONTROLE SINTÉTICO '+(i+1)+' — não é peça física'])).rows[0];
  const job=(await db.query("INSERT INTO reconstruction_jobs(person_id,wardrobe_item_id,category,state,pipeline_version,technique,capture_metadata,quality,placement) VALUES($1,$2,'TOP','READY','RENDERER_TEST_ONLY','SYNTHETIC_FIXTURE',$3,$4,$5) RETURNING id",[person.id,item.id,{source:'SYNTHETIC_CONTROL'},{compositionReady:true,scope:'RENDERER_TEST_ONLY'},{uniformScale:i?.6:.8}])).rows[0];
  const key=randomUUID()+'.glb';await storage.put(key,buffer);
  await db.query("INSERT INTO reconstruction_outputs(job_id,person_id,storage_key,mime,bytes,sha256,metadata) VALUES($1,$2,$3,'model/gltf-binary',$4,$5,$6)",[job.id,person.id,key,buffer.length,createHash('sha256').update(buffer).digest('hex'),metadata]);
 }
}
const api=createApp().listen(4000,'127.0.0.1',()=>console.log('API local: http://127.0.0.1:4000'));
const web=express().use(express.static(join(root,'frontend/.expo-demo-check/cycle2-web'))).listen(4175,'127.0.0.1',()=>console.log('Showcase/POC: http://127.0.0.1:4175; conta sintética poc@example.com'));
let running=false;
const timer=setInterval(async()=>{if(running||!process.argv.includes('--worker'))return;running=true;try{const j=await runOnce();if(j)console.log(JSON.stringify(j));}catch(e){console.log('Local worker failed:',e.name);}finally{running=false;}},3000);
async function close(){clearInterval(timer);api.close();web.close();await db.close();await pool.end();process.exit(0);}
process.on('SIGINT',close);process.on('SIGTERM',close);
