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
      const hoursWorked = appointments.reduce((sum, apt) => sum + apt.duration, 0);
      totalHours += hoursWorked;

      // Check if entry already exists
      const existingEntry = await prisma.backlogEntry.findFirst({
        where: {
          coworkerId,
          date: dateStart,
        },
      });

      if (existingEntry) {
        // Update existing entry
        await prisma.backlogEntry.update({
          where: { id: existingEntry.id },
          data: {
            hoursWorked,
            appointmentsCompleted: appointments.length,
          },
        });
        logger.info(`Updated backlog entry for coworker ${coworkerId}: ${hoursWorked}h`);
      } else {
        // Create new entry
        await prisma.backlogEntry.create({
          data: {
            coworkerId,
            date: dateStart,
            hoursWorked,
            appointmentsCompleted: appointments.length,
          },
        });
        entriesCreated++;
        logger.info(`Created backlog entry for coworker ${coworkerId}: ${hoursWorked}h`);
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
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Get all backlog entries for the month
    const monthlyEntries = await prisma.backlogEntry.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    const totalHours = monthlyEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const totalAppointments = monthlyEntries.reduce(
      (sum, entry) => sum + entry.appointmentsCompleted,
      0
    );

    const month = format(date, 'MMMM');
    const year = date.getFullYear();

    // Check if recap exists
    const existingRecap = await prisma.monthlyRecap.findFirst({
      where: {
        month,
        year,
      },
    });

    const recapData = {
      month,
      year,
      totalHours,
      totalAppointments,
    };

    if (existingRecap) {
      await prisma.monthlyRecap.update({
        where: { id: existingRecap.id },
        data: recapData,
      });
      logger.info(`Updated monthly recap for ${month} ${year}: ${totalHours}h`);
    } else {
      await prisma.monthlyRecap.create({
        data: recapData,
      });
      logger.info(`Created monthly recap for ${month} ${year}: ${totalHours}h`);
    }

    // Check capacity limit
    if (totalHours > this.MONTHLY_CAPACITY) {
      logger.warn(
        `⚠️ Monthly capacity exceeded for ${month} ${year}: ${totalHours}h / ${this.MONTHLY_CAPACITY}h`
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
    const entries = await prisma.backlogEntry.findMany({
      where: {
        date: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
        ...(coworkerId && { coworkerId }),
      },
      include: {
        coworker: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
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
    const completedAppointments = entries.reduce(
      (sum, entry) => sum + entry.appointmentsCompleted,
      0
    );

    const daysCount = entries.length || 1;
    const averageHoursPerDay = totalHours / daysCount;

    // Calculate remaining capacity for current month
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
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

