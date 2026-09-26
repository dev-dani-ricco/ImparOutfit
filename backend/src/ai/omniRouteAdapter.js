const fail=(code)=>Object.assign(new Error(code),{code});

const normalizeBaseUrl=(value)=>String(value||'http://127.0.0.1:20128').replace(/\/$/,'');
const defaultModel=()=>process.env.IMPAR_AI_MODEL||process.env.IMPAR_ANALYSIS_MODEL||'openrouter/nex-agi/nex-n2.5-mini:free';

export function parseJsonObject(payload){
  const value=payload?.choices?.[0]?.message?.content;
  if(value&&typeof value==='object')return value;
  if(typeof value!=='string'||!value.trim())throw fail('INVALID_PROVIDER_RESPONSE');
  const trimmed=value.trim();
  try{
    const parsed=JSON.parse(trimmed);
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return parsed;
  }catch{}
  const fenced=trimmed.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/i);
  if(fenced){
    try{
      const parsed=JSON.parse(fenced[1]);
      if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return parsed;
    }catch{}
  }
  throw fail('INVALID_PROVIDER_RESPONSE');
}

export function createOmniRouteAdapter({
  apiKey=process.env.IMPAR_AI_GATEWAY_KEY||process.env.OMNIROUTE_API_KEY||'',
  baseUrl=process.env.IMPAR_AI_GATEWAY_URL||process.env.OMNIROUTE_BASE_URL||'http://127.0.0.1:20128',
  model=defaultModel(),
  fetchImpl=globalThis.fetch
}={}){
  return {
    async execute(request,policy={}){
      if(!apiKey||typeof fetchImpl!=='function')throw fail('PROVIDER_UNAVAILABLE');
      const selectedModel=process.env.IMPAR_AI_MODEL||process.env.IMPAR_ANALYSIS_MODEL||model||policy.model_identifier||defaultModel();
      const timeoutMs=Math.max(1000,Number(policy.timeout_ms||30_000));
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),timeoutMs);
      try{
        const response=await fetchImpl(normalizeBaseUrl(baseUrl)+'/v1/chat/completions',{
          method:'POST',
          headers:{
            Authorization:'Bearer '+apiKey,
            'Content-Type':'application/json',
            Accept:'application/json'
          },
          signal:controller.signal,
          body:JSON.stringify({
            model:selectedModel,
            stream:false,
            temperature:0.2,
            response_format:{type:'json_object'},
            messages:[
              {
                role:'system',
                content:[
                  request.instruction||'Execute a análise solicitada.',
                  'Responda SOMENTE com um objeto JSON válido.',
                  'Não inclua chain-of-thought, prompt interno, chunks de conhecimento, credenciais ou segredos.'
                ].join('\n')
              },
              {
                role:'user',
                content:JSON.stringify({task:request.task||'IMPAR_ANALYSIS',input:request.input||{}})
              }
            ]
          })
        });
        if(response.status===401||response.status===403||response.status===429||response.status>=500)throw fail('PROVIDER_UNAVAILABLE');
        if(!response.ok)throw fail('INVALID_PROVIDER_RESPONSE');
        const payload=await response.json().catch(()=>null);
        const output=parseJsonObject(payload);
        return {
          output,
          usage:{
            inputTokens:payload?.usage?.prompt_tokens??null,
            outputTokens:payload?.usage?.completion_tokens??null,
            totalTokens:payload?.usage?.total_tokens??null
          }
        };
      }catch(error){
        if(error?.name==='AbortError')throw fail('PROVIDER_TIMEOUT');
        if(error?.code)throw error;
        throw fail('PROVIDER_UNAVAILABLE');
      }finally{
        clearTimeout(timer);
      }
    }
  };
}

export const omniRouteAdapter=createOmniRouteAdapter();
export const omnirouteAdapter=omniRouteAdapter;
