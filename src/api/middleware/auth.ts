import type { NextFunction, Request, Response } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: 'user' | 'retailer';
}

export function createAuthMiddleware(tokenService: TokenService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(401, 'Authentication required');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const payload = tokenService.verifyToken(token);

      if (!payload) {
        throw new AppError(401, 'Invalid or expired token');
      }

      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.userRole = payload.role || 'user';

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError(401, 'Authentication failed'));
      }
    }
  };
}

/**
 * Optional authentication middleware - sets userId if token is present, but doesn't require it
 * Useful for endpoints that support both authenticated and guest users
 */
export function createOptionalAuthMiddleware(tokenService: TokenService) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = tokenService.verifyToken(token);

        if (payload) {
          req.userId = payload.userId;
          req.userEmail = payload.email;
          req.userRole = payload.role || 'user';
        }
      }

      // Continue even if no token is provided (guest user)
      next();
    } catch (error) {
      // If token is invalid, just continue without setting userId (guest user)
      next(error);
    }
  };
}

/**
 * Middleware factory to enforce a specific user role (e.g. 'retailer').
 * Must be used AFTER createAuthMiddleware so req.userRole is set.
 */
export function requireRole(requiredRole: 'user' | 'retailer') {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const actualRole = req.userRole || 'user';
    if (actualRole !== requiredRole) {
      return next(new AppError(403, 'Forbidden: insufficient permissions'));
    }
    next();
  };
}
