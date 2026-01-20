/**
 * Appointment Routes
 */
import { Router, Response } from 'express';
import { z } from 'zod';
import {
  authMiddleware,
  AuthenticatedRequest,
} from '../middleware/auth';
import appointmentService from '../services/appointmentService';
import { emailService } from '../services/emailService';
import prisma from '../database/prisma';
import { createResponse } from '../types/api';
import pino from 'pino';

const logger = pino();
const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateAppointmentSchema = z.object({
  coworkerId: z.string(),
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
 * Get appointments for authenticated user
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

    // TODO: Get appointments based on user role
    // For now, return empty list
    const appointments = [];

    return res.json(
      createResponse(true, 200, { appointments })
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

    const { coworkerId, clientId, startTime, endTime, type, roomType, roomNumber, notes } =
      validation.data;

    const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);

    const appointment = await appointmentService.createAppointment({
      coworkerId,
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

    const coworker = await prisma.coworker.findUnique({
      where: { id: coworkerId },
      include: { user: true },
    });

    if (client?.email && coworker) {
      const clientName = client.name;
      const coworkerName = coworker.user.name || 'Operatore';
      
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

    const appointment = await appointmentService.cancelAppointment(id, req.user.sub);

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

export default router;
