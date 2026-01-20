import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Extend Express Request type to include user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        coworkerId?: string;
      };
    }
  }
}

/**
 * Middleware to require a specific role or higher
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      current: req.user.role,
    });
  }

  next();
}

/**
 * Middleware to check if user is admin or accessing their own resources
 */
export function requireAdminOrSelf(getUserIdFromRequest: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const targetUserId = getUserIdFromRequest(req);

    // Allow if user is admin or accessing their own resources
    if (req.user.role === 'ADMIN' || req.user.id === targetUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions - Admin access or own resources only',
    });
  };
}

/**
 * Middleware to check if user is admin or the resource belongs to them
 */
export function requireAdminOrOwner(getOwnerIdFromRequest: (req: Request) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Allow if user is admin
    if (req.user.role === 'ADMIN') {
      return next();
    }

    try {
      const ownerId = await getOwnerIdFromRequest(req);

      if (!ownerId) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
      }

      // Allow if user is the owner
      if (req.user.id === ownerId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions - Admin access or resource ownership required',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership',
      });
    }
  };
}

/**
 * Check if user has permission to access coworker data
 */
export function canAccessCoworkerData(req: Request, coworkerId: string): boolean {
  if (!req.user) {
    return false;
  }

  // Admin can access all data
  if (req.user.role === 'ADMIN') {
    return true;
  }

  // User can access their own coworker data
  return req.user.coworkerId === coworkerId;
}

/**
 * Check if user can modify resource
 */
export function canModifyResource(req: Request, ownerId: string): boolean {
  if (!req.user) {
    return false;
  }

  // Admin can modify all resources
  if (req.user.role === 'ADMIN') {
    return true;
  }

  // User can modify their own resources
  return req.user.id === ownerId;
}
