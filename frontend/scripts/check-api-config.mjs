import { readFile } from 'node:fs/promises';

const app=JSON.parse(await readFile(new URL('../app.json',import.meta.url),'utf8'));
const hardcoded=String(app?.expo?.extra?.apiUrl||'').trim();
const configured=String(process.env.EXPO_PUBLIC_API_URL||'').trim();
const requireDistributed=String(process.env.REQUIRE_DISTRIBUTED_API||'').toLowerCase()==='true';

const loopback=(value)=>{
  if(!value)return false;
  try{
    const host=new URL(value).hostname;
    return ['localhost','127.0.0.1','::1'].includes(host);
  }catch{
    return false;
  }
};

if(hardcoded&&loopback(hardcoded)){
  throw new Error('APP_JSON_LOOPBACK_API_FORBIDDEN');
}
if(requireDistributed&&!configured){
  throw new Error('DISTRIBUTED_API_URL_REQUIRED');
}
if(requireDistributed&&loopback(configured)){
  throw new Error('DISTRIBUTED_API_LOOPBACK_FORBIDDEN');
}
if(configured&&!/^https?:\/\//i.test(configured)){
  throw new Error('API_URL_INVALID');
}

console.log('API_CONFIG_GUARD=PASS');
