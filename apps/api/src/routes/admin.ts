import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/authorization.js';
import { adminService } from '../services/adminService.js';
import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const users = await adminService.getAllUsers(includeInactive === 'true');

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await adminService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/users', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phoneNumber: z.string().optional(),
      role: z.enum(['ADMIN', 'OPERATOR']),
      specialization: z.string().optional(),
      hourlyRate: z.number().positive().optional(),
    });

    const data = schema.parse(req.body);

    const user = await adminService.createUser(data);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create user',
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const schema = z.object({
      email: z.string().email().optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phoneNumber: z.string().optional(),
      role: z.enum(['ADMIN', 'OPERATOR']).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      specialization: z.string().optional(),
      hourlyRate: z.number().positive().optional(),
    });

    const data = schema.parse(req.body);

    const user = await adminService.updateUser(id, data);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user',
    });
  }
});

/**
 * POST /api/admin/users/:id/deactivate
 * Deactivate user
 */
router.post('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.deactivateUser(id);

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to deactivate user',
    });
  }
});

/**
 * POST /api/admin/users/:id/activate
 * Activate user
 */
router.post('/users/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    await adminService.activateUser(id);

    res.json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to activate user',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user permanently
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await adminService.deleteUser(id);

    res.json({
      success: true,
      message: 'User deleted permanently',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete user',
    });
  }
});

/**
 * POST /api/admin/users/:id/change-role
 * Change user role
 */
router.post('/users/:id/change-role', async (req, res) => {
  try {
    const { id } = req.params;

    const schema = z.object({
      role: z.enum(['ADMIN', 'OPERATOR']),
    });

    const { role } = schema.parse(req.body);

    // Prevent admin from changing their own role
    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const user = await adminService.changeUserRole(id, role);

    res.json({
      success: true,
      message: 'User role changed successfully',
      data: user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change user role',
    });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password
 */
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;

    const schema = z.object({
      newPassword: z.string().min(8),
    });

    const { newPassword } = schema.parse(req.body);

    await adminService.resetUserPassword(id, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password',
    });
  }
});

/**
 * GET /api/admin/statistics
 * Get system-wide statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await adminService.getSystemStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

export default router;

