import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';
const runner=db=>typeof db==='function'?db:db.query.bind(db);
export function capacityFromPolicy(used,limit){
 return {used,limit,available:limit===null?null:Math.max(0,limit-used),isFull:limit!==null&&used>=limit,
 percentage:limit===null?0:limit===0?100:Math.min(100,Math.round(used/limit*100))};
}
export async function getWardrobeCapacity(accountId,db=query,{lock=false}={}){
 const run=runner(db);
 const account=(await run('SELECT person_id FROM accounts WHERE id=$1',[accountId])).rows[0];
 if(!account)throw new HttpError(404,'Pessoa não encontrada');
 if(lock)await run('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[account.person_id]);
 const row=(await run(`SELECT effective_wardrobe_limit($1) AS limit,
 (SELECT count(*)::int FROM wardrobe_items WHERE person_id=$1) used`,[account.person_id])).rows[0];
 return {...capacityFromPolicy(row.used,row.limit),policy:'ENTITLEMENT',plan:{id:null,name:'Acesso por entitlement'}};
}
export async function requireWardrobeSlot(accountId,db){
 const capacity=await getWardrobeCapacity(accountId,db,{lock:true});
 if(capacity.isFull)throw new HttpError(409,'Limite configurado do armário atingido',{code:'WARDROBE_LIMIT_REACHED',details:capacity});
 return capacity;
}
