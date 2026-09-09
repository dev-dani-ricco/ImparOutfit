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
          if (retries >= 5) return new Error('Required Redis unavailable');
          return Math.min(retries * 100, 3000);
        },
      },
    })
  : null;

if (redis) {
  redis.on('error', () => {
    const message = redisRequired
      ? 'Required Redis connection failed'
      : 'Redis unavailable; continuing without cache';
    console.warn(message);
  });
}

export async function connectRedis() {
  if (!redis) {
    if (redisRequired) throw new Error('REDIS_URL required');
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
    console.warn('Redis unavailable; cache disabled');
    return null;
  }
}
