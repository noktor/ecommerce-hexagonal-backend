import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { TokenService } from '../domain/services/TokenService';
import { swaggerSpec } from './config/swagger';
import { AuthController } from './controllers/AuthController';
import { CartController } from './controllers/CartController';
import { OrdersController } from './controllers/OrdersController';
import { ProductsController } from './controllers/ProductsController';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { createApiRouter } from './routes';

export interface UseCases {
  getProductsUseCase: any;
  getProductByIdUseCase: any;
  addToCartUseCase: any;
  removeFromCartUseCase: any;
  createOrderUseCase: any;
  registerUserUseCase: any;
  loginUserUseCase: any;
  verifyEmailUseCase: any;
  requestPasswordResetUseCase: any;
  resetPasswordUseCase: any;
  getCurrentUserUseCase: any;
}

export interface Repositories {
  cartRepository: any;
  orderRepository: any;
  customerRepository: any;
}

export interface Services {
  cacheService: any;
  tokenService: TokenService;
}

export function createApp(
  useCases: UseCases,
  repositories: Repositories,
  services: Services
): Express {
  const app = express();

  // Middleware
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Swagger UI - API Documentation
  try {
    app.use('/api-docs', swaggerUi.serve);
    app.get(
      '/api-docs',
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'E-commerce API Documentation',
        customfavIcon: '/favicon.ico',
      })
    );
    console.log('✅ Swagger UI configured at /api-docs');
  } catch (error) {
    console.error('❌ Error configuring Swagger UI:', error);
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Controllers
  const productsController = new ProductsController(
    useCases.getProductsUseCase,
    useCases.getProductByIdUseCase
  );

  const cartController = new CartController(
    useCases.addToCartUseCase,
    useCases.removeFromCartUseCase,
    repositories.cartRepository,
    services.cacheService
  );

  const ordersController = new OrdersController(
    useCases.createOrderUseCase,
    repositories.orderRepository
  );

  const authController = new AuthController(
    useCases.registerUserUseCase,
    useCases.loginUserUseCase,
    useCases.verifyEmailUseCase,
    useCases.requestPasswordResetUseCase,
    useCases.resetPasswordUseCase,
    useCases.getCurrentUserUseCase
  );

  // API Routes
  app.use(
    '/api',
    createApiRouter(
      productsController,
      cartController,
      ordersController,
      authController,
      services.tokenService
    )
  );

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

export function startServer(app: Express, port: number = 3000): void {
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 API available at http://localhost:${port}/api`);
    console.log(`📚 API Documentation available at http://localhost:${port}/api-docs`);
  });
}
