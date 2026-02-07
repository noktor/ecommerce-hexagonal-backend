import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { createAuthMiddleware } from '../middleware/auth';
import { TokenService } from '../../domain/services/TokenService';

export function createAuthRouter(
  controller: AuthController,
  tokenService: TokenService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  router.post('/register', (req, res, next) => controller.register(req, res, next));
  router.post('/login', (req, res, next) => controller.login(req, res, next));
  router.get('/verify/:token', (req, res, next) => controller.verifyEmail(req, res, next));
  router.post('/forgot-password', (req, res, next) => controller.forgotPassword(req, res, next));
  router.post('/reset-password', (req, res, next) => controller.resetPassword(req, res, next));
  router.get('/me', authMiddleware, (req, res, next) => controller.getCurrentUser(req, res, next));

  return router;
}

