import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { connectRedis } from './config/redis.js';

dotenv.config();

const app = express();
const configuredOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOrigin = !configuredOrigins?.length || configuredOrigins.includes('*')
  ? '*'
  : configuredOrigins;

// The API sits behind a single local HTTPS proxy (Cloudflare Tunnel).
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60000, limit: 120 }));

app.get('/health', (_req, res) => res.json({ ok: true, name: 'IMPAROutfit API' }));
app.use('/api', routes);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(YAML.load(new URL('../../docs/openapi.yaml', import.meta.url).pathname))
);
app.use(errorHandler);

const port = process.env.PORT || 4000;
connectRedis().catch(console.error);
app.listen(port, () => console.log(`API on ${port}`));
