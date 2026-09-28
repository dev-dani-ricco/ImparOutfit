import { createApp } from './app.js';
import { assertAuthConfig } from './middleware/auth.js';
import { connectRedis } from './config/redis.js';
import { startAnalysisSupervisor } from './imparAnalysis/supervisor.js';
import { assertProductionConfig } from './config/productionGuard.js';

assertAuthConfig();
assertProductionConfig();
await connectRedis();

const app=createApp();
const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1');
const port=Number.parseInt(process.env.PORT||'4000',10);
const server=app.listen(port,host,()=>console.log(`API started on ${host}:${port}`));
server.requestTimeout=30_000;
server.headersTimeout=15_000;

const supervisor=process.env.IMPAR_ANALYSIS_SUPERVISOR_ENABLED==='false'
  ? null
  : startAnalysisSupervisor();

server.on('close',()=>supervisor?.stop());
