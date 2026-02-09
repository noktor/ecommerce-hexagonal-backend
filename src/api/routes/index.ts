import { Router } from 'express';
import type { TokenService } from '../../domain/services/TokenService';
import type { AuthController } from '../controllers/AuthController';
import type { CartController } from '../controllers/CartController';
import type { OrdersController } from '../controllers/OrdersController';
import type { StoresController } from '../controllers/StoresController';
import type { RetailerProductsController } from '../controllers/RetailerProductsController';
import type { ProductsController } from '../controllers/ProductsController';
import { createAuthRouter } from './auth.routes';
import { createCartRouter } from './cart.routes';
import { createOrdersRouter } from './orders.routes';
import { createStoresRouter } from './stores.routes';
import { createRetailerProductsRouter } from './retailerProducts.routes';
import { createUploadsRouter } from './uploads.routes';
import { createProductsRouter } from './products.routes';

export function createApiRouter(
  productsController: ProductsController,
  cartController: CartController,
  ordersController: OrdersController,
  authController: AuthController,
  storesController: StoresController,
  retailerProductsController: RetailerProductsController,
  tokenService: TokenService
): Router {
  const router = Router();

  router.use('/products', createProductsRouter(productsController));
  router.use('/cart', createCartRouter(cartController, tokenService));
  router.use('/orders', createOrdersRouter(ordersController, tokenService));
  router.use('/auth', createAuthRouter(authController, tokenService));
  router.use('/stores', createStoresRouter(storesController, tokenService));
  router.use('/backoffice', createRetailerProductsRouter(retailerProductsController, tokenService));
  router.use('/backoffice', createUploadsRouter(tokenService));

  return router;
}
