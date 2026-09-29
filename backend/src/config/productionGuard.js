import { isAbsolute } from 'node:path';

const loopbackHosts=new Set(['localhost','127.0.0.1','::1']);

function hostOf(value){
  try{return new URL(value).hostname.toLowerCase();}catch{return '';}
}
function isLoopbackUrl(value){
  const host=hostOf(value);
  return host ? loopbackHosts.has(host) : false;
}
function placeholder(value){
  return /change-me|replace-with|example|password|secret$/i.test(String(value||'').trim());
}

export function productionConfigErrors(env=process.env){
  if(env.NODE_ENV!=='production') return [];
  const errors=[];
  if(!env.DATABASE_URL) errors.push('DATABASE_URL_REQUIRED');
  else if(isLoopbackUrl(env.DATABASE_URL)) errors.push('DATABASE_URL_LOOPBACK_FORBIDDEN');

  if(!env.JWT_SECRET || String(env.JWT_SECRET).length<32 || placeholder(env.JWT_SECRET)) errors.push('JWT_SECRET_WEAK_OR_MISSING');

  const externalStorage=Boolean(env.MEDIA_BUCKET&&env.AWS_ENDPOINT_URL_S3&&env.AWS_REGION&&env.AWS_ACCESS_KEY_ID&&env.AWS_SECRET_ACCESS_KEY);
  if(!externalStorage){
    if(!env.MEDIA_ROOT) errors.push('DURABLE_MEDIA_STORAGE_REQUIRED');
    else if(!isAbsolute(env.MEDIA_ROOT)) errors.push('MEDIA_ROOT_MUST_BE_ABSOLUTE');
  }

  const origins=String(env.CORS_ORIGIN||'').split(',').map(v=>v.trim()).filter(Boolean);
  if(!origins.length) errors.push('CORS_ORIGIN_REQUIRED');
  else if(origins.some(origin=>!/^https:\/\//i.test(origin) || isLoopbackUrl(origin))) errors.push('CORS_ORIGIN_HTTPS_REQUIRED');

  const proxy=Number.parseInt(env.TRUST_PROXY_HOPS||'',10);
  if(!Number.isInteger(proxy) || proxy<1) errors.push('TRUST_PROXY_HOPS_REQUIRED');

  if(env.PGLITE_DATA_DIR) errors.push('PGLITE_FORBIDDEN_IN_PRODUCTION');
  if(env.HOST && !['0.0.0.0','::'].includes(env.HOST)) errors.push('HOST_MUST_BIND_ALL_INTERFACES');

  return errors;
}

export function assertProductionConfig(env=process.env){
  const errors=productionConfigErrors(env);
  if(errors.length) throw new Error('PRODUCTION_CONFIG_INVALID:'+errors.join(','));
  return true;
}
