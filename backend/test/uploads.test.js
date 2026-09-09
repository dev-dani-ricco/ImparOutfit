import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import express from 'express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeImage, upload, uploadBudget, validateImages, MAX_FILE_BYTES } from '../src/middleware/upload.js';
import { LocalStorage } from '../src/storage/localStorage.js';
import { errorHandler } from '../src/middleware/error.js';

test('real MIME, decoding, pixel and size validation; strips EXIF and rejects active content', async()=>{
  const png=await sharp({create:{width:3,height:3,channels:3,background:'red'}}).png().toBuffer();
  const good=await normalizeImage({originalname:'photo.png',mimetype:'image/png',buffer:png});
  assert.equal((await sharp(good.buffer).metadata()).format,'webp');
  assert.equal((await sharp(good.buffer).metadata()).exif,undefined);
  for(const file of [
    {originalname:'photo.jpg',mimetype:'image/jpeg',buffer:png},
    {originalname:'photo.png',mimetype:'image/png',buffer:Buffer.from('<svg onload="alert(1)"></svg>')},
    {originalname:'photo.svg',mimetype:'image/svg+xml',buffer:png},
    {originalname:'photo.png',mimetype:'image/png',buffer:png.subarray(0,24)},
    {originalname:'photo.png',mimetype:'image/png',buffer:Buffer.alloc(MAX_FILE_BYTES+1)},
  ]) await assert.rejects(()=>normalizeImage(file),e=>[413,415].includes(e.status));
});
test('private storage generates bounded keys and roundtrips bytes; traversal rejected',async()=>{
  const root=await mkdtemp(join(tmpdir(),'impar-storage-test-')),storage=new LocalStorage(root);
  try {
    for(const key of ['../secret.webp','C:\\secret.webp','/tmp/secret.webp','%2e%2e%2fsecret']) assert.throws(()=>storage.path(key));
    const key=randomUUID()+'.webp';
    await storage.put(key,Buffer.from('synthetic'));
    assert.equal((await storage.get(key)).toString(),'synthetic');
    await assert.rejects(()=>storage.put(key,Buffer.from('replacement')));
    assert.equal(await storage.getSignedReadUrl(key),null);
    await storage.delete(key);
    await assert.rejects(()=>storage.get(key));
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('multipart requests enforce limits and malformed upload does not crash the API',async()=>{
  const app=express();
  app.post('/upload',uploadBudget,upload.array('photos',4),validateImages,(_req,res)=>res.sendStatus(201));
  app.use(errorHandler);
  const png=await sharp({create:{width:3,height:3,channels:3,background:'red'}}).png().toBuffer();
  await request(app).post('/upload').attach('photos',png,'x.png').expect(201);
  await request(app).post('/upload').attach('photos',Buffer.from('fake'),'x.png').expect(415);
  await request(app).post('/upload').attach('photos',Buffer.alloc(MAX_FILE_BYTES+1),'x.png').expect(413);
  let many=request(app).post('/upload');
  for(let i=0;i<5;i++)many=many.attach('photos',png,'x.png');
  await many.expect(413);
  const malformed=await request(app).post('/upload').set('Content-Type','multipart/form-data; boundary=broken').send('--broken\r\n');
  assert.equal(malformed.status,400);
  await request(app).post('/upload').attach('photos',png,'x.png').expect(201);
});
