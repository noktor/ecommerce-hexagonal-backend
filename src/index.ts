// Load environment variables first
import 'dotenv/config';

import { AddToCartUseCase } from './application/use-cases/AddToCartUseCase';

import { CreateOrderUseCase } from './application/use-cases/CreateOrderUseCase';
import { GetCurrentUserUseCase } from './application/use-cases/GetCurrentUserUseCase';
import { GetProductByIdUseCase } from './application/use-cases/GetProductByIdUseCase';
import { GetProductsUseCase } from './application/use-cases/GetProductsUseCase';
import { CreateStoreUseCase } from './application/use-cases/CreateStoreUseCase';
import { UpdateStoreUseCase } from './application/use-cases/UpdateStoreUseCase';
import { ListMyStoresUseCase } from './application/use-cases/ListMyStoresUseCase';
import { ListStoreProductsUseCase } from './application/use-cases/ListStoreProductsUseCase';
import { CreateStoreProductUseCase } from './application/use-cases/CreateStoreProductUseCase';
import { UpdateStoreProductUseCase } from './application/use-cases/UpdateStoreProductUseCase';
import { LoginUserUseCase } from './application/use-cases/LoginUserUseCase';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { RemoveFromCartUseCase } from './application/use-cases/RemoveFromCartUseCase';
import { RequestPasswordResetUseCase } from './application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from './application/use-cases/ResetPasswordUseCase';
import { VerifyEmailUseCase } from './application/use-cases/VerifyEmailUseCase';
import type { EmailService } from './domain/services/EmailService';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService';
import { validateEnvironmentVariables } from './infrastructure/config/env-validator';
import { closeMongoDBConnection, connectToMongoDB } from './infrastructure/database/mongodb';
import { seedDatabase } from './infrastructure/database/seed';
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';
import { RedisLockService } from './infrastructure/locks/RedisLockService';
import { MongoCartRepository } from './infrastructure/repositories/MongoCartRepository';
import { MongoCustomerRepository } from './infrastructure/repositories/MongoCustomerRepository';
import { MongoOrderRepository } from './infrastructure/repositories/MongoOrderRepository';
import { MongoProductRepository } from './infrastructure/repositories/MongoProductRepository';
import { MongoStoreRepository } from './infrastructure/repositories/MongoStoreRepository';
import { BcryptPasswordService } from './infrastructure/services/BcryptPasswordService';
import { CloudinaryImageService } from './infrastructure/services/CloudinaryImageService';
import { JWTTokenService } from './infrastructure/services/JWTTokenService';
import { SendGridEmailService } from './infrastructure/services/SendGridEmailService';
// Import models to ensure they are registered with Mongoose
import './infrastructure/models/ProductModel';
import './infrastructure/models/CartModel';
import './infrastructure/models/CustomerModel';
import './infrastructure/models/OrderModel';

import { createApp, startServer } from './api/server';

// Global error handlers to catch unhandled errors
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  Continuing despite unhandled rejection');
  }
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  // In production, we might want to exit, but for now just log
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  Application will continue, but this should be investigated');
  }
});

