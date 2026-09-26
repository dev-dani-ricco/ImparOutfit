import { createHash } from 'node:crypto';

const fail=(code)=>Object.assign(new Error(code),{code});
const sha256=(value)=>createHash('sha256').update(value).digest('hex');

export function parseDaniKnowledgeRef(ref){
  if(typeof ref!=='string'||!ref.startsWith('dani-knowledge://'))throw fail('INVALID_KNOWLEDGE_CONTENT');
  const parts=ref.slice('dani-knowledge://'.length).split('/').filter(Boolean);
  if(parts.length!==2)throw fail('INVALID_KNOWLEDGE_CONTENT');
  const [projectId,knowledgeId]=parts;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!uuid.test(projectId)||!uuid.test(knowledgeId))throw fail('INVALID_KNOWLEDGE_CONTENT');
  return {projectId,knowledgeId};
}

export async function resolveDaniKnowledgeContent(
  ref,
  expectedHash,
  {
    fetchImpl=globalThis.fetch,
    baseUrl=process.env.DANI_KNOWLEDGE_BASE_URL,
    token=process.env.DANI_KNOWLEDGE_RUNTIME_TOKEN,
    timeoutMs=Number.parseInt(process.env.DANI_KNOWLEDGE_RUNTIME_TIMEOUT_MS??'8000',10)
  }={}
){
  if(typeof fetchImpl!=='function'||!baseUrl||!token)throw fail('KNOWLEDGE_NOT_AVAILABLE');
  const {projectId,knowledgeId}=parseDaniKnowledgeRef(ref);
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),Number.isFinite(timeoutMs)&&timeoutMs>0?timeoutMs:8000);
  let response;
  try{
    response=await fetchImpl(
      new URL('/v1/projects/'+projectId+'/runtime/knowledge/'+knowledgeId,baseUrl),
      {headers:{Authorization:'Bearer '+token},signal:controller.signal}
    );
  }catch{
    throw fail('KNOWLEDGE_NOT_AVAILABLE');
  }finally{
    clearTimeout(timeout);
  }
  if(!response?.ok)throw fail('KNOWLEDGE_NOT_AVAILABLE');
  let payload;
  try{payload=await response.json();}catch{throw fail('INVALID_KNOWLEDGE_CONTENT');}
  const content=payload?.content;
  if(typeof content!=='string'||!content.trim())throw fail('INVALID_KNOWLEDGE_CONTENT');
  if(expectedHash){
    const normalized=String(expectedHash).toLowerCase();
    if(!/^[0-9a-f]{64}$/.test(normalized)||sha256(content)!==normalized)throw fail('INVALID_KNOWLEDGE_CONTENT');
  }
  return content;
}
