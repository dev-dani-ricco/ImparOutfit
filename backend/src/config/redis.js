import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisRequired = process.env.REDIS_REQUIRED === 'true';

export const redis = redisUrl
  ? createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (!redisRequired) return false;
          return Math.min(retries * 100, 3000);
        },
      },
    })
  : null;

if (redis) {
  redis.on('error', (err) => {
    const message = redisRequired
      ? `Redis error: ${err.message}`
      : `Redis unavailable; continuing without cache (${err.message})`;
    console.warn(message);
  });
}

export async function connectRedis() {
  if (!redis) {
    console.warn('REDIS_URL not set; cache disabled.');
    return null;
  }

  if (redis.isOpen) return redis;

  try {
    await redis.connect();
    console.log('Redis connected');
    return redis;
  } catch (err) {
    if (redisRequired) throw err;
    console.warn(`Redis unavailable; cache disabled (${err.message})`);
    return null;
  }
}
