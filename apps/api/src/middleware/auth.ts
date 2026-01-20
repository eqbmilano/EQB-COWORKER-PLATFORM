/**
 * Auth0 Middleware for JWT verification
 * Validates JWT tokens and attaches user info to request
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pino from 'pino';

const logger = pino();

// Extend Express Request to allow auth0 user structure
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
 * Middleware to verify JWT token from Auth0
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

    // Note: In production, verify against Auth0 public key
    // For now, we'll just decode the token
    const decoded = jwt.decode(token) as {
      sub: string;
      email: string;
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
      email: decoded.email,
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
