import { backlogQueue } from '../config/queue.js';
import { backlogService } from '../services/backlogService.js';
import { logger } from '../utils/logger.js';
import { subDays } from 'date-fns';

/**
 * Process backlog for yesterday
 * This job runs daily at 23:59 UTC
 */
export async function processDailyBacklog(): Promise<any> {
  const yesterday = subDays(new Date(), 1);

  try {
    logger.info('Starting daily backlog processing job...');

    const result = await backlogService.processBacklogForDate(yesterday);

    logger.info('Daily backlog processing completed:', result);

    return result;
  } catch (error) {
    logger.error('Error processing daily backlog:', error);
    throw error;
  }
}

/**
 * Process backlog for a specific date (manual trigger)
 */
export async function processBacklogForDate(date: Date): Promise<any> {
  try {
    logger.info(`Processing backlog for specific date: ${date.toISOString()}`);

    const result = await backlogService.processBacklogForDate(date);

    logger.info('Backlog processing completed:', result);

    return result;
  } catch (error) {
    logger.error('Error processing backlog for date:', error);
    throw error;
  }
}

/**
 * Initialize backlog job processor
 */
export function initializeBacklogJobs(): void {
  // Process daily backlog job
  backlogQueue.process('daily-backlog', async (job) => {
    logger.info('Processing daily backlog job:', job.id);
    return await processDailyBacklog();
  });

  // Process specific date backlog job
  backlogQueue.process('process-date', async (job) => {
    const { date } = job.data;
    logger.info(`Processing backlog for date: ${date}`);
    return await processBacklogForDate(new Date(date));
  });

  // Schedule daily backlog job at 23:59 UTC
  backlogQueue.add(
    'daily-backlog',
    {},
    {
      repeat: {
        cron: '59 23 * * *', // Every day at 23:59
        tz: 'UTC',
      },
      jobId: 'daily-backlog-job',
    }
  );

  logger.info('Backlog jobs initialized - Daily job scheduled for 23:59 UTC');
}

/**
 * Trigger manual backlog processing for a date range
 */
export async function triggerBacklogProcessing(startDate: Date, endDate: Date): Promise<void> {
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    await backlogQueue.add('process-date', {
      date: currentDate.toISOString(),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  logger.info(`Queued backlog processing for date range: ${startDate} to ${endDate}`);
}

