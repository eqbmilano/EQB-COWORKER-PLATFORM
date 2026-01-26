/**
 * Authentication Service for Auth0 integration
 */
import prisma from '../database/client.js';
import { User, UserRole, UserStatus } from '@prisma/client';
import pino from 'pino';

const logger = pino();

export interface Auth0User {
  sub: string; // Auth0 ID
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Get or create user from Auth0 profile
 */
export const getOrCreateUser = async (auth0User: Auth0User): Promise<User> => {
  try {
    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { auth0Id: auth0User.sub },
    });

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: auth0User.email,
          name: auth0User.name || auth0User.email.split('@')[0],
          auth0Id: auth0User.sub,
          role: UserRole.COWORKER, // Default role
          status: UserStatus.ACTIVE,
        },
      });

      // Create coworker profile
      if (user.role === UserRole.COWORKER) {
        await prisma.coworker.create({
          data: {
            userId: user.id,
            profileImageUrl: auth0User.picture,
            isActive: true,
          },
        });
      }

      logger.info(`New user created: ${user.email}`);
    }

    return user;
  } catch (error) {
    logger.error('Error getting or creating user:', error);
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      coworkerProfile: true,
      adminProfile: true,
    },
  });
};

/**
 * Update user status
 */
export const updateUserStatus = async (
  userId: string,
  status: UserStatus
): Promise<User> => {
  return prisma.user.update({
    where: { id: userId },
    data: { status },
  });
};

/**
 * Block user (set status to BLOCKED)
 */
export const blockUser = async (userId: string): Promise<User> => {
  return updateUserStatus(userId, UserStatus.BLOCKED);
};

/**
 * Unblock user (set status to ACTIVE)
 */
export const unblockUser = async (userId: string): Promise<User> => {
  return updateUserStatus(userId, UserStatus.ACTIVE);
};

export default {
  getOrCreateUser,
  getUserByEmail,
  getUserById,
  updateUserStatus,
  blockUser,
  unblockUser,
};

