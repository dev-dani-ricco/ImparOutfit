import { query } from '../config/db.js';
import { resolveDaniKnowledgeContent } from './daniKnowledgeContentResolver.js';
import { readPrivateContent } from './privateContentStore.js';

export async function resolveAuthorizedKnowledgeContent(id,db={query}){
  const row=(await db.query(
    'SELECT private_content_ref,content_hash FROM authorized_knowledge_versions WHERE id=$1',
    [id]
  )).rows[0];
  if(!row)throw Object.assign(new Error('KNOWLEDGE_NOT_AVAILABLE'),{code:'KNOWLEDGE_NOT_AVAILABLE'});
  if(row.private_content_ref.startsWith('dani-knowledge://')){
    return resolveDaniKnowledgeContent(row.private_content_ref,row.content_hash);
  }
  return readPrivateContent(row.private_content_ref,row.content_hash,{
    unavailableCode:'KNOWLEDGE_NOT_AVAILABLE',
    invalidCode:'INVALID_KNOWLEDGE_CONTENT'
  });
}
