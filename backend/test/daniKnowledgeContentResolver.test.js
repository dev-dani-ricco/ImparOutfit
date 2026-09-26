import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseDaniKnowledgeRef, resolveDaniKnowledgeContent } from '../src/services/daniKnowledgeContentResolver.js';

const projectId='11111111-1111-4111-8111-111111111111';
const knowledgeId='22222222-2222-4222-8222-222222222222';
const ref='dani-knowledge://'+projectId+'/'+knowledgeId;
const content='impar analysis approved dani knowledge';
const hash=createHash('sha256').update(content).digest('hex');

test('dani knowledge ref is strict and project scoped',()=>{
  assert.deepEqual(parseDaniKnowledgeRef(ref),{projectId,knowledgeId});
  assert.throws(()=>parseDaniKnowledgeRef('dani-knowledge://'+projectId+'/../escape'),e=>e.code==='INVALID_KNOWLEDGE_CONTENT');
  assert.throws(()=>parseDaniKnowledgeRef('core-memory://'+projectId+'/'+knowledgeId),e=>e.code==='INVALID_KNOWLEDGE_CONTENT');
  assert.throws(()=>parseDaniKnowledgeRef('private://prompt/v1'),e=>e.code==='INVALID_KNOWLEDGE_CONTENT');
});

test('dani knowledge resolver sends scoped bearer request and verifies hash',async()=>{
  let seen;
  const fetchImpl=async(url,options)=>{
    seen={url:String(url),authorization:options.headers.Authorization};
    return {ok:true,json:async()=>({id:knowledgeId,project_id:projectId,approved:true,content})};
  };
  assert.equal(await resolveDaniKnowledgeContent(ref,hash,{
    fetchImpl,
    baseUrl:'http://127.0.0.1:8080',
    token:'scoped-runtime-token'
  }),content);
  assert.equal(seen.url,'http://127.0.0.1:8080/v1/projects/'+projectId+'/runtime/knowledge/'+knowledgeId);
  assert.equal(seen.authorization,'Bearer scoped-runtime-token');
});

test('dani knowledge resolver fails closed on auth/network/hash failures',async()=>{
  await assert.rejects(
    ()=>resolveDaniKnowledgeContent(ref,hash,{fetchImpl:async()=>({ok:false,status:403}),baseUrl:'http://dani.local',token:'x'}),
    e=>e.code==='KNOWLEDGE_NOT_AVAILABLE'
  );
  await assert.rejects(
    ()=>resolveDaniKnowledgeContent(ref,'0'.repeat(64),{fetchImpl:async()=>({ok:true,json:async()=>({content})}),baseUrl:'http://dani.local',token:'x'}),
    e=>e.code==='INVALID_KNOWLEDGE_CONTENT'
  );
});
