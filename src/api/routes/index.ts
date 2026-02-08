import { Router } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import type { AuthController } from '../controllers/AuthController';
import type { CartController } from '../controllers/CartController';
import type { OrdersController } from '../controllers/OrdersController';
import type { ProductsController } from '../controllers/ProductsController';
import { createAuthRouter } from './auth.routes';
import { createCartRouter } from './cart.routes';
import { createOrdersRouter } from './orders.routes';
import { createProductsRouter } from './products.routes';

export function createApiRouter(
  productsController: ProductsController,
  cartController: CartController,
  ordersController: OrdersController,
  authController: AuthController,
  tokenService: TokenService
): Router {
  const router = Router();

  router.use('/products', createProductsRouter(productsController));
  router.use('/cart', createCartRouter(cartController, tokenService));
  router.use('/orders', createOrdersRouter(ordersController, tokenService));
  router.use('/auth', createAuthRouter(authController, tokenService));

  return router;
}
