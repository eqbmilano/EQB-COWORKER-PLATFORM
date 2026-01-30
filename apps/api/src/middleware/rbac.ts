/**
 * RBAC Authorization Middleware
 */
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { createResponse } from '../types/api.js';

export type AllowedRole = 'ADMIN' | 'COWORKER' | '*';

export const authorize = (allowedRoles: AllowedRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(
        createResponse(false, 401, undefined, {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        })
      );
    }

    const userRole = (req.user.role || 'COWORKER') as string;

    // Allow all if '*' is in allowedRoles
    if (allowedRoles.includes('*')) {
      return next();
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(userRole as AllowedRole)) {
      return res.status(403).json(
        createResponse(false, 403, undefined, {
          code: 'FORBIDDEN',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
        })
      );
    }

    next();
  };
};

