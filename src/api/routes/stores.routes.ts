import { Router } from 'express';
import type { StoresController } from '../controllers/StoresController';
import type { TokenService } from '../../domain/services/TokenService';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

export function createStoresRouter(
  controller: StoresController,
  tokenService: TokenService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  // All store routes require authenticated retailer
  router.get('/mine', authMiddleware, requireRole('retailer'), (req, res, next) =>
    controller.listMine(req as any, res, next)
  );

  router.post('/', authMiddleware, requireRole('retailer'), (req, res, next) =>
    controller.create(req as any, res, next)
  );

  router.put('/:id', authMiddleware, requireRole('retailer'), (req, res, next) =>
    controller.update(req as any, res, next)
  );

  return router;
}

