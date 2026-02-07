import { Router } from 'express';
import { OrdersController } from '../controllers/OrdersController';
import { createAuthMiddleware } from '../middleware/auth';
import { TokenService } from '../../domain/services/TokenService';

export function createOrdersRouter(
  controller: OrdersController,
  tokenService: TokenService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  router.post('/', authMiddleware, (req, res, next) => {
    controller.create(req as any, res, next);
  });
  router.get('/:id', authMiddleware, (req, res, next) => {
    controller.getById(req as any, res, next);
  });

  return router;
}

