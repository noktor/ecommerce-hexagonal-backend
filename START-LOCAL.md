# 🚀 Run Backend Locally

> **Note**: The frontend is in a [separate repository](https://github.com/your-org/ecommerce-frontend). This document only explains how to run the backend.

## Option 1: Backend with Docker (Recommended)

### 1. Start Backend and Redis with Docker

```bash
docker-compose up -d
```

This will start:
- ✅ Redis (port 6379)
- ✅ RabbitMQ (ports 5672, 15672)
- ✅ Backend API (port 3000)

## Option 2: All Local (without Docker)

### 1. Start Redis

If you have Redis installed locally:
```bash
redis-server
```

Or with Docker only for Redis:
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### 2. Run Backend

```bash
pnpm install
pnpm run dev
```

## URLs

- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **API Products**: http://localhost:3000/api/products
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Useful Commands

```bash
# View backend logs (Docker)
docker-compose logs -f app

# Stop everything (Docker)
docker-compose down

# Restart backend (Docker)
docker-compose restart app
```

