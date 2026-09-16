import {createHash} from 'node:crypto';
export const RETRIEVAL_STRATEGY='LEXICAL_SNAPSHOT_V1';
export const RETRIEVAL_MAX_UNITS=8;
export const RETRIEVAL_MAX_CHARS=4000;
const fail=code=>Object.assign(new Error(code),{code});
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function retrieveAuthorizedKnowledge(ids,resolve,{query='impar analysis',maxUnits=RETRIEVAL_MAX_UNITS,maxChars=RETRIEVAL_MAX_CHARS}={}){
 if(!Array.isArray(ids)||!ids.length)throw fail('KNOWLEDGE_NOT_AVAILABLE');
 const units=[];for(const id of [...ids].sort()){
  const resolved=await resolve(id);const content=typeof resolved==='string'?resolved:JSON.stringify(resolved);
  if(!content||content==='{}')throw fail('INVALID_KNOWLEDGE_CONTENT');
  for(const [index,text] of content.split(/\n{2,}/).entries())if(text.trim())units.push({id:`${id}:${index+1}`,authorizedKnowledgeVersionId:id,text:text.trim(),hash:hash(text.trim())});
 }
 const terms=new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
 const selected=units.map(unit=>({...unit,score:[...terms].filter(term=>unit.text.toLowerCase().includes(term)).length})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 let size=0;const bounded=[];for(const unit of selected){if(bounded.length>=maxUnits||size+unit.text.length>maxChars)continue;bounded.push(unit);size+=unit.text.length;}
 if(!bounded.length)throw fail('KNOWLEDGE_NOT_AVAILABLE');
 return {strategy:RETRIEVAL_STRATEGY,version:'1',authorizedKnowledgeVersionIds:[...ids].sort(),units:bounded,context:bounded.map(unit=>({id:unit.id,content:unit.text})),size};
}
