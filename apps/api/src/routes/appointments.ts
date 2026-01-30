/**
 * Appointment Routes
 */
import { Router, type Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import appointmentService from '../services/appointmentService.js';
import { emailService } from '../services/emailService.js';
import prisma from '../database/prisma.js';
import { createResponse } from '../types/api.js';
import pino from 'pino';

const logger = pino();
const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateAppointmentSchema = z.object({
  coworkerId: z.string().optional(),
  clientId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  type: z.string(),
  roomType: z.enum(['Training', 'Treatment']),
  roomNumber: z.number().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /appointments
 * Get appointments for authenticated user with optional date filters
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: req.user.sub,
        ...(Object.keys(dateFilter).length > 0 && {
          startTime: dateFilter,
        }),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Transform response
    const transformedAppointments = appointments.map((apt) => ({
      ...apt,
      clientName: apt.client?.name,
    }));

    return res.json(
      createResponse(true, 200, { appointments: transformedAppointments })
    );
  } catch (error) {
    logger.error('Error getting appointments:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to get appointments',
      })
    );
  }
});

/**
 * POST /appointments
 * Create new appointment
 */
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = CreateAppointmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: validation.error.errors,
        })
      );
    }

    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    // Get coworker from authenticated user
    const userId = req.user.sub;
    const coworker = await prisma.coworker.findUnique({
      where: { userId },
    });

    if (!coworker) {
      return res.status(403).json(
        createResponse(false, 403, undefined, {
          code: 'FORBIDDEN',
          message: 'Only coworkers can create appointments',
        })
      );
    }

    const { clientId, startTime, endTime, type, roomType, roomNumber, notes } =
      validation.data;

    const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);

    const appointment = await appointmentService.createAppointment({
      coworkerId: coworker.id,
      clientId,
      userId: req.user.sub,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      durationHours,
      type,
      roomType,
      roomNumber,
      notes,
    });

    // Send confirmation email if client has email
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { email: true, name: true },
    });

    // Fetch user details for coworker name
    const coworkerWithUser = await prisma.coworker.findUnique({
      where: { id: coworker.id },
      include: { user: true },
    });

    if (client?.email && coworkerWithUser) {
      const clientName = client.name;
      const coworkerName = coworkerWithUser.user.name || 'Operatore';
      
      emailService.sendAppointmentConfirmation(
        client.email,
        clientName,
        new Date(startTime),
        durationHours,
        coworkerName,
        notes
      ).catch((error) => {
        logger.error('Failed to send appointment confirmation email:', error);
      });
    }

    return res.status(201).json(
      createResponse(true, 201, { appointment })
    );
  } catch (error: any) {
    logger.error('Error creating appointment:', error);

    if (error.message.includes('12 hours')) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'CANCELLATION_ERROR',
          message: error.message,
        })
      );
    }

    if (error.message.includes('30 days')) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'DATE_ERROR',
          message: error.message,
        })
      );
    }

    if (error.message.includes('not available')) {
      return res.status(409).json(
        createResponse(false, 409, undefined, {
          code: 'CONFLICT',
          message: error.message,
        })
      );
    }

    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to create appointment',
      })
    );
  }
});

/**
 * GET /appointments/:id
 * Get specific appointment
 */
router.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appointment = await appointmentService.getAppointmentById(id);

    if (!appointment) {
      return res.status(404).json(
        createResponse(false, 404, undefined, {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        })
      );
    }

    return res.json(
      createResponse(true, 200, { appointment })
    );
  } catch (error) {
    logger.error('Error getting appointment:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to get appointment',
      })
    );
  }
});

/**
 * DELETE /appointments/:id
 * Cancel appointment
 */
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    const appointment = await appointmentService.cancelAppointment(id, req.user.sub, req.user.sub);

    return res.json(
      createResponse(true, 200, { appointment, message: 'Appointment cancelled' })
    );
  } catch (error: any) {
    logger.error('Error cancelling appointment:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json(
        createResponse(false, 404, undefined, {
          code: 'NOT_FOUND',
          message: error.message,
        })
      );
    }

    if (error.message.includes('12 hours')) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'CANCELLATION_ERROR',
          message: error.message,
        })
      );
    }

    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to cancel appointment',
      })
    );
  }
});

/**
 * PATCH /appointments/:id
 * Update appointment
 */
router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = CreateAppointmentSchema.partial().safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: validation.error.errors,
        })
      );
    }

    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    // Fetch existing appointment with coworker relation
    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { coworker: true },
    });

    if (!existing) {
      return res.status(404).json(
        createResponse(false, 404, undefined, {
          code: 'NOT_FOUND',
          message: 'Appointment not found',
        })
      );
    }

    // Check if user owns this appointment (via coworker relation)
    if (existing.coworker.userId !== req.user.sub) {
      return res.status(403).json(
        createResponse(false, 403, undefined, {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this appointment',
        })
      );
    }

    // Prepare update data
    const updateData: any = validation.data;
    if (validation.data.startTime && validation.data.endTime) {
      const durationHours =
        (new Date(validation.data.endTime).getTime() -
          new Date(validation.data.startTime).getTime()) /
        (1000 * 60 * 60);
      updateData.durationHours = durationHours;
    }

    // Update in database
    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.json(
      createResponse(true, 200, { appointment: updated, message: 'Appointment updated' })
    );
  } catch (error) {
    logger.error('Error updating appointment:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to update appointment',
      })
    );
  }
});

export default router;

