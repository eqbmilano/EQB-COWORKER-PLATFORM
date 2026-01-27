import prisma from '../database/prisma.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcrypt';

export interface UserWithDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  firstName?: string | null;
  lastName?: string | null;
  coworkerProfile?: {
    id: string;
    specializations?: string[];
    phone?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: string;
  specialization?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
  specialization?: string;
}

export interface SystemStatistics {
  totalUsers: number;
  activeUsers: number;
  totalCoworkers: number;
  totalClients: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalHoursWorked: number;
  monthlyHoursWorked: number;
}

export class AdminService {
  /**
   * Get all users with details
   */
  async getAllUsers(includeInactive: boolean = false): Promise<UserWithDetails[]> {
    const users = await prisma.user.findMany({
      where: includeInactive ? {} : { status: 'ACTIVE' },
      include: {
        coworkerProfile: {
          select: {
            id: true,
            specializations: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  /**
   * Get user by ID with full details
   */
  async getUserById(userId: string): Promise<UserWithDetails | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        coworkerProfile: {
          select: {
            id: true,
            specializations: true,
            phone: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Create new user with optional coworker profile
   */
  async createUser(data: CreateUserInput): Promise<UserWithDetails> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        status: 'ACTIVE' as any,
      },
      include: {
        coworkerProfile: {
          select: {
            id: true,
            specializations: true,
            phone: true,
          },
        },
      },
    });

    // Create coworker profile if role is COWORKER
    if (data.role === 'COWORKER') {
      await prisma.coworker.create({
        data: {
          userId: user.id,
          specializations: data.specialization ? [data.specialization] : [],
        },
      });

      // Reload user with coworker data
      const userWithCoworker = await this.getUserById(user.id);
      if (userWithCoworker) {
        return userWithCoworker;
      }
    }

    logger.info(`Admin created new user: ${user.email} with role ${user.role}`);

    return user;
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, data: UpdateUserInput): Promise<UserWithDetails> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { coworkerProfile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new Error('Email already in use by another user');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any,
        status: data.status as any,
      },
      include: {
        coworkerProfile: {
          select: {
            id: true,
            specializations: true,
            phone: true,
          },
        },
      },
    });

    // Update coworker profile if exists and data provided
    if (user.coworkerProfile) {
      const coworkerData: any = {};
      if (data.specialization !== undefined) {
        coworkerData.specializations = [data.specialization];
      }
      if (Object.keys(coworkerData).length > 0) {
        await prisma.coworker.update({
          where: { userId },
          data: coworkerData,
        });
      }
    }

    // Create coworker profile if role changed to COWORKER and doesn't exist
    if (data.role === 'COWORKER' && !user.coworkerProfile) {
      await prisma.coworker.create({
        data: {
          userId: user.id,
          specializations: data.specialization ? [data.specialization] : [],
        },
      });
    }

    logger.info(`Admin updated user: ${userId}`);

    return await this.getUserById(userId) as UserWithDetails;
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
      },
    });

    logger.info(`Admin deactivated user: ${userId}`);
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
      },
    });

    logger.info(`Admin activated user: ${userId}`);
  }

  /**
   * Delete user permanently (hard delete)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { coworkerProfile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete coworker profile if exists
    if (user.coworkerProfile) {
      await prisma.coworker.delete({
        where: { id: user.coworkerProfile.id },
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.warn(`Admin permanently deleted user: ${userId}`);
  }

  /**
   * Change user role
   */
  async changeUserRole(userId: string, newRole: string): Promise<UserWithDetails> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { coworkerProfile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
      include: {
        coworkerProfile: {
          select: {
            id: true,
            specializations: true,
            phone: true,
          },
        },
      },
    });

    // Create coworker profile if role changed to COWORKER and doesn't exist
    if (newRole === 'COWORKER' && !user.coworkerProfile) {
      await prisma.coworker.create({
        data: {
          userId: user.id,
        },
      });
    }

    logger.info(`Admin changed user ${userId} role to ${newRole}`);

    return await this.getUserById(userId) as UserWithDetails;
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStatistics(): Promise<SystemStatistics> {
    const [
      totalUsers,
      activeUsers,
      totalCoworkers,
      totalClients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      backlogEntries,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.coworker.count(),
      prisma.client.count({ where: { status: 'ACTIVE' } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.appointment.count({ where: { status: 'SCHEDULED' } }),
      prisma.backlogEntry.findMany(),
    ]);

    const totalHoursWorked = backlogEntries.reduce((sum, entry) => sum + entry.hoursWorked, 0);

    // Get current month hours
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBacklog = await prisma.backlogEntry.findMany({
      where: {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });

    const monthlyHoursWorked = monthlyBacklog.reduce((sum, entry) => sum + entry.hoursWorked, 0);

    return {
      totalUsers,
      activeUsers,
      totalCoworkers,
      totalClients,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      totalHoursWorked,
      monthlyHoursWorked,
    };
  }

  /**
   * Reset user password (admin function)
   */
  async resetUserPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    logger.info(`Admin reset password for user: ${userId}`);
  }
}

export const adminService = new AdminService();

