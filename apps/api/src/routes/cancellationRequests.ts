import express, { type Request, type Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

const reviewRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminMessage: z.string().optional(),
});

/**
 * GET /api/cancellation-requests
 * Get all cancellation requests (admin only)
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin only' });
    }

    const { status } = req.query;

    const requests = await prisma.cancellationRequest.findMany({
      where: status ? { status: status as string } : undefined,
      include: {
        appointment: {
          include: {
            client: true,
            coworker: { include: { user: true } },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    logger.error('Failed to get cancellation requests', { error });
    res.status(500).json({ error: 'Failed to get cancellation requests' });
  }
});

/**
 * PATCH /api/cancellation-requests/:id/review
 * Approve or reject a cancellation request
 */
router.patch('/:id/review', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized - Admin only' });
    }

    const data = reviewRequestSchema.parse(req.body);

    const request = await prisma.cancellationRequest.findUnique({
      where: { id },
      include: { appointment: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request already reviewed' });
    }

    const now = new Date();

    if (data.action === 'approve') {
      const calendarSettings = await prisma.googleCalendarSettings.findFirst({
        where: { syncEnabled: true },
      });

      if (calendarSettings && request.appointment.googleEventId) {
        const googleCalendar = await import('../services/googleCalendar');
        const auth = googleCalendar.createOAuth2Client(calendarSettings.organizationCalendarToken);
        await googleCalendar.deleteCalendarEvent(
          auth,
          calendarSettings.organizationCalendarId,
          request.appointment.googleEventId
        );
      }

      await prisma.appointment.update({
        where: { id: request.appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledBy: user.userId,
        },
      });

      await prisma.cancellationRequest.update({
        where: { id },
        data: {
          status: 'approved',
          reviewedBy: user.userId,
          reviewedAt: now,
          adminMessage: data.adminMessage,
        },
      });

      logger.info('Cancellation request approved', { requestId: id });
      res.json({ message: 'Request approved and appointment cancelled' });
    } else {
      await prisma.cancellationRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedBy: user.userId,
          reviewedAt: now,
          adminMessage: data.adminMessage,
        },
      });

      logger.info('Cancellation request rejected', { requestId: id });
      res.json({ message: 'Request rejected' });
    }
  } catch (error) {
    logger.error('Failed to review cancellation request', { error });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to review request' });
  }
});

export default router;
