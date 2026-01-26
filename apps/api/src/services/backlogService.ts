import prisma from '../database/prisma.js';
import { logger } from '../utils/logger.js';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';

export interface BacklogStatistics {
  totalHours: number;
  completedAppointments: number;
  averageHoursPerDay: number;
  remainingCapacity: number;
}

export interface MonthlyRecapData {
  month: string;
  year: number;
  totalHours: number;
  totalAppointments: number;
  dailyAverage: number;
  capacityUsed: number; // Percentage
}

export class BacklogService {
  private readonly MONTHLY_CAPACITY = 1500; // Hours per month

  /**
   * Calculate and create backlog entries for a specific date
   */
  async processBacklogForDate(date: Date): Promise<any> {
    const dateStart = startOfDay(date);
    const dateEnd = endOfDay(date);

    logger.info(`Processing backlog for date: ${format(date, 'yyyy-MM-dd')}`);

    // Get all completed appointments for the date
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
        status: 'COMPLETED',
      },
      include: {
        coworker: {
          include: {
            user: true,
          },
        },
        client: true,
      },
    });

    if (completedAppointments.length === 0) {
      logger.info(`No completed appointments found for ${format(date, 'yyyy-MM-dd')}`);
      return {
        date: format(date, 'yyyy-MM-dd'),
        totalHours: 0,
        appointmentsProcessed: 0,
        entriesCreated: 0,
      };
    }

    // Group appointments by coworker
    const appointmentsByCoworker = completedAppointments.reduce((acc, appointment) => {
      const coworkerId = appointment.coworkerId;
      if (!acc[coworkerId]) {
        acc[coworkerId] = [];
      }
      acc[coworkerId].push(appointment);
      return acc;
    }, {} as Record<string, typeof completedAppointments>);

    let entriesCreated = 0;
    let totalHours = 0;

    // Create backlog entries for each coworker
    for (const [coworkerId, appointments] of Object.entries(appointmentsByCoworker)) {
      const hoursWorked = appointments.reduce((sum, apt) => sum + (apt.duration || 0), 0);
      totalHours += hoursWorked;

      // Create a backlog entry for each appointment
      for (const apt of appointments) {
        // Check if entry already exists
        const existingEntry = await prisma.backlogEntry.findUnique({
          where: { appointmentId: apt.id },
        });

        if (existingEntry) {
          logger.debug(`Backlog entry already exists for appointment: ${apt.id}`);
          continue;
        }

        const roomType = apt.type || 'Training';
        
        // Create backlog entry
        await prisma.backlogEntry.create({
          data: {
            appointmentId: apt.id,
            coworkerId,
            hoursWorked: apt.duration || 0,
            roomType,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            dayWorked: date.getDate(),
            status: 'OPEN',
          },
        });
        entriesCreated++;
        logger.info(`Created backlog entry for coworker ${coworkerId}: ${apt.duration}h`);
      }
    }

    // Update monthly recap
    await this.updateMonthlyRecap(date);

    return {
      date: format(date, 'yyyy-MM-dd'),
      totalHours,
      appointmentsProcessed: completedAppointments.length,
      entriesCreated,
    };
  }

  /**
   * Update or create monthly recap for the given date's month
   */
  async updateMonthlyRecap(date: Date): Promise<void> {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Get all backlog entries for the month grouped by coworker
    const monthlyEntries = await prisma.backlogEntry.findMany({
      where: {
        month,
        year,
      },
    });

    // Group by coworker
    const entriesByCoworker = monthlyEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.coworkerId]) {
          acc[entry.coworkerId] = [];
        }
        acc[entry.coworkerId].push(entry);
        return acc;
      },
      {} as Record<string, typeof monthlyEntries>
    );

    // Create/update recap for each coworker
    for (const [coworkerId, entries] of Object.entries(entriesByCoworker)) {
      const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
      const trainingHours = entries
        .filter((e) => e.roomType === 'Training')
        .reduce((sum, e) => sum + e.hoursWorked, 0);
      const treatmentHours = entries
        .filter((e) => e.roomType === 'Treatment')
        .reduce((sum, e) => sum + e.hoursWorked, 0);
      const appointmentCount = entries.length;

      const existingRecap = await prisma.monthlyRecap.findUnique({
        where: {
          coworkerId_year_month: {
            coworkerId,
            year,
            month,
          },
        },
      });

      const recapData = {
        totalHours,
        trainingHours,
        treatmentHours,
        appointmentCount,
      };

      if (existingRecap) {
        await prisma.monthlyRecap.update({
          where: { id: existingRecap.id },
          data: recapData,
        });
        logger.info(`Updated monthly recap for coworker ${coworkerId}: ${month}/${year} - ${totalHours}h`);
      } else {
        await prisma.monthlyRecap.create({
          data: {
            coworkerId,
            year,
            month,
            ...recapData,
          },
        });
        logger.info(`Created monthly recap for coworker ${coworkerId}: ${month}/${year} - ${totalHours}h`);
      }
    }

    // Check capacity limit
    const totalMonthlyHours = monthlyEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    if (totalMonthlyHours > this.MONTHLY_CAPACITY) {
      logger.warn(
        `⚠️ Monthly capacity exceeded for ${month}/${year}: ${totalMonthlyHours}h / ${this.MONTHLY_CAPACITY}h`
      );
    }
  }

  /**
   * Get backlog entries for a specific date range
   */
  async getBacklogEntries(
    startDate: Date,
    endDate: Date,
    coworkerId?: string
  ): Promise<any[]> {
    const startMonth = startDate.getMonth() + 1;
    const startYear = startDate.getFullYear();
    const endMonth = endDate.getMonth() + 1;
    const endYear = endDate.getFullYear();

    const entries = await prisma.backlogEntry.findMany({
      where: {
        OR: [
          {
            AND: [
              { year: startYear },
              { month: { gte: startMonth } },
            ],
          },
          {
            AND: [
              { year: { gt: startYear } },
              { year: { lt: endYear } },
            ],
          },
          {
            AND: [
              { year: endYear },
              { month: { lte: endMonth } },
            ],
          },
        ],
        ...(coworkerId && { coworkerId }),
      },
      include: {
        coworker: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { dayWorked: 'desc' },
      ],
    });

    return entries;
  }

  /**
   * Get statistics for a date range
   */
  async getBacklogStatistics(
    startDate: Date,
    endDate: Date,
    coworkerId?: string
  ): Promise<BacklogStatistics> {
    const entries = await this.getBacklogEntries(startDate, endDate, coworkerId);

    const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const completedAppointments = entries.length;

    const daysCount = new Set(entries.map((e) => `${e.year}-${e.month}-${e.dayWorked}`)).size || 1;
    const averageHoursPerDay = totalHours / daysCount;

    // Calculate remaining capacity for current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyEntries = await this.getBacklogEntries(monthStart, monthEnd, coworkerId);
    const monthlyHours = monthlyEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const remainingCapacity = Math.max(0, this.MONTHLY_CAPACITY - monthlyHours);

    return {
      totalHours,
      completedAppointments,
      averageHoursPerDay,
      remainingCapacity,
    };
  }

  /**
   * Get monthly recap data
   */
  async getMonthlyRecap(month: string, year: number): Promise<MonthlyRecapData | null> {
    const recap = await prisma.monthlyRecap.findFirst({
      where: {
        month,
        year,
      },
    });

    if (!recap) {
      return null;
    }

    // Calculate days in month for average
    const date = new Date(year, getMonthNumber(month), 1);
    const daysInMonth = new Date(year, getMonthNumber(month) + 1, 0).getDate();
    const dailyAverage = recap.totalHours / daysInMonth;
    const capacityUsed = (recap.totalHours / this.MONTHLY_CAPACITY) * 100;

    return {
      month: recap.month,
      year: recap.year,
      totalHours: recap.totalHours,
      totalAppointments: recap.totalAppointments,
      dailyAverage,
      capacityUsed,
    };
  }

  /**
   * Get all monthly recaps
   */
  async getAllMonthlyRecaps(): Promise<MonthlyRecapData[]> {
    const recaps = await prisma.monthlyRecap.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return recaps.map((recap) => {
      const date = new Date(recap.year, getMonthNumber(recap.month), 1);
      const daysInMonth = new Date(recap.year, getMonthNumber(recap.month) + 1, 0).getDate();
      const dailyAverage = recap.totalHours / daysInMonth;
      const capacityUsed = (recap.totalHours / this.MONTHLY_CAPACITY) * 100;

      return {
        month: recap.month,
        year: recap.year,
        totalHours: recap.totalHours,
        totalAppointments: recap.totalAppointments,
        dailyAverage,
        capacityUsed,
      };
    });
  }
}

/**
 * Helper function to convert month name to number
 */
function getMonthNumber(monthName: string): number {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return months.indexOf(monthName);
}

export const backlogService = new BacklogService();

