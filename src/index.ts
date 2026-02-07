// Load environment variables first
import 'dotenv/config';

import { validateEnvironmentVariables } from './infrastructure/config/env-validator';

import { CreateOrderUseCase } from './application/use-cases/CreateOrderUseCase';
import { AddToCartUseCase } from './application/use-cases/AddToCartUseCase';
import { RemoveFromCartUseCase } from './application/use-cases/RemoveFromCartUseCase';
import { GetProductsUseCase } from './application/use-cases/GetProductsUseCase';
import { GetProductByIdUseCase } from './application/use-cases/GetProductByIdUseCase';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { LoginUserUseCase } from './application/use-cases/LoginUserUseCase';
import { VerifyEmailUseCase } from './application/use-cases/VerifyEmailUseCase';
import { RequestPasswordResetUseCase } from './application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from './application/use-cases/ResetPasswordUseCase';
import { GetCurrentUserUseCase } from './application/use-cases/GetCurrentUserUseCase';

import { MongoProductRepository } from './infrastructure/repositories/MongoProductRepository';
import { MongoCustomerRepository } from './infrastructure/repositories/MongoCustomerRepository';
import { MongoOrderRepository } from './infrastructure/repositories/MongoOrderRepository';
import { MongoCartRepository } from './infrastructure/repositories/MongoCartRepository';
import { RabbitMQEventPublisher } from './infrastructure/events/RabbitMQEventPublisher';
import { RedisCacheService } from './infrastructure/cache/RedisCacheService';
import { RedisLockService } from './infrastructure/locks/RedisLockService';
import { JWTTokenService } from './infrastructure/services/JWTTokenService';
import { BcryptPasswordService } from './infrastructure/services/BcryptPasswordService';
import { SendGridEmailService } from './infrastructure/services/SendGridEmailService';
import { EmailService } from './domain/services/EmailService';
import { connectToMongoDB, closeMongoDBConnection } from './infrastructure/database/mongodb';
import { seedDatabase } from './infrastructure/database/seed';
// Import models to ensure they are registered with Mongoose
import './infrastructure/models/ProductModel';
import './infrastructure/models/CartModel';
import './infrastructure/models/CustomerModel';
import './infrastructure/models/OrderModel';

import { createApp, startServer } from './api/server';

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
  const cartRepository = new MongoCartRepository();
  
  const eventPublisher = new RabbitMQEventPublisher(process.env.RABBITMQ_URL || 'amqp://localhost');
  try {
    await eventPublisher.connect();
  } catch (error) {
    console.warn('Warning: Could not connect to RabbitMQ, continuing with fallback mode');
  }

  const cacheService = new RedisCacheService(process.env.REDIS_URL || 'redis://localhost:6379');
  try {
    await cacheService.connect();
  } catch (error) {
    console.warn('Warning: Could not connect to Redis, continuing with fallback mode');
  }

  const lockService = new RedisLockService(process.env.REDIS_URL || 'redis://localhost:6379');
  try {
    await lockService.connect();
  } catch (error) {
    console.warn('Warning: Could not connect to Redis Lock Service, continuing with fallback mode');
  }

  // Initialize use cases
  const createOrderUseCase = new CreateOrderUseCase(
    orderRepository,
    customerRepository,
    productRepository,
    eventPublisher
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

  const getProductsUseCase = new GetProductsUseCase(
    productRepository,
    cacheService
  );

  const getProductByIdUseCase = new GetProductByIdUseCase(
    productRepository,
    cacheService
  );

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

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Initialize auth use cases
  const registerUserUseCase = new RegisterUserUseCase(
    customerRepository,
    passwordService,
    emailService || {
      sendVerificationEmail: async () => { console.warn('Email service not configured'); },
      sendPasswordResetEmail: async () => { console.warn('Email service not configured'); },
      sendPasswordResetConfirmation: async () => { console.warn('Email service not configured'); }
    },
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
    emailService || {
      sendVerificationEmail: async () => { console.warn('Email service not configured'); },
      sendPasswordResetEmail: async () => { console.warn('Email service not configured'); },
      sendPasswordResetConfirmation: async () => { console.warn('Email service not configured'); }
    },
    frontendUrl
  );

  const resetPasswordUseCase = new ResetPasswordUseCase(
    customerRepository,
    passwordService,
    emailService || {
      sendVerificationEmail: async () => { console.warn('Email service not configured'); },
      sendPasswordResetEmail: async () => { console.warn('Email service not configured'); },
      sendPasswordResetConfirmation: async () => { console.warn('Email service not configured'); }
    }
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
      getCurrentUserUseCase
    },
    {
      cartRepository,
      orderRepository,
      customerRepository
    },
    {
      cacheService,
      tokenService
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
