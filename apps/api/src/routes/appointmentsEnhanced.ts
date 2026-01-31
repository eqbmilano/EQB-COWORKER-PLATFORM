/**
 * Extended Appointment Routes for Google Calendar Integration
 */
import { Router, type Response } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import prisma from '../database/prisma.js';
import { createResponse } from '../types/api.js';
import * as googleCalendar from '../services/googleCalendar';
import pino from 'pino';

const logger = pino();
const router = Router();

// Validation schemas
const createEnhancedAppointmentSchema = z.object({
  clientId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.string(),
  roomType: z.enum(['Training', 'Treatment']),
  roomNumber: z.number().optional(),
  notes: z.string().optional(),
  isOnline: z.boolean().default(false),
});

const cancelRequestSchema = z.object({
  reason: z.string().min(10),
  notes: z.string().optional(),
  urgency: z.enum(['normal', 'urgent']).default('normal'),
});

/**
 * POST /appointments/enhanced
 * Create appointment with Google Calendar sync
 */
router.post('/enhanced', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(createResponse(false, 401, undefined, { code: 'UNAUTHORIZED' }));
    }

    const data = createEnhancedAppointmentSchema.parse(req.body);
    
    // Get coworker profile
    const coworker = await prisma.coworker.findUnique({
      where: { userId: req.user.userId },
      include: { user: true },
    });

    if (!coworker) {
      return res.status(404).json(createResponse(false, 404, undefined, { message: 'Coworker profile not found' }));
    }

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Calculate buffer end time
    const bufferEndTime = new Date(endTime);
    bufferEndTime.setMinutes(bufferEndTime.getMinutes() + coworker.bufferTimeMinutes);

    // Get Google Calendar settings
    const calendarSettings = await prisma.googleCalendarSettings.findFirst({
      where: { syncEnabled: true },
    });

    if (!calendarSettings) {
      return res.status(500).json(createResponse(false, 500, undefined, { message: 'Google Calendar not configured' }));
    }

    // Check conflicts
    const auth = googleCalendar.createOAuth2Client(calendarSettings.organizationCalendarToken);
    const hasConflict = await googleCalendar.checkTimeConflicts(
      auth,
      calendarSettings.organizationCalendarId,
      startTime,
      bufferEndTime
    );

    if (hasConflict) {
      return res.status(409).json(createResponse(false, 409, undefined, { message: 'Time slot not available' }));
    }

    // Get client
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) {
      return res.status(404).json(createResponse(false, 404, undefined, { message: 'Client not found' }));
    }

    // Create Google Calendar event
    const eventId = await googleCalendar.createCalendarEvent(
      auth,
      calendarSettings.organizationCalendarId,
      {
        summary: `${data.type} - ${client.name}`,
        description: `Coworker: ${coworker.companyName || coworker.user.name}\nClient: ${client.name}\nNotes: ${data.notes || 'N/A'}`,
        startTime,
        endTime: bufferEndTime,
        attendees: [client.email, coworker.user.email],
        location: data.isOnline ? 'Online' : `Room ${data.roomNumber || 'TBD'}`,
        isOnline: data.isOnline,
      }
    );

    // Get Google Meet link if online
    let googleMeetLink = null;
    if (data.isOnline) {
      googleMeetLink = await googleCalendar.getGoogleMeetLink(
        auth,
        calendarSettings.organizationCalendarId,
        eventId
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        coworkerId: coworker.id,
        clientId: data.clientId,
        userId: req.user.userId,
        startTime,
        endTime,
        durationHours,
        type: data.type,
        notes: data.notes,
        status: 'SCHEDULED',
        roomType: data.roomType,
        roomNumber: data.roomNumber,
        googleEventId: eventId,
        googleMeetLink,
        bookingSource: 'manual',
        isOnline: data.isOnline,
        bufferEndTime,
        reminderSent: false,
      },
      include: {
        coworker: { include: { user: true } },
        client: true,
      },
    });

    logger.info('Enhanced appointment created', { appointmentId: appointment.id });
    res.status(201).json(createResponse(true, 201, appointment));
  } catch (error) {
    logger.error('Failed to create enhanced appointment', { error });
    if (error instanceof z.ZodError) {
      return res.status(400).json(createResponse(false, 400, undefined, { details: error.errors }));
    }
    res.status(500).json(createResponse(false, 500, undefined, { message: 'Failed to create appointment' }));
  }
});

