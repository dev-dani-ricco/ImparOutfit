import { createApp } from './app.js';
import { assertAuthConfig } from './middleware/auth.js';
import { connectRedis } from './config/redis.js';

assertAuthConfig();
if(process.env.NODE_ENV==='production' && !process.env.MEDIA_ROOT) throw new Error('Production requires explicit durable MEDIA_ROOT');
await connectRedis();
const app=createApp();
const server=app.listen(process.env.PORT||4000,()=>console.log('API started'));
server.requestTimeout=30_000;
server.headersTimeout=15_000;
