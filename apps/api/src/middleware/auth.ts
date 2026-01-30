/**
 * JWT Middleware for custom authentication
 * Validates JWT tokens signed with our server secret and attaches user info to request
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pino from 'pino';

const logger = pino();

// Extend Express Request to allow user structure from our JWT payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token signed by our API
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token required',
        },
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);

    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    const decoded = jwt.verify(token, secret) as {
      sub: string;
      email?: string;
      role?: string;
    } | null;

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
        statusCode: 401,
      });
    }

    req.user = {
      sub: decoded.sub,
      email: decoded.email || 'unknown',
      role: decoded.role || 'COWORKER',
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
      statusCode: 500,
    });
  }
};

/**
 * Middleware to check if user is admin
 */
export const adminOnlyMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
      statusCode: 403,
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is coworker
 */
export const coworkerOnlyMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'COWORKER') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Coworker access required',
      },
      statusCode: 403,
    });
    return;
  }

  next();
};

export default authMiddleware;

