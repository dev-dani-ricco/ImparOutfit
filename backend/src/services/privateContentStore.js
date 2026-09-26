import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute, sep } from 'node:path';

const failure=(code)=>Object.assign(new Error(code),{code});
const sha256=(value)=>createHash('sha256').update(value).digest('hex');

export function resolvePrivateContentPath(ref,root=process.env.IMPAR_PRIVATE_CONTENT_ROOT){
  if(typeof root!=='string'||!root.trim())throw failure('PRIVATE_CONTENT_ROOT_NOT_CONFIGURED');
  if(typeof ref!=='string'||!ref.startsWith('private://'))throw failure('INVALID_PRIVATE_CONTENT_REF');
  const suffix=decodeURIComponent(ref.slice('private://'.length)).replaceAll('/',sep);
  if(!suffix||isAbsolute(suffix)||suffix.split(sep).includes('..'))throw failure('INVALID_PRIVATE_CONTENT_REF');
  const base=resolve(root);
  const target=resolve(base,suffix);
  const rel=relative(base,target);
  if(rel.startsWith('..'+sep)||rel==='..'||isAbsolute(rel))throw failure('INVALID_PRIVATE_CONTENT_REF');
  return target;
}

export async function readPrivateContent(ref,expectedHash,{root,unavailableCode='PRIVATE_CONTENT_NOT_AVAILABLE',invalidCode='INVALID_PRIVATE_CONTENT'}={}){
  let target;
  try{target=resolvePrivateContentPath(ref,root);}catch(error){
    if(error.code==='PRIVATE_CONTENT_ROOT_NOT_CONFIGURED')throw failure(unavailableCode);
    throw failure(invalidCode);
  }
  let content;
  try{content=await readFile(target,'utf8');}catch{throw failure(unavailableCode);}
  if(!content.trim())throw failure(invalidCode);
  if(expectedHash){
    const normalized=String(expectedHash).toLowerCase();
    if(!/^[0-9a-f]{64}$/.test(normalized)||sha256(content)!==normalized)throw failure(invalidCode);
  }
  return content;
}
