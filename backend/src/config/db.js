import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function createPool(){
  if(process.env.PGLITE_DATA_DIR){
    const {PGlite}=await import('@electric-sql/pglite');
    const {pgcrypto}=await import('@electric-sql/pglite/contrib/pgcrypto');
    const db=new PGlite(process.env.PGLITE_DATA_DIR,{extensions:{pgcrypto}});
    const client=()=>({
      query:db.query.bind(db),
      exec:db.exec.bind(db),
      release(){}
    });
    return {
      query:db.query.bind(db),
      exec:db.exec.bind(db),
      connect:async()=>client(),
      end:()=>db.close(),
      __localPglite:true
    };
  }
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL or PGLITE_DATA_DIR is required');
  return new pg.Pool({connectionString:process.env.DATABASE_URL});
}

export const pool=await createPool();
export const query=(text,params)=>pool.query(text,params);
