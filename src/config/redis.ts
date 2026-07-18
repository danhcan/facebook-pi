import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

function createRedis(url: string): Redis {
  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      if (times > 10) {
        logger.warn('Redis: max retries reached, stopping reconnection');
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('error', (err: Error) => {
    // Silently ignore repeated connection errors to avoid log spam
  });

  return client;
}

export const redis = createRedis(config.redis.url);

redis.connect().catch(() => {});

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
