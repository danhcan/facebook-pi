import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { messageProcessor } from '../services/message-processor.js';
import { logger } from '../utils/logger.js';

interface MessageJobData {
  messageId: string;
  accountId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  classification: string;
  timestamp: number;
}

let messageWorker: Worker | null = null;

try {
  messageWorker = new Worker<MessageJobData>(
    'message-processing',
    async (job: Job<MessageJobData>) => {
      logger.info({ jobId: job.id, messageId: job.data.messageId }, 'Processing message job');
      await messageProcessor.process(job.data);
      return { success: true };
    },
    {
      connection: redis,
      concurrency: 5,
      limiter: { max: 100, duration: 1000 },
    }
  );

  messageWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Message job completed successfully');
  });

  messageWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Message job failed');
  });

  messageWorker.on('ready', () => {
    logger.info('Message worker ready');
  });
} catch (err) {
  logger.warn('Message worker disabled: Redis not available');
}

process.on('SIGTERM', async () => {
  if (messageWorker) {
    await messageWorker.close();
  }
  process.exit(0);
});

export default messageWorker;
