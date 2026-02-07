import { Router } from 'express';
import { ProductsController } from '../controllers/ProductsController';
import { CartController } from '../controllers/CartController';
import { OrdersController } from '../controllers/OrdersController';
import { AuthController } from '../controllers/AuthController';
import { createProductsRouter } from './products.routes';
import { createCartRouter } from './cart.routes';
import { createOrdersRouter } from './orders.routes';
import { createAuthRouter } from './auth.routes';
import { TokenService } from '../../domain/services/TokenService';

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

