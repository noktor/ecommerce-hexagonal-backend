# 🚀 Quick Environment Variables Setup for Render

## ❌ Current Error
```
Missing required environment variables: MONGODB_URI
```

## ✅ Solution: Configure Environment Variables in Render

### Step 1: Access Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service (ecommerce-backend)
3. Go to the **Environment** tab (in the left sidebar)

### Step 2: Add Required Variables

Click **"Add Environment Variable"** and add these variables **one by one**:

#### 🔴 REQUIRED (You must add these):

**1. MONGODB_URI**
```
Key: MONGODB_URI
Value: mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ecommerce?appName=Cluster0
```
⚠️ **Important**: 
- Replace `YOUR_USERNAME` with your MongoDB Atlas username
- Replace `YOUR_PASSWORD` with your MongoDB Atlas password
- Replace `cluster0.xxxxx` with your actual MongoDB Atlas cluster

**2. FRONTEND_URL**
```
Key: FRONTEND_URL
Value: https://your-app.netlify.app
```
⚠️ **Important**: 
- Replace with your actual Netlify frontend URL
- Must include `https://`
- Do not add trailing slash (`/`)

**3. NODE_ENV**
```
Key: NODE_ENV
Value: production
```

**4. PORT**
```
Key: PORT
Value: 3000
```

### Step 3: Optional Variables (Recommended)

**5. JWT_SECRET**
```
Key: JWT_SECRET
Value: [generate a secure secret key]
```
To generate a secure key, you can use:
```bash
openssl rand -base64 32
```

**6. JWT_EXPIRES_IN**
```
Key: JWT_EXPIRES_IN
Value: 7d
```

**7. SENDGRID_API_KEY** (Optional but recommended for emails)
```
Key: SENDGRID_API_KEY
Value: SG.your-sendgrid-api-key
```

**8. SENDGRID_FROM_EMAIL** (Optional but recommended for emails)
```
Key: SENDGRID_FROM_EMAIL
Value: your-verified-email@example.com
```

**9. REDIS_URL** (Optional - only if using Redis)
```
Key: REDIS_URL
Value: redis://your-redis-url:6379
```

**10. RABBITMQ_URL** (Optional - only if using RabbitMQ)
```
Key: RABBITMQ_URL
Value: amqp://your-rabbitmq-url:5672
```

## 📋 Quick Checklist

Before deploying, make sure you have configured **at minimum**:

- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `FRONTEND_URL` - Your Netlify frontend URL
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`

## 🔍 How to Get MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Log in to your account
3. Go to **Database** → Select your cluster
4. Click **Connect** → **Connect your application**
5. Select **Node.js** and copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with `ecommerce` (or the name you want)

**Example format**:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecommerce?appName=Cluster0
```

## ⚠️ Important Reminders

1. **Do not add spaces** before or after the `=` when adding variables
2. **Do not add quotes** around the values (Render adds them automatically)
3. **After adding variables**, Render will automatically restart the service
4. **Check the logs** after restart to see if everything works

## 🔄 After Configuration

1. Render will automatically restart the service
2. Go to the **Logs** tab to see if everything works
3. You should see: `✅ All required environment variables are set`
4. Test the health endpoint: `https://your-backend.onrender.com/health`

## 🆘 If It Still Fails

1. Verify that **there are no spaces** in variable names
2. Verify that **MONGODB_URI** does not contain `YOUR_USERNAME` or `YOUR_PASSWORD`
3. Verify that **MONGODB_URI** starts with `mongodb://` or `mongodb+srv://`
4. Check the **Logs** in Render to see specific errors
