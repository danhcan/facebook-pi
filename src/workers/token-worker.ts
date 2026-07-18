import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { facebookAuthService } from '../services/facebook-auth.js';
import { logger } from '../utils/logger.js';

interface TokenRefreshJobData {
  accountId: string;
  encryptedToken: string;
}

let tokenWorker: Worker | null = null;

try {
  tokenWorker = new Worker<TokenRefreshJobData>(
    'token-refresh',
    async (job: Job<TokenRefreshJobData>) => {
      const { accountId, encryptedToken } = job.data;
      logger.info({ jobId: job.id, accountId }, 'Processing token refresh');
      try {
        const result = await facebookAuthService.refreshToken(encryptedToken);
        logger.info({ accountId, expiresIn: result.expiresIn }, 'Token refreshed successfully');
        return { success: true, newToken: result.accessToken };
      } catch (error) {
        logger.error({ accountId, error }, 'Token refresh failed');
        throw error;
      }
    },
    { connection: redis, concurrency: 1 }
  );

  tokenWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Token refresh job completed');
  });

  tokenWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Token refresh job failed');
  });
} catch (err) {
  logger.warn('Token worker disabled: Redis not available');
}

process.on('SIGTERM', async () => {
  if (tokenWorker) {
    await tokenWorker.close();
  }
  process.exit(0);
});

export default tokenWorker;
