import { readPrivateContent } from './privateContentStore.js';

export async function resolvePromptContent(promptVersion){
  if(!promptVersion?.private_content_ref)throw Object.assign(new Error('PROMPT_NOT_AVAILABLE'),{code:'PROMPT_NOT_AVAILABLE'});
  return readPrivateContent(promptVersion.private_content_ref,promptVersion.content_hash,{
    unavailableCode:'PROMPT_NOT_AVAILABLE',
    invalidCode:'INVALID_PROMPT_CONTENT'
  });
}
