import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { historyExporter } from '../services/history-exporter.js';
import { logger } from '../utils/logger.js';

interface ExportJobData {
  userId: string;
  format: 'json' | 'csv';
  startDate?: string;
  endDate?: string;
}

let exportWorker: Worker | null = null;

try {
  exportWorker = new Worker<ExportJobData>(
    'export',
    async (job: Job<ExportJobData>) => {
      const { userId, format, startDate, endDate } = job.data;
      logger.info({ jobId: job.id, userId, format }, 'Processing export job');
      const options = {
        format,
        userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };
      const buffer = await historyExporter.exportConversations(options);
      logger.info({ jobId: job.id, size: buffer.length }, 'Export completed');
      return { success: true, size: buffer.length };
    },
    { connection: redis, concurrency: 3 }
  );

  exportWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Export job completed');
  });

  exportWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Export job failed');
  });
} catch (err) {
  logger.warn('Export worker disabled: Redis not available');
}

process.on('SIGTERM', async () => {
  if (exportWorker) {
    await exportWorker.close();
  }
  process.exit(0);
});

export default exportWorker;
