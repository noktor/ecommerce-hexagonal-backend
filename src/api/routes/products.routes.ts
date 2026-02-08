import { Router } from 'express';
import type { ProductsController } from '../controllers/ProductsController';

export function createProductsRouter(controller: ProductsController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/products:
   *   get:
   *     summary: Get all products
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter products by category (e.g., "Electronics", "Clothing")
   *       - in: query
   *         name: useCache
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Whether to use cache for this request
   *     responses:
   *       200:
   *         description: List of products retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Product'
   *       500:
   *         description: Internal server error
   */
  router.get('/', (req, res, next) => controller.getAll(req, res, next));

  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Get a product by ID
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Product ID
   *       - in: query
   *         name: useCache
   *         schema:
   *           type: boolean
   *           default: true
   *         description: Whether to use cache for this request
   *     responses:
   *       200:
   *         description: Product retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product not found
   *       500:
   *         description: Internal server error
   */
  router.get('/:id', (req, res, next) => controller.getById(req, res, next));

  return router;
}
