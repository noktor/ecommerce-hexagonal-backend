# 🚀 Production Setup Guide (Backend)

This guide explains how to configure your backend for production deployment on Render.

## 📋 Prerequisites

- Render account
- MongoDB Atlas database
- Redis service (optional, for caching)
- RabbitMQ service (optional, for event queuing)
- SendGrid account (for email services)

## 🔧 Render Configuration

### 1. Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

#### Option A: Using Node Environment (Recommended - Simpler)

   - **Name**: `ecommerce-backend` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose based on your needs

#### Option B: Using Docker Environment

   - **Name**: `ecommerce-backend` (or your preferred name)
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (default, or leave empty)
   - **Docker Context**: `.` (default, or leave empty)
   - **Plan**: Choose based on your needs

   **Note**: The Dockerfile has been configured for production. It will:
   - Install dependencies
   - Build TypeScript to JavaScript
   - Run the compiled application

   **Important**: When using Docker, you don't need to set Build/Start commands - Render will use the Dockerfile automatically.

### 2. Environment Variables

Go to your Render service → **Environment** → Add the following variables:

#### Required Variables

```env
# MongoDB Atlas Connection (REQUIRED)
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce?appName=Cluster0

# Frontend URL for CORS (REQUIRED)
# Your Netlify frontend URL
FRONTEND_URL=https://your-app.netlify.app

# Server Configuration
NODE_ENV=production
PORT=3000
```

#### Optional but Recommended

```env
# Redis Configuration (if using Redis)
REDIS_URL=redis://your-redis-service-url:6379

# RabbitMQ Configuration (if using RabbitMQ)
RABBITMQ_URL=amqp://your-rabbitmq-service-url:5672

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# SendGrid Email Service (Required for email verification)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=your-verified-email@example.com
```

### 3. Important Configuration Notes

#### CORS Configuration

The `FRONTEND_URL` environment variable is critical for CORS:

- **Must match your Netlify frontend URL exactly**
- **Must include the protocol** (`https://`)
- **No trailing slash**
- **Example**: `https://my-ecommerce-app.netlify.app`

For multiple frontend origins (e.g., staging and production), use comma-separated values:

```env
FRONTEND_URL=https://staging-app.netlify.app,https://production-app.netlify.app
```

#### MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a production cluster (or use existing)
3. Get your connection string from **Connect** → **Connect your application**
4. Replace `<password>` with your database password
5. Add your Render service IP to MongoDB Atlas IP whitelist (or use `0.0.0.0/0` for all IPs)

#### SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Complete Single Sender Verification
3. Generate an API Key with **Mail Send** permissions
4. Copy the API key (starts with `SG.`)
5. Add both `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` to Render

### 4. Build and Deploy

Render will automatically:
1. Clone your repository
2. Run `npm install`
3. Run `npm run build` (compiles TypeScript)
4. Run `npm start` (starts the server)

### 5. Health Check

After deployment, verify your backend is running:

```
https://your-backend.onrender.com/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

## 🔍 Troubleshooting

### Build Failures

**Problem**: Build fails with TypeScript errors

**Solution**:
1. Check that `tsconfig.json` is properly configured
2. Ensure all dependencies are in `package.json`
3. Check Render build logs for specific errors

### Runtime Errors

**Problem**: Service crashes on startup

**Solution**:
1. Check Render logs for error messages
2. Verify all required environment variables are set
3. Ensure MongoDB connection string is correct
4. Check that MongoDB Atlas allows connections from Render IPs

### CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify `FRONTEND_URL` matches your Netlify URL exactly
2. Ensure URL includes `https://` protocol
3. Restart the Render service after updating environment variables
4. Check Render logs for CORS-related errors

### Database Connection Issues

**Problem**: Cannot connect to MongoDB

**Solution**:
1. Verify MongoDB Atlas IP whitelist includes Render IPs (or `0.0.0.0/0`)
2. Check MongoDB connection string format
3. Ensure database user has proper permissions
4. Verify network access is enabled in MongoDB Atlas

## 📊 Monitoring

### Render Logs

View real-time logs in Render dashboard:
- Go to your service → **Logs** tab
- Monitor for errors, warnings, and startup messages

### Health Check Endpoint

Set up monitoring using the health check endpoint:
```
GET https://your-backend.onrender.com/health
```

### Recommended Monitoring

- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Monitor API response times
- Set up alerts for service downtime

## 🔐 Security Best Practices

1. ✅ **Never commit `.env` files** to git
2. ✅ **Use strong JWT secrets** (generate with: `openssl rand -base64 32`)
3. ✅ **Use different MongoDB databases** for dev/staging/production
4. ✅ **Rotate credentials regularly**
5. ✅ **Use HTTPS** for all production URLs
6. ✅ **Limit MongoDB Atlas IP whitelist** to known IPs when possible
7. ✅ **Keep SendGrid API keys secure**
8. ✅ **Use environment-specific configurations**

## 📝 Quick Reference

### Render Service URLs

- **Service URL**: `https://your-backend.onrender.com`
- **API Base**: `https://your-backend.onrender.com/api`
- **Health Check**: `https://your-backend.onrender.com/health`

### Environment Variables Checklist

- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `FRONTEND_URL` - Netlify frontend URL
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `JWT_SECRET` - Strong secret key
- [ ] `SENDGRID_API_KEY` - SendGrid API key
- [ ] `SENDGRID_FROM_EMAIL` - Verified email address
- [ ] `REDIS_URL` - (Optional) Redis connection
- [ ] `RABBITMQ_URL` - (Optional) RabbitMQ connection

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

