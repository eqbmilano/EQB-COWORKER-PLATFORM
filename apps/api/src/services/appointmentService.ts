/**
 * Appointment Service
 * Business logic for appointments
 */
import prisma from '../database/client.js';
import { Appointment } from '@prisma/client';
import pino from 'pino';

const logger = pino();

export interface CreateAppointmentInput {
  coworkerId: string;
  clientId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  type: string;
  roomType: 'Training' | 'Treatment';
  roomNumber?: number;
  notes?: string;
}

/**
 * Create a new appointment
 */
export const createAppointment = async (
  input: CreateAppointmentInput
): Promise<Appointment> => {
  try {
    // Check 30-day forward limit
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (input.startTime > thirtyDaysFromNow) {
      throw new Error('Appointments can only be booked up to 30 days in advance');
    }

    // Check availability
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        coworkerId: input.coworkerId,
        roomType: input.roomType,
        status: { in: ['SCHEDULED', 'COMPLETED'] },
        AND: [
          { startTime: { lt: input.endTime } },
          { endTime: { gt: input.startTime } },
        ],
      },
    });

    if (conflictingAppointment) {
      throw new Error('Coworker is not available at this time');
    }

    const appointment = await prisma.appointment.create({
      data: input,
    });

    logger.info(`Appointment created: ${appointment.id}`);
    return appointment;
  } catch (error) {
    logger.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (id: string): Promise<Appointment | null> => {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      coworker: true,
      client: true,
    },
  });
};

/**
 * Get coworker appointments
 */
export const getCoworkerAppointments = async (
  coworkerId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = { coworkerId };

  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = startDate;
    if (endDate) where.startTime.lte = endDate;
  }

  return prisma.appointment.findMany({
    where,
    include: {
      client: true,
      modificationRequests: true,
    },
    orderBy: { startTime: 'asc' },
  });
};

/**
 * Get client appointments
 */
export const getClientAppointments = async (clientId: string) => {
  return prisma.appointment.findMany({
    where: { clientId },
    include: {
      coworker: true,
    },
    orderBy: { startTime: 'desc' },
  });
};

/**
 * Update appointment
 */
export const updateAppointment = async (
  id: string,
  data: Partial<Appointment>
): Promise<Appointment> => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });

    logger.info(`Appointment updated: ${id}`);
    return appointment;
  } catch (error) {
    logger.error('Error updating appointment:', error);
    throw error;
  }
};

/**
 * Cancel appointment (must have 12-hour notice)
 */
export const cancelAppointment = async (
  id: string,
  cancelledBy: string
): Promise<Appointment> => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check 12-hour preavviso
    const now = new Date();
    const hoursUntilAppointment =
      (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 12) {
      throw new Error('Appointment cannot be cancelled within 12 hours');
    }

    const cancelled = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelledBy,
      },
    });

    logger.info(`Appointment cancelled: ${id}`);
    return cancelled;
  } catch (error) {
    logger.error('Error cancelling appointment:', error);
    throw error;
  }
};

/**
 * Complete appointment (mark as completed)
 */
export const completeAppointment = async (id: string): Promise<Appointment> => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });

    logger.info(`Appointment completed: ${id}`);
    return appointment;
  } catch (error) {
    logger.error('Error completing appointment:', error);
    throw error;
  }
};

export default {
  createAppointment,
  getAppointmentById,
  getCoworkerAppointments,
  getClientAppointments,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
};

