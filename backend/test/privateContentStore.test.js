import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readPrivateContent, resolvePrivateContentPath } from '../src/services/privateContentStore.js';

const hash=(value)=>createHash('sha256').update(value).digest('hex');

test('private content store reads only inside configured root and validates hash', async()=>{
  const root=await mkdtemp(join(tmpdir(),'impar-private-store-'));
  try{
    await mkdir(join(root,'prompt'),{recursive:true});
    const content='impar analysis governed private content';
    await writeFile(join(root,'prompt','v1'),content,'utf8');

    assert.equal(
      await readPrivateContent('private://prompt/v1',hash(content),{root}),
      content
    );
    assert.equal(
      resolvePrivateContentPath('private://prompt/v1',root),
      join(root,'prompt','v1')
    );
    await assert.rejects(
      ()=>readPrivateContent('private://prompt/v1','0'.repeat(64),{root,invalidCode:'INVALID_PROMPT_CONTENT'}),
      error=>error.code==='INVALID_PROMPT_CONTENT'
    );
    await assert.rejects(
      ()=>readPrivateContent('private://../escape',null,{root,invalidCode:'INVALID_PROMPT_CONTENT'}),
      error=>error.code==='INVALID_PROMPT_CONTENT'
    );
  } finally {
    await rm(root,{recursive:true,force:true});
  }
});
