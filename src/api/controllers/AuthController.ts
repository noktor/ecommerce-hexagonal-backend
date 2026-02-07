import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../application/use-cases/LoginUserUseCase';
import { VerifyEmailUseCase } from '../../application/use-cases/VerifyEmailUseCase';
import { RequestPasswordResetUseCase } from '../../application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private verifyEmailUseCase: VerifyEmailUseCase,
    private requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private getCurrentUserUseCase: GetCurrentUserUseCase
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError(400, 'Missing required fields: email, password, name');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError(400, 'Invalid email format');
      }

      // Basic password validation
      if (password.length < 6) {
        throw new AppError(400, 'Password must be at least 6 characters long');
      }

      const result = await this.registerUserUseCase.execute({ email, password, name });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          id: result.customer.id,
          email: result.customer.email,
          name: result.customer.name
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError(400, 'Missing required fields: email, password');
      }

      const result = await this.loginUserUseCase.execute({ email, password });

      res.json({
        success: true,
        data: {
          token: result.token,
          user: result.customer
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(401, error.message));
      } else {
        next(error);
      }
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        throw new AppError(400, 'Verification token is required');
      }

      const result = await this.verifyEmailUseCase.execute({ token });

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(400, error.message));
      } else {
        next(error);
      }
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError(400, 'Email is required');
      }

      const result = await this.requestPasswordResetUseCase.execute({ email });

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        throw new AppError(400, 'Missing required fields: token, newPassword');
      }

      // Basic password validation
      if (newPassword.length < 6) {
        throw new AppError(400, 'Password must be at least 6 characters long');
      }

      const result = await this.resetPasswordUseCase.execute({ token, newPassword });

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      if (error instanceof Error) {
        next(new AppError(400, error.message));
      } else {
        next(error);
      }
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'User ID not found in request');
      }

      const user = await this.getCurrentUserUseCase.execute({ userId: req.userId });

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

