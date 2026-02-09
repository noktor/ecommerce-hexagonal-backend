import { Router } from 'express';
import type { RetailerProductsController } from '../controllers/RetailerProductsController';
import type { TokenService } from '../../domain/services/TokenService';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

export function createRetailerProductsRouter(
  controller: RetailerProductsController,
  tokenService: TokenService
): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  // All routes under /api/backoffice require authenticated retailer
  router.get(
    '/stores/:storeId/products',
    authMiddleware,
    requireRole('retailer'),
    (req, res, next) => controller.listForStore(req as any, res, next)
  );

  router.post(
    '/stores/:storeId/products',
    authMiddleware,
    requireRole('retailer'),
    (req, res, next) => controller.create(req as any, res, next)
  );

  router.put(
    '/products/:id',
    authMiddleware,
    requireRole('retailer'),
    (req, res, next) => controller.update(req as any, res, next)
  );

  return router;
}