/**
 * GET /appointments/availability/:coworkerId
 * Get available slots for a coworker
 */
router.get('/availability/:coworkerId', async (req, res: Response) => {
  try {
    const { coworkerId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json(createResponse(false, 400, undefined, { message: 'Date parameter required' }));
    }

    const targetDate = new Date(date as string);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'lowercase' });

    const coworker = await prisma.coworker.findUnique({ where: { id: coworkerId } });
    if (!coworker) {
      return res.status(404).json(createResponse(false, 404, undefined, { message: 'Coworker not found' }));
    }

    const workingHours = coworker.workingHours ? JSON.parse(coworker.workingHours) : null;
    if (!workingHours || !workingHours[dayOfWeek]) {
      return res.json(createResponse(true, 200, { slots: [] }));
    }

    const calendarSettings = await prisma.googleCalendarSettings.findFirst({ where: { syncEnabled: true } });
    if (!calendarSettings) {
      return res.status(500).json(createResponse(false, 500, undefined, { message: 'Calendar not configured' }));
    }

    const auth = googleCalendar.createOAuth2Client(calendarSettings.organizationCalendarToken);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const eqbEvents = await googleCalendar.getCalendarEvents(
      auth,
      calendarSettings.organizationCalendarId,
      startOfDay,
      endOfDay
    );

    let personalEvents: any[] = [];
    if (coworker.googleCalendarId && coworker.googleCalendarToken) {
      const coworkerAuth = googleCalendar.createOAuth2Client(coworker.googleCalendarToken);
      personalEvents = await googleCalendar.getCalendarEvents(
        coworkerAuth,
        coworker.googleCalendarId,
        startOfDay,
        endOfDay
      );
    }

    const allEvents = [...eqbEvents, ...personalEvents];
    const availableSlots = googleCalendar.calculateAvailableSlots(
      workingHours[dayOfWeek],
      allEvents,
      coworker.bufferTimeMinutes,
      targetDate
    );

    res.json(createResponse(true, 200, {
      slots: availableSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      })),
    }));
  } catch (error) {
    logger.error('Failed to get availability', { error });
    res.status(500).json(createResponse(false, 500, undefined, { message: 'Failed to get availability' }));
  }
});

/**
 * POST /appointments/:id/cancel-request
 * Create cancellation request (for appointments < 12h away)
 */
router.post('/:id/cancel-request', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(createResponse(false, 401, undefined, { code: 'UNAUTHORIZED' }));
    }

    const { id } = req.params;
    const data = cancelRequestSchema.parse(req.body);

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { coworker: true },
    });

    if (!appointment) {
      return res.status(404).json(createResponse(false, 404, undefined, { message: 'Appointment not found' }));
    }

    if (appointment.coworker.userId !== req.user.userId) {
      return res.status(403).json(createResponse(false, 403, undefined, { message: 'Unauthorized' }));
    }

    const now = new Date();
    const hoursUntil = (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil > 12) {
      return res.status(400).json(createResponse(false, 400, undefined, {
        message: 'Use regular cancellation for appointments > 12h away',
      }));
    }

    const request = await prisma.cancellationRequest.create({
      data: {
        appointmentId: id,
        coworkerId: appointment.coworkerId,
        clientId: appointment.clientId,
        requestedAt: now,
        appointmentDate: appointment.startTime,
        hoursUntilAppointment: hoursUntil,
        reason: data.reason,
        notes: data.notes,
        urgency: data.urgency,
        status: 'pending',
      },
    });

    logger.info('Cancellation request created', { requestId: request.id });
    res.status(202).json(createResponse(true, 202, {
      message: 'Cancellation request submitted for admin approval',
      request,
    }));
  } catch (error) {
    logger.error('Failed to create cancellation request', { error });
    if (error instanceof z.ZodError) {
      return res.status(400).json(createResponse(false, 400, undefined, { details: error.errors }));
    }
    res.status(500).json(createResponse(false, 500, undefined, { message: 'Failed to create request' }));
  }
});

export default router;
