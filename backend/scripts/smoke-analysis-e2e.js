import 'dotenv/config';
import { randomBytes } from 'node:crypto';

const base='http://127.0.0.1:4000/api';
const suffix=randomBytes(4).toString('hex');
const email=`smoke-${suffix}@example.com`;
const password='Smoke-'+randomBytes(12).toString('hex');

async function call(path,{method='GET',token,body,headers={}}={}){
  const res=await fetch(base+path,{
    method,
    headers:{
      Accept:'application/json',
      ...(body?{'Content-Type':'application/json'}:{}),
      ...(token?{Authorization:`Bearer ${token}`}:{}),
      ...headers
    },
    body:body?JSON.stringify(body):undefined
  });
  const payload=await res.json().catch(()=>null);
  if(!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${payload?.error?.code||payload?.error?.message||''}`);
  return payload;
}

const wait=ms=>new Promise(r=>setTimeout(r,ms));

try{
  const registered=await call('/auth/register',{
    method:'POST',
    body:{name:'Smoke Local',email,password,profileType:'PERSON'}
  });
  const token=registered.token;

  const item=await call('/wardrobe/items',{
    method:'POST',token,
    body:{
      name:'Blazer sintético',
      category:'Blazer',
      color:'Preto',
      sizes:'M',
      ownershipSource:'MANUAL_CATALOG',
      ownershipAttested:true
    }
  });

  const look=await call('/looks',{
    method:'POST',token,
    body:{
      title:'Look sintético de validação',
      items:[{kind:'OWNED_ITEM',wardrobeItemId:item.id}]
    }
  });

  const context=await call('/contexts',{
    method:'POST',token,
    body:{
      occasion:'Reunião profissional sintética',
      objective:'Comunicar clareza e organização',
      provenance:'USER_DECLARED'
    }
  });

  const analysis=await call('/impar-analyses',{
    method:'POST',token,
    body:{lookId:look.id,lookVersionId:look.versionId,contextId:context.id}
  });

  const request=await call(`/impar-analyses/${analysis.id}/requests`,{
    method:'POST',token,body:{},
    headers:{'Idempotency-Key':`smoke-${analysis.id}`}
  });

  let requestState=request;
  let job=null;
  let result=null;
  const deadline=Date.now()+120000;

  while(Date.now()<deadline){
    requestState=await call(`/impar-analyses/${analysis.id}/request`,{token});
    if(requestState.state==='FAILED') throw new Error(`REQUEST_FAILED:${requestState.errorCode||'UNKNOWN'}`);
    if(requestState.jobId){
      job=await call(`/impar-analyses/${analysis.id}/jobs/${requestState.jobId}`,{token});
      if(job.state==='FAILED') throw new Error(`JOB_FAILED:${job.error_code||job.errorCode||'UNKNOWN'}`);
      if(job.state==='SUCCEEDED'){
        const results=await call(`/impar-analyses/${analysis.id}/results`,{token});
        result=results.at(-1)||null;
        break;
      }
    }
    await wait(1500);
  }

  if(!result) throw new Error('TIMEOUT_NO_RESULT');

  console.log('E2E=PASS');
  console.log(`REQUEST_STATE=${requestState.state}`);
  console.log(`JOB_STATE=${job.state}`);
  console.log(`RESULT_STATUS=${result.status}`);
  console.log(`RESULT_VERSION=${result.resultVersion}`);
  console.log(`RESULT_KEYS=${Object.keys(result.payload||{}).sort().join(',')}`);
}catch(error){
  console.log('E2E=FAIL');
  console.log(error.message);
  process.exitCode=1;
}
