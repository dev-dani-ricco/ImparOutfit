import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { query } from './config/db.js';

export function createApp() {
  const app=express();
  app.disable('x-powered-by');
  app.set('query parser','simple');
  app.set('trust proxy',process.env.TRUST_PROXY_HOPS ? Number(process.env.TRUST_PROXY_HOPS) : false);
  app.use(helmet());
  app.use(cors({origin:process.env.CORS_ORIGIN?.split(',').map(s=>s.trim()).filter(Boolean)||false}));
  app.use(rateLimit({windowMs:60_000,limit:120,standardHeaders:'draft-7',legacyHeaders:false}));
  app.use(express.json({limit:'128kb'}));
  app.get('/health',(_req,res)=>res.json({ok:true,name:'UNIVERSO ÍMPAR API'}));
  app.get('/ready',async(_req,res)=>{
    try { await query("SELECT 1 FROM schema_migrations WHERE version='009_reconstruction.sql'").then(r=>{if(!r.rows.length)throw new Error('schema');}); res.json({ok:true}); }
    catch { res.status(503).json({ok:false}); }
  });
  app.use('/api',(req,res,next)=>{ if(req.headers.authorization)res.set('Cache-Control','private, no-store'); next(); },routes);
  const spec=YAML.parse(readFileSync(fileURLToPath(new URL('../../docs/openapi.yaml',import.meta.url)),'utf8'));
  app.use('/api-docs',swaggerUi.serve,swaggerUi.setup(spec));
  app.use((_req,res)=>res.status(404).json({error:'Rota não encontrada'}));
  app.use(errorHandler);
  return app;
}
