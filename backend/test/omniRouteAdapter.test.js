import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOmniRouteAdapter,parseJsonObject} from '../src/ai/omniRouteAdapter.js';

test('OmniRoute adapter uses local OpenAI-compatible HTTP contract without exposing key in payload',async()=>{
  let captured;
  const adapter=createOmniRouteAdapter({
    apiKey:'synthetic-secret',
    baseUrl:'http://127.0.0.1:20128',
    model:'openai/gpt-oss-120b',
    fetchImpl:async(url,options)=>{
      captured={url,options};
      return {
        ok:true,
        async json(){return {
          choices:[{message:{content:'{"summary":"ok"}',reasoning:'private reasoning must be ignored'}}],
          usage:{prompt_tokens:12,completion_tokens:7,total_tokens:19}
        };}
      };
    }
  });

  const out=await adapter.execute({
    instruction:'Synthetic private instruction',
    input:{analysisId:'a',knowledgeContext:[{id:'k',content:'impar analysis'}]}
  });

  assert.deepEqual(out,{output:{summary:'ok'},usage:{inputTokens:12,outputTokens:7,totalTokens:19}});
  assert.equal(captured.url,'http://127.0.0.1:20128/v1/chat/completions');
  assert.equal(captured.options.headers.Authorization,'Bearer synthetic-secret');
  const body=JSON.parse(captured.options.body);
  assert.equal(body.model,'openai/gpt-oss-120b');
  assert.ok(!captured.options.body.includes('synthetic-secret'));
  assert.equal(body.stream,false);
});

test('OmniRoute adapter rejects reasoning-only or non-JSON output',async()=>{
  assert.throws(()=>parseJsonObject({choices:[{message:{content:'',reasoning:'hidden'}}]}),e=>e.code==='INVALID_PROVIDER_RESPONSE');
  assert.throws(()=>parseJsonObject({choices:[{message:{content:'not json'}}]}),e=>e.code==='INVALID_PROVIDER_RESPONSE');
});
