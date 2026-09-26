import Constants from 'expo-constants';

function normalizeApiUrl(value){
  return String(value||'').trim().replace(/\/+$/,'');
}

function configuredApiUrl(){
  const fromPublicEnv=typeof process!=='undefined' ? process.env?.EXPO_PUBLIC_API_URL : '';
  const fromExpo=Constants.expoConfig?.extra?.apiUrl;
  return normalizeApiUrl(fromPublicEnv||fromExpo);
}

function isLoopback(url){
  try{
    const parsed=new URL(url);
    return ['localhost','127.0.0.1','::1'].includes(parsed.hostname);
  }catch{
    return false;
  }
}

export const API_URL=configuredApiUrl() || (__DEV__ ? 'http://127.0.0.1:4000/api' : '');

export function assertApiConfiguration(){
  if(!API_URL)throw Object.assign(new Error('API não configurada para este ambiente.'),{code:'API_NOT_CONFIGURED'});
  if(!__DEV__&&isLoopback(API_URL)){
    throw Object.assign(new Error('Build distribuído não pode usar API local.'),{code:'API_LOOPBACK_FORBIDDEN'});
  }
  return API_URL;
}

export async function api(path,{token,method='GET',body,headers={}}={}){
  const base=assertApiConfiguration();
  const res=await fetch(`${base}${path}`,{
    method,
    headers:{
      Accept:'application/json',
      ...(body instanceof FormData?{}:{'Content-Type':'application/json'}),
      ...(token?{Authorization:`Bearer ${token}`}:{}),
      ...headers
    },
    body:body instanceof FormData?body:body?JSON.stringify(body):undefined
  });
  if(!res.ok){
    const payload=await res.json().catch(()=>null);
    const error=payload?.error;
    const message=typeof error==='string'?error:(error?.message||payload?.message||'Não foi possível concluir a operação.');
    const failure=new Error(message);
    failure.status=res.status;
    failure.code=error?.code||payload?.code||null;
    throw failure;
  }
  return res.status===204?null:res.json();
}
