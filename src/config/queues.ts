import { Queue, QueueEvents } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

function createQueue(name: string, opts?: object): Queue | null {
  if (redis.status !== 'ready' && redis.status !== 'connect') {
    logger.warn({ queue: name }, 'Redis not available, queue disabled');
    return null;
  }
  try {
    return new Queue(name, { connection: redis, ...opts });
  } catch (err) {
    logger.warn({ queue: name, err }, 'Failed to create queue');
    return null;
  }
}

function createQueueEvents(name: string): QueueEvents | null {
  try {
    return new QueueEvents(name, { connection: redis });
  } catch (err) {
    logger.warn({ queue: name, err }, 'Failed to create queue events');
    return null;
  }
}

// Message processing queue
export const messageQueue = createQueue('message-processing', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 1000 },
  },
})!;

// Export queue
export const exportQueue = createQueue('data-export', {
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed' as const, delay: 5000 },
  },
})!;

// Queue events for monitoring
const messageQueueEvents = createQueueEvents('message-processing');
const exportQueueEvents = createQueueEvents('data-export');

if (messageQueueEvents) {
  messageQueueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'Message job completed');
  });
  messageQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'Message job failed');
  });
}

if (exportQueueEvents) {
  exportQueueEvents.on('completed', ({ jobId }) => {
    logger.info({ jobId }, 'Export job completed');
  });
  exportQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error({ jobId, failedReason }, 'Export job failed');
  });
}
