import {createHash} from 'node:crypto';
import {HttpError} from '../utils/http.js';

// These primitives intentionally know no Job table, owner, authorization,
// state machine, Attempt, worker, or result. Domains compose them locally.
export const sha256Json=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function normalizeIdempotencyKey(value){
 if(value===undefined||value===null)return null;
 if(!/^[\x21-\x7e]{1,128}$/.test(value))throw new HttpError(400,'Idempotency-Key inválida');
 return value;
}

export function retryWithinBudget(attempt,maxRetries){return attempt<=maxRetries;}

export async function withTransaction(pool,work){
 const client=await pool.connect();
 try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}
 catch(error){await client.query('ROLLBACK');throw error;}
 finally{client.release();}
}
