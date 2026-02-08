import { Router } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import type { OrdersController } from '../controllers/OrdersController';
import { createOptionalAuthMiddleware } from '../middleware/auth';

export function createOrdersRouter(
  controller: OrdersController,
  tokenService: TokenService
): Router {
  const router = Router();
  const optionalAuthMiddleware = createOptionalAuthMiddleware(tokenService);

  /**
   * @swagger
   * /api/orders:
   *   post:
   *     summary: Create a new order
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateOrderRequest'
   *     responses:
   *       201:
   *         description: Order created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       400:
   *         description: Bad request (insufficient stock, invalid items, etc.)
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  // Create order - supports both authenticated and guest users
  router.post('/', optionalAuthMiddleware, (req, res, next) => {
    controller.create(req as any, res, next);
  });

  /**
   * @swagger
   * /api/orders/{id}:
   *   get:
   *     summary: Get order by ID
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Order ID
   *     responses:
   *       200:
   *         description: Order retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Order'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Order not found
   *       500:
   *         description: Internal server error
   */
  // Get order by ID - supports both authenticated and guest users
  // Note: In production, you might want to add order lookup by email for guest orders
  router.get('/:id', optionalAuthMiddleware, (req, res, next) => {
    controller.getById(req as any, res, next);
  });

  return router;
}
