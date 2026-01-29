/**
 * Authentication Routes
 * Handles JWT-based login, signup, and refresh
 */
import { Router, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import authService from '../services/authService.js';
import { createResponse } from '../types/api.js';
import pino from 'pino';
import prisma from '../database/prisma.js';

const logger = pino();
const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// ============================================================================
// HELPERS
// ============================================================================

const generateToken = (user: { id: string; email: string; role?: string }): string => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role || 'COWORKER' },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
};

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req, res: Response) => {
  try {
    const validation = LoginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Email and password required',
        })
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        })
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password || '');

    if (!isValidPassword) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        })
      );
    }

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    logger.info(`User logged in: ${user.email}`);

    return res.json(
      createResponse(true, 200, {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    logger.error({
      msg: 'Login error',
      error: errorMsg,
      stack: errorStack,
    });
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Login failed',
      })
    );
  }
});

/**
 * POST /auth/signup
 * Register new user
 */
router.post('/signup', async (req, res: Response) => {
  try {
    const validation = SignupSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: validation.error.errors,
        })
      );
    }

    const { email, password, firstName, lastName } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json(
        createResponse(false, 409, undefined, {
          code: 'USER_EXISTS',
          message: 'Email already registered',
        })
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        role: 'COWORKER',
      },
    });

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    logger.info(`User signed up: ${user.email}`);

    return res.status(201).json(
      createResponse(true, 201, {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  } catch (error) {
    logger.error('Signup error:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Signup failed',
      })
    );
  }
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });

    if (!user) {
      return res.status(404).json(
        createResponse(false, 404, undefined, {
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      );
    }

    return res.json(
      createResponse(true, 200, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  } catch (error) {
    logger.error('Get me error:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to get user',
      })
    );
  }
});

/**
 * POST /auth/logout
 * Logout user (primarily for frontend)
 */
router.post('/logout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.info(`User logged out: ${req.user?.email}`);

    return res.json(
      createResponse(true, 200, { message: 'Logged out successfully' })
    );
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Logout failed',
      })
    );
  }
});

/**
 * POST /auth/google
 * Google OAuth sign-in (simplified - in production, verify ID token with Google)
 */
router.post('/google', async (req, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'MISSING_ID_TOKEN',
          message: 'ID token required',
        })
      );
    }

    // In production, verify token with Google's public key
    // For now, we'll decode it (unsafe in production!)
    let decoded: any;
    try {
      decoded = jwt.decode(idToken) as { email?: string; given_name?: string; family_name?: string };
    } catch {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'INVALID_TOKEN',
          message: 'Invalid Google token',
        })
      );
    }

    if (!decoded?.email) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'INVALID_TOKEN',
          message: 'Email not found in token',
        })
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: decoded.email,
          firstName: decoded.given_name || 'User',
          lastName: decoded.family_name || '',
          name: `${decoded.given_name || 'User'} ${decoded.family_name || ''}`.trim(),
          role: 'COWORKER',
          auth0Id: `google|${decoded.sub || decoded.email}`,
        },
      });

      logger.info(`New user created via Google: ${user.email}`);
    }

    // Generate JWT token
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    logger.info(`User logged in via Google: ${user.email}`);

    return res.json(
      createResponse(true, 200, {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    );
  } catch (error) {
    logger.error('Google auth error:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Google authentication failed',
      })
    );
  }
});

/**
 * PATCH /auth/me
 * Update user profile (firstName, lastName)
 */
router.patch('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    const { firstName, lastName } = req.body;
    const updateData: any = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    const updated = await prisma.user.update({
      where: { id: req.user.sub },
      data: updateData,
    });

    return res.json(
      createResponse(true, 200, {
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: updated.role,
        },
      })
    );
  } catch (error) {
    logger.error('Error updating profile:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to update profile',
      })
    );
  }
});

/**
 * POST /auth/change-password
 * Change user password
 */
router.post('/change-password', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'Current and new password required',
        })
      );
    }

    if (newPassword.length < 8) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'VALIDATION_ERROR',
          message: 'New password must be at least 8 characters',
        })
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });

    if (!user || !user.password) {
      return res.status(400).json(
        createResponse(false, 400, undefined, {
          code: 'INVALID_REQUEST',
          message: 'User does not have a password',
        })
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'INVALID_CREDENTIALS',
          message: 'Current password is incorrect',
        })
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user.sub },
      data: { password: hashedPassword },
    });

    logger.info(`User ${user.email} changed password`);

    return res.json(
      createResponse(true, 200, {
        message: 'Password changed successfully',
      })
    );
  } catch (error) {
    logger.error('Error changing password:', error);
    return res.status(500).json(
      createResponse(false, 500, undefined, {
        code: 'SERVER_ERROR',
        message: 'Failed to change password',
      })
    );
  }
});

export default router;

