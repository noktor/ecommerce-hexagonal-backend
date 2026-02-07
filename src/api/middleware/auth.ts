import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../domain/services/TokenService';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
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

