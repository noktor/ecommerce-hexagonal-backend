import { Router } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import type { CartController } from '../controllers/CartController';
import { createAuthMiddleware } from '../middleware/auth';

export function createCartRouter(controller: CartController, tokenService: TokenService): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(tokenService);

  /**
   * @swagger
   * /api/cart/me:
   *   get:
   *     summary: Get current user's cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Cart'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/me', authMiddleware, (req, res, next) => controller.getByCustomerId(req, res, next));

  /**
   * @swagger
   * /api/cart:
   *   post:
   *     summary: Add item to cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AddToCartRequest'
   *     responses:
   *       201:
   *         description: Item added to cart successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Cart'
   *       400:
   *         description: Bad request (insufficient stock, invalid product, etc.)
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.post('/', authMiddleware, (req, res, next) => controller.addItem(req, res, next));

  /**
   * @swagger
   * /api/cart/item:
   *   delete:
   *     summary: Remove item from cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [productId]
   *             properties:
   *               productId:
   *                 type: string
   *                 example: PROD-123
   *     responses:
   *       200:
   *         description: Item removed from cart successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Cart'
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Item not found in cart
   *       500:
   *         description: Internal server error
   */
  router.delete('/item', authMiddleware, (req, res, next) => controller.removeItem(req, res, next));

  return router;
}
