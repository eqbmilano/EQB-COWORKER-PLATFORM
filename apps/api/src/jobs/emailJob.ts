import sgMail from '@sendgrid/mail';
import { backlogQueue } from '../config/queue';
import { emailService } from '../services/emailService';
import prisma from '../database/prisma';
import { logger } from '../utils/logger';
import { addDays, subHours } from 'date-fns';

/**
 * Send appointment reminders for appointments happening in 24 hours
 * This job runs every hour
 */
export async function sendAppointmentReminders(): Promise<any> {
  try {
    logger.info('Starting appointment reminder job...');

    const now = new Date();
    const reminderWindow = addDays(now, 1); // 24 hours from now
    const windowStart = subHours(reminderWindow, 1);
    const windowEnd = addDays(windowStart, 0);

    // Get appointments scheduled for approximately 24 hours from now
    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
        status: 'SCHEDULED',
      },
      include: {
        client: true,
        coworker: {
          include: {
            user: true,
          },
        },
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const appointment of appointments) {
      // Only send if client has email
      if (!appointment.client.email) {
        logger.warn(`Skipping reminder for appointment ${appointment.id} - no client email`);
        continue;
      }

      const clientName = appointment.client.name;
      const coworkerName = appointment.coworker.user.name || 'Operatore';

      const success = await emailService.sendAppointmentReminder(
        appointment.client.email,
        clientName,
        appointment.startTime,
        appointment.durationHours,
        coworkerName
      );

      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    const result = {
      totalAppointments: appointments.length,
      remindersSent: sentCount,
      remindersFailed: failedCount,
    };

    logger.info('Appointment reminder job completed:', result);

    return result;
  } catch (error) {
    logger.error('Error in appointment reminder job:', error);
    throw error;
  }
}

/**
 * Initialize email notification jobs
 */
export function initializeEmailJobs(): void {
  const apiKey = process.env.SENDGRID_API_KEY;

  // If no valid SendGrid key, skip scheduling to avoid runtime errors
  if (!apiKey || !apiKey.startsWith('SG.')) {
    logger.warn('SendGrid disabled: invalid or missing SENDGRID_API_KEY');
    return;
  }

  try {
    sgMail.setApiKey(apiKey);
    logger.info('SendGrid initialized');

    backlogQueue.process('appointment-reminders', async (job) => {
      logger.info('Processing appointment reminders job:', job.id);
      return await sendAppointmentReminders();
    });

    backlogQueue.add(
      'appointment-reminders',
      {},
      {
        repeat: {
          cron: '0 * * * *', // Every hour at minute 0
        },
        jobId: 'appointment-reminders-job',
      }
    );

    logger.info('Email notification jobs initialized - Reminders run every hour');
  } catch (error) {
    logger.error('Failed to initialize email jobs:', error);
  }
}
