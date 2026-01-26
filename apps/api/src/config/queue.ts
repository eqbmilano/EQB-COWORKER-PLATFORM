import Queue from 'bull';
import { logger } from '../utils/logger.js';

// If no REDIS_URL is provided, export a no-op queue to avoid runtime errors
const REDIS_URL = process.env.REDIS_URL;

class NoopQueue {
  process() {
    logger.warn('Queue disabled: no REDIS_URL configured');
  }
  add() {
    logger.warn('Queue disabled: job not queued because REDIS_URL is missing');
  }
  on() {
    /* no-op */
  }
  clean() {
    /* no-op */
  }
}

export const backlogQueue = REDIS_URL
  ? new Queue('backlog', REDIS_URL, {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    })
  : (new NoopQueue() as unknown as Queue.Queue<any>);

if (REDIS_URL) {
  backlogQueue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} completed:`, result);
  });

  backlogQueue.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  backlogQueue.on('error', (error) => {
    logger.error('Queue error:', error);
  });

  backlogQueue.clean(24 * 60 * 60 * 1000, 'completed');
  backlogQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');

  logger.info('Bull queues initialized');
} else {
  logger.warn('Bull queues disabled: set REDIS_URL to enable background jobs');
}

export default backlogQueue;