async function main() {
  console.log('🚀 Starting E-commerce Backend with Hexagonal Architecture...\n');

  // Validate environment variables
  try {
    validateEnvironmentVariables();
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }

  // Connect to MongoDB
  try {
    await connectToMongoDB();

    // Seed database if needed (only in development)
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  // Initialize infrastructure
  const productRepository = new MongoProductRepository();
  const customerRepository = new MongoCustomerRepository();
  const orderRepository = new MongoOrderRepository();
  const storeRepository = new MongoStoreRepository();
  const cartRepository = new MongoCartRepository();

  const eventPublisher = new RabbitMQEventPublisher(process.env.RABBITMQ_URL || 'amqp://localhost');
  try {
    await eventPublisher.connect();
  } catch (error) {
    console.warn('Warning: Could not connect to RabbitMQ, continuing with fallback mode');
  }

  // Only use Redis if REDIS_URL is explicitly configured
  // In production, don't default to localhost
  const redisUrl =
    process.env.REDIS_URL ||
    (process.env.NODE_ENV === 'development' ? 'redis://localhost:6379' : undefined);

  // Log Redis configuration
  console.log('🔍 Redis Configuration:');
  console.log(`   REDIS_URL env var: ${process.env.REDIS_URL || 'NOT SET'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Final redisUrl: ${redisUrl || 'undefined (will use in-memory fallback)'}`);
  console.log('');

  const cacheService = new RedisCacheService(redisUrl);
  try {
    await cacheService.connect();
  } catch (error) {
    console.warn('⚠️  Could not connect to Redis, continuing with in-memory fallback');
  }

  const lockService = new RedisLockService(redisUrl);
  try {
    await lockService.connect();
  } catch (error) {
    console.warn('⚠️  Could not connect to Redis Lock Service, continuing with in-memory fallback');
  }

  // Initialize auth services
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const tokenService = new JWTTokenService(jwtSecret, jwtExpiresIn);

  const passwordService = new BcryptPasswordService(10);

  // Initialize SendGrid email service if both API key and from email are configured
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  const sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;

  let emailService: EmailService | null = null;

  if (sendGridApiKey && sendGridFromEmail) {
    try {
      emailService = new SendGridEmailService(sendGridApiKey, sendGridFromEmail);
      console.log('✅ SendGrid email service configured');
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid email service:', error);
      console.warn('⚠️  Email functionality will be limited');
    }
  } else {
    if (!sendGridApiKey && !sendGridFromEmail) {
      console.warn('⚠️  SendGrid email service not configured:');
      console.warn('   - SENDGRID_API_KEY is missing');
      console.warn('   - SENDGRID_FROM_EMAIL is missing');
    } else if (!sendGridApiKey) {
      console.warn('⚠️  SendGrid email service not configured: SENDGRID_API_KEY is missing');
    } else if (!sendGridFromEmail) {
      console.warn('⚠️  SendGrid email service not configured: SENDGRID_FROM_EMAIL is missing');
    }
    console.warn('   Email verification and password reset will not work properly.');
    console.warn('   See README.md for SendGrid setup instructions.');
  }

  // Initialize Cloudinary if all env vars are set
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
    try {
      new CloudinaryImageService(cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret);
      console.log('✅ Cloudinary image service configured');
    } catch (error) {
      console.error('❌ Failed to initialize Cloudinary:', error);
    }
  }

  // Create a mock email service for fallback
  const mockEmailService: EmailService = {
    sendVerificationEmail: async () => {
      console.warn('Email service not configured');
    },
    sendPasswordResetEmail: async () => {
      console.warn('Email service not configured');
    },
    sendPasswordResetConfirmation: async () => {
      console.warn('Email service not configured');
    },
    sendOrderConfirmationEmail: async () => {
      console.warn('Email service not configured');
    },
  };

  // Initialize use cases
  const createOrderUseCase = new CreateOrderUseCase(
    orderRepository,
    customerRepository,
    productRepository,
    cartRepository,
    eventPublisher,
    cacheService,
    emailService
  );

  const addToCartUseCase = new AddToCartUseCase(
    cartRepository,
    customerRepository,
    productRepository,
    cacheService,
    lockService,
    eventPublisher
  );

  const removeFromCartUseCase = new RemoveFromCartUseCase(
    cartRepository,
    cacheService,
    lockService,
    eventPublisher
  );

  const getProductsUseCase = new GetProductsUseCase(productRepository, cacheService);

  const getProductByIdUseCase = new GetProductByIdUseCase(productRepository, cacheService);

  // Store use cases (retailer backoffice)
  const createStoreUseCase = new CreateStoreUseCase(storeRepository);
  const updateStoreUseCase = new UpdateStoreUseCase(storeRepository);
  const listMyStoresUseCase = new ListMyStoresUseCase(storeRepository);

  // Retailer product use cases
  const listStoreProductsUseCase = new ListStoreProductsUseCase(productRepository, storeRepository);
  const createStoreProductUseCase = new CreateStoreProductUseCase(productRepository, storeRepository);
  const updateStoreProductUseCase = new UpdateStoreProductUseCase(productRepository, storeRepository);

  // Get frontend URL - required in production
  console.log('🔍 Checking FRONTEND_URL configuration...');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'NOT SET'}`);

  const frontendUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          console.error('❌ FRONTEND_URL is not set in production!');
          console.error('   Please set FRONTEND_URL in Render environment variables.');
          console.error('   Example: https://noktor-store.netlify.app');
          throw new Error('FRONTEND_URL is required in production');
        })()
      : 'http://localhost:5173');

  console.log(`✅ Frontend URL configured: ${frontendUrl}`);
  if (frontendUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.error('⚠️  WARNING: Using localhost in production! This is incorrect.');
    console.error('   Please set FRONTEND_URL=https://noktor-store.netlify.app in Render');
  }

  // Initialize auth use cases
  const registerUserUseCase = new RegisterUserUseCase(
    customerRepository,
    passwordService,
    emailService || mockEmailService,
    frontendUrl
  );

  const loginUserUseCase = new LoginUserUseCase(
    customerRepository,
    passwordService,
    tokenService,
    true // require email verification
  );

  const verifyEmailUseCase = new VerifyEmailUseCase(customerRepository);

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
    customerRepository,
    emailService || mockEmailService,
    frontendUrl
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    customerRepository,
    passwordService,
    emailService || mockEmailService
  );

  const getCurrentUserUseCase = new GetCurrentUserUseCase(customerRepository);

  // Create Express app
  const app = createApp(
    {
      getProductsUseCase,
      getProductByIdUseCase,
      addToCartUseCase,
      removeFromCartUseCase,
      createOrderUseCase,
      registerUserUseCase,
      loginUserUseCase,
      verifyEmailUseCase,
      requestPasswordResetUseCase,
      resetPasswordUseCase,
      getCurrentUserUseCase,
      createStoreUseCase,
      updateStoreUseCase,
      listMyStoresUseCase,
      listStoreProductsUseCase,
      createStoreProductUseCase,
      updateStoreProductUseCase,
    },
    {
      cartRepository,
      orderRepository,
      customerRepository,
      storeRepository,
    },
    {
      cacheService,
      tokenService,
    }
  );

  // Start server
  const port = parseInt(process.env.PORT || '3000', 10);
  startServer(app, port);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n👋 Shutting down...');
    await eventPublisher.close();
    await cacheService.close();
    await lockService.close();
    await closeMongoDBConnection();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down...');
    await eventPublisher.close();
    await cacheService.close();
    await lockService.close();
    await closeMongoDBConnection();
    process.exit(0);
  });
}

// Run the application
main().catch(console.error);
