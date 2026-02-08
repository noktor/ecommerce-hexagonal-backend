import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

// Get the correct path to routes directory
// In development (ts-node): __dirname = src/api/config
// In production (compiled): __dirname = dist/api/config
const routesDir = path.join(__dirname, '../routes');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'E-commerce backend API with hexagonal architecture',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
      {
        url: 'https://ecommerce-backend-qvo9.onrender.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          required: ['id', 'name', 'description', 'price', 'stock', 'category'],
          properties: {
            id: { type: 'string', example: 'PROD-123' },
            name: { type: 'string', example: 'Laptop' },
            description: { type: 'string', example: 'High-performance laptop' },
            price: { type: 'number', format: 'float', example: 999.99 },
            stock: { type: 'number', example: 10 },
            category: { type: 'string', example: 'Electronics' },
            createdAt: { type: 'string', format: 'date-time' },
            longDescription: { type: 'string', nullable: true },
            imageUrl: { type: 'string', nullable: true },
          },
        },
        CartItem: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', example: 'PROD-123' },
            quantity: { type: 'number', example: 2 },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: { type: 'string', nullable: true },
            customerId: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/CartItem' },
            },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            productName: { type: 'string' },
            quantity: { type: 'number' },
            price: { type: 'number' },
            subtotal: { type: 'number' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            total: { type: 'number' },
            status: { type: 'string', example: 'PENDING' },
            createdAt: { type: 'string', format: 'date-time' },
            shippingAddress: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            status: { type: 'string', example: 'ACTIVE' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'number' },
              },
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            name: { type: 'string', example: 'John Doe' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 6, example: 'newpassword123' },
          },
        },
        AddToCartRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', example: 'PROD-123' },
            quantity: { type: 'number', minimum: 1, example: 1 },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['items', 'shippingAddress'],
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'number', minimum: 1 },
                },
              },
            },
            shippingAddress: { type: 'string', example: '123 Main St, City, Country' },
          },
        },
      },
    },
    tags: [
      { name: 'Products', description: 'Product operations' },
      { name: 'Cart', description: 'Shopping cart operations (requires authentication)' },
      { name: 'Orders', description: 'Order operations (requires authentication)' },
      { name: 'Auth', description: 'Authentication operations' },
    ],
  },
  apis: [
    `${routesDir}/*.ts`,
    `${routesDir}/*.js`,
    path.join(process.cwd(), 'src/api/routes/*.ts'),
    path.join(process.cwd(), 'dist/api/routes/*.js'),
  ],
};

let swaggerSpec: any;
try {
  swaggerSpec = swaggerJsdoc(options);
  console.log('✅ Swagger specification loaded successfully');
  console.log(`   Routes path: ${routesDir}`);
} catch (error) {
  console.error('❌ Error loading Swagger specification:', error);
  throw error;
}

export { swaggerSpec };
