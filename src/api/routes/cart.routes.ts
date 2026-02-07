import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { createAuthMiddleware } from '../middleware/auth';
import { TokenService } from '../../domain/services/TokenService';

export function createCartRouter(
  controller: CartController,
  tokenService: TokenService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  router.get('/me', authMiddleware, (req, res, next) => controller.getByCustomerId(req, res, next));
  router.post('/', authMiddleware, (req, res, next) => controller.addItem(req, res, next));
  router.delete('/item', authMiddleware, (req, res, next) => controller.removeItem(req, res, next));

  return router;
}

