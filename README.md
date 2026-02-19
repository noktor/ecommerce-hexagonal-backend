# 🛒 E-commerce Backend - Hexagonal Architecture

E-commerce backend API implemented with **Hexagonal Architecture** (Ports & Adapters), including retry system with RabbitMQ and cache with Redis.

> **Note**: The frontend application is now in a [separate repository](https://github.com/your-org/ecommerce-frontend). This repository contains only the backend API.

**[Live API Documentation (Swagger)](https://ecommerce-backend-qvo9.onrender.com/api-docs/)** — Interactive API reference deployed on production.

## 📋 Features

- ✅ **Hexagonal Architecture** - Clear separation between domain, application and infrastructure
- ✅ **Retry System** - RabbitMQ with automatic retry and dead letter queue
- ✅ **Cache** - Redis to improve performance (with in-memory fallback)
- ✅ **TypeScript** - Static typing for better security
- ✅ **User Authentication** - JWT-based authentication with email verification
- ✅ **Email Service** - SendGrid integration for email verification and password reset
- ✅ **Use Cases** - CreateOrder, AddToCart, GetProducts, GetProductById, Register, Login

## 🏗️ Project Structure

```
src/
├── domain/                    # Domain Layer (Business Core)
│   ├── Product.ts            # Product Entity
│   ├── Customer.ts           # Customer Entity
│   ├── Order.ts              # Order Entity
│   ├── Cart.ts               # Cart Entity
│   ├── repositories/         # Interfaces (Ports)
│   │   ├── ProductRepository.ts
│   │   ├── CustomerRepository.ts
│   │   ├── OrderRepository.ts
│   │   └── CartRepository.ts
│   ├── events/               # Event Interfaces
│   │   └── EventPublisher.ts
│   └── services/             # Service Interfaces
│       └── CacheService.ts
│
├── application/              # Application Layer (Use Cases)
│   └── use-cases/
│       ├── CreateOrderUseCase.ts
│       ├── AddToCartUseCase.ts
│       ├── GetProductsUseCase.ts
│       └── GetProductByIdUseCase.ts
│
└── infrastructure/           # Infrastructure Layer (Adapters)
    ├── repositories/         # MongoDB implementations
    │   ├── MongoProductRepository.ts
    │   ├── MongoCustomerRepository.ts
    │   ├── MongoOrderRepository.ts
    │   └── MongoCartRepository.ts
    ├── events/               # RabbitMQ Implementation
    │   └── RabbitMQEventPublisher.ts
    └── cache/                # Redis Implementation
        └── RedisCacheService.ts
```

## 🚀 Installation

### Prerequisites

- **Node.js 22** (LTS). Run `nvm use` in the project folder if you use nvm (see `.nvmrc`).
- (Optional) RabbitMQ - For retry system
- (Optional) Redis - For cache
- MongoDB Atlas account - For database

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Install Redis (Windows)

There are several options to install Redis on Windows:

#### Option A: Docker Compose (Recommended - Fully containerized) 🐳

This option runs **both Redis and the application** inside Docker containers.

1. **Start Docker Desktop**:
   - Open Docker Desktop from the start menu
   - Wait for the Docker icon to appear in the taskbar

2. **Run everything with Docker Compose**:

   **Option 1: Using the script (Easier)**:
   ```powershell
   .\docker-up.ps1
   ```

   **Option 2: Manually**:
   ```bash
   docker-compose up --build -d
   ```

   This will build and start:
   - ✅ Redis (container)
   - ✅ RabbitMQ (container)
   - ✅ Node.js Application (container)

3. **View logs**:
   ```bash
   docker-compose logs -f app
   ```

4. **Stop everything**:
   ```bash
   docker-compose down
   ```

#### Option B: Only Redis with Docker 🐳

If you prefer to run only Redis with Docker and the application locally:

1. **Start Docker Desktop**

2. **Run Redis**:
   ```powershell
   .\start-redis.ps1
   ```
   Or manually:
   ```bash
   docker run -d -p 6379:6379 --name redis redis:latest
   ```

3. **Run the application locally**:
   ```bash
   npm run dev
   ```

#### Option C: WSL2 (Windows Subsystem for Linux) 🐧

1. **Install WSL2** (if you don't have it):
   ```powershell
   wsl --install
   ```
   Restart your computer after installation.

2. **Open Ubuntu/WSL** and run:
   ```bash
   sudo apt update
   sudo apt install redis-server -y
   sudo service redis-server start
   ```

3. **Verify it works**:
   ```bash
   redis-cli ping
   ```
   Should respond `PONG`.

#### Option D: Memurai (Native Windows Version) 🪟

1. **Download Memurai**:
   - Visit: https://www.memurai.com/get-memurai
   - Download the Developer version (free)

2. **Install Memurai**:
   - Run the installer
   - Follow the instructions (accept default values)

3. **Start the service**:
   - Memurai starts automatically as a Windows service
   - Open "Services" and verify that "Memurai" is running

### Step 3: Configure environment variables (REQUIRED)

1. **Create `.env` file from template:**

   **Windows (PowerShell):**
   ```powershell
   .\setup-env.ps1
   ```
   
   **Or manually:**
   ```bash
   cp .env.example .env
   # On Windows: copy .env.example .env
   ```

2. **Edit `.env` and add your MongoDB Atlas credentials:**
   ```env
   # MongoDB Atlas Connection (REQUIRED)
   # Get your connection string from MongoDB Atlas Dashboard
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.c9abu9a.mongodb.net/ecommerce?appName=Cluster0
   
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # RabbitMQ Configuration
   RABBITMQ_URL=amqp://localhost:5672
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173  # Frontend URL for CORS (update with the actual deployed frontend URL)
   ```

**⚠️ SECURITY BEST PRACTICES**: 
- ✅ The `.env` file is in `.gitignore` and will **NOT** be pushed to GitHub
- ✅ **NEVER** commit real credentials to the repository
- ✅ Use `.env.example` as a template (it contains placeholders, not real credentials)
- ✅ For QA/Production, use **GitHub Secrets** (see [Deployment Guide](docs/DEPLOYMENT.md))
- ✅ Rotate credentials regularly
- ✅ Use different credentials for development, QA, and production environments

**📚 For QA/Production deployment**, see [Deployment Guide](docs/DEPLOYMENT.md) for instructions on using GitHub Secrets.

### Step 3.5: Configure SendGrid Email Service (Required for Authentication)

The application uses SendGrid for sending email verification and password reset emails. Follow these steps to set up SendGrid:

1. **Create a SendGrid Account**:
   - Go to [https://sendgrid.com](https://sendgrid.com)
   - Sign up for a free account (allows up to 100 emails/day)

2. **Complete Single Sender Verification**:
   - In SendGrid dashboard, go to **Settings** → **Sender Authentication**
   - Click **Verify a Single Sender**
   - Fill in the form with your email address and information
   - Check your email and click the verification link
   - Wait for verification to complete (usually instant)

3. **Generate an API Key**:
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name it (e.g., "E-commerce Backend")
   - Select **Full Access** or **Restricted Access** with Mail Send permissions
   - Click **Create & View**
   - **Copy the API key immediately** (you won't be able to see it again)
   - The API key will start with `SG.`

4. **Add to `.env` file**:
   ```env
   SENDGRID_API_KEY=SG.your-actual-api-key-here
   SENDGRID_FROM_EMAIL=your-verified-email@example.com
   ```

5. **Verify Configuration**:
   - Restart your application
   - You should see: `✅ SendGrid email service configured`
   - If you see warnings, check that both variables are set correctly

**Note**: Without SendGrid configuration, email verification and password reset will not work. Users will be able to register but cannot verify their email or reset passwords.

### Step 4: Run with Docker Compose (Recommended)

If you chose option A (Docker Compose), everything is containerized:

```powershell
.\docker-up.ps1
```

Or manually:
```bash
docker-compose up --build -d
docker-compose logs -f app
```

### Step 5: Verify Redis

To verify that Redis is working correctly:

**With Docker:**
```bash
docker exec -it redis redis-cli ping
# Should respond: PONG
```

**With WSL2:**
```bash
redis-cli ping
# Should respond: PONG
```

**With Memurai:**
Open PowerShell and run:
```powershell
redis-cli ping
# Should respond: PONG
```

### Step 6: Run (if not using Docker Compose)

```bash
# Development
npm run dev

# Production (compile first)
npm run build
node dist/index.js
```

**Verification**: When you run `npm run dev`, you should see:
- `✅ Connected to Redis` if Redis is running
- `⚠️ Redis not available, using in-memory fallback` if Redis is not available (but the app will still work)

## 🛠️ Redis Management

### Useful Commands

**With Docker:**

**Using helper scripts:**
```powershell
# Start Redis
.\start-redis.ps1

# Stop Redis
.\stop-redis.ps1
```

**Or manually:**
```bash
# Start Redis
docker start redis

# Stop Redis
docker stop redis

# View logs
docker logs redis

# Remove container
docker rm -f redis
```

**With WSL2:**
```bash
# Start Redis
sudo service redis-server start

# Stop Redis
sudo service redis-server stop

# Restart Redis
sudo service redis-server restart

# View status
sudo service redis-server status
```

**With Memurai:**
- Open Windows "Services"
- Search for "Memurai" and right-click to start/stop

### Access Redis CLI

To interact with Redis directly:

```bash
# With Docker
docker exec -it redis redis-cli

# With WSL2
redis-cli

# With Memurai (from PowerShell)
redis-cli
```

Inside the CLI you can run:
```redis
# View all keys
KEYS *

# View value of a key
GET product:1

# Delete a key
DEL product:1

# Delete all keys
FLUSHALL

# Exit
exit
```

## 🔄 Retry System with RabbitMQ

The retry system is implemented in `RabbitMQEventPublisher`:

- **Automatic retry** with exponential backoff
- **Dead Letter Queue (DLQ)** for events that fail after multiple attempts
- **Configurable**: `maxRetries` (default: 3)

```typescript
// Usage with automatic retry
await eventPublisher.publishWithRetry('order.created', {
  orderId: order.id,
  customerId: order.customerId,
  total: order.total
});
```

## 💾 Cache with Redis

The cache system is implemented in `RedisCacheService`:

- **In-memory fallback** if Redis is not available
- **Configurable TTL** for each key
- **Automatic cleanup** of expired entries

```typescript
// Cache usage
const products = await getProductsUseCase.execute({ 
  category: 'Electronics',
  useCache: true 
});
```

## 🎯 Implemented Use Cases

### 1. CreateOrderUseCase
Creates an order validating:
- Customer existence and status
- Stock availability
- Total calculation
- Event publication with retry

### 2. AddToCartUseCase
Adds products to cart:
- Customer and product validation
- Quantity management
- Cart persistence

### 3. GetProductsUseCase
Gets products with cache:
- Category support
- Automatic cache (TTL: 5 min)
- Database fallback

### 4. GetProductByIdUseCase
Gets a product by ID:
- Automatic cache (TTL: 10 min)
- Query optimization

## 🏛️ Hexagonal Architecture Principles

### Domain Layer (Core)
- **Depends on nothing** - It's the business core
- Contains entities, values and business rules
- Defines **ports** (interfaces) that infrastructure will implement

### Application Layer
- **Depends only on domain**
- Contains use cases that coordinate the domain
- Doesn't know infrastructure details

### Infrastructure Layer
- **Depends on domain** (implements ports)
- Contains adapters (MongoDB, RabbitMQ, Redis)
- Can be replaced without affecting the domain

## 🔧 Development

### Compile TypeScript

```bash
pnpm run build
```

### Verify types

```bash
pnpm run check
```

### Commit Workflow

This project uses **Conventional Commits** to maintain a clean and consistent commit history. We use [Commitizen](https://github.com/commitizen/cz-cli), [Husky](https://typicode.github.io/husky/), and [Commitlint](https://commitlint.js.org/) to enforce commit message standards.

#### Using Commitizen (Recommended)

Instead of using `git commit`, use the interactive Commitizen CLI:

```bash
pnpm commit
```

This will guide you through creating a properly formatted commit message.

#### Commit Message Format

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

#### Commit Types

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor:` - A code change that neither fixes a bug nor adds a feature
- `perf:` - A code change that improves performance
- `test:` - Adding missing tests or correcting existing tests
- `chore:` - Changes to the build process or auxiliary tools and libraries
- `ci:` - Changes to CI configuration files and scripts
- `build:` - Changes that affect the build system or external dependencies
- `revert:` - Reverts a previous commit

#### Examples

```bash
feat(auth): add email verification flow
fix(cart): resolve issue with empty cart on refresh
docs(readme): update installation instructions
refactor(orders): simplify order creation logic
chore(deps): update dependencies to latest versions
```

#### Manual Commits

If you write commit messages manually, they will be automatically validated by Commitlint. Invalid commit messages will be rejected.

**Note**: The commit-msg hook validates all commits, so make sure your commit messages follow the conventional commit format.

## 📝 Notes

- MongoDB repositories use **Mongoose ODM** for database operations
- RabbitMQ and Redis have **fallbacks** if not available
- The project is designed to be easily extensible

## 🎓 Learn More

- [Hexagonal Architecture (Alistair Cockburn)](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports & Adapters Pattern](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)

## 📄 License

MIT
