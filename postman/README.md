# 📮 Postman Collection for E-commerce API

## 📥 Import to Postman

### Option 1: Import Collection and Environment

1. Open Postman
2. Click **Import** (top left button)
3. Drag or select:
   - `E-commerce-API.postman_collection.json` (Collection)
   - `E-commerce-API.postman_environment.json` (Environment - optional but recommended)

### Option 2: Import Only the Collection

If you only want the collection without the environment, import only the `E-commerce-API.postman_collection.json` file.

## 🎯 Included Endpoints

### Health Check
- `GET /health` - Verify that the API is running

### Products
- `GET /api/products` - Get all products
- `GET /api/products?category=Electronics` - Filter by category
- `GET /api/products/:id` - Get a product by ID

### Cart
- `GET /api/cart` - Get user's cart (requires authentication)
- `POST /api/cart` - Add product to cart (requires authentication)
- `DELETE /api/cart/:productId` - Remove a product from cart (requires authentication)

### Orders
- `POST /api/orders` - Create a new order (requires authentication)
- `GET /api/orders` - Get user's orders (requires authentication)
- `GET /api/orders/:id` - Get an order by ID (requires authentication)

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user (requires authentication)

## ⚙️ Environment Variables

The collection uses variables to facilitate usage:

- `{{base_url}}` - API base URL (default: `http://localhost:3000`)
- `{{auth_token}}` - JWT authentication token (set after login)

### Changing the Environment

1. Select the "E-commerce API - Local" environment from the environment selector (top right)
2. You can modify variables by clicking the eye icon 👁️
3. Or create a new environment for production/staging

## 🚀 Getting Started

1. **Make sure the backend is running:**
   ```bash
   docker-compose ps
   # Or verify: http://localhost:3000/health
   ```

2. **Test the Health Check first:**
   - Open "Health Check" in the collection
   - Click "Send"
   - You should receive: `{"status":"ok","timestamp":"..."}`

3. **Test getting products:**
   - Open "Products > Get All Products"
   - Click "Send"
   - You should see a list of products

## 📝 Request Body Examples

### Register User
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### Login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Add to Cart (requires authentication)
```json
{
  "productId": "1",
  "quantity": 2
}
```

### Create Order (requires authentication)
```json
{
  "items": [
    {
      "productId": "1",
      "quantity": 1
    },
    {
      "productId": "2",
      "quantity": 2
    }
  ],
  "shippingAddress": "123 Main St, Barcelona, Spain"
}
```

## 🔧 Customize

You can modify environment variables to:
- Change the base URL (e.g., production)
- Set authentication tokens after login
- Add more variables as needed

## 📚 More Information

- **API Base URL**: http://localhost:3000
- **API Docs**: You can see the endpoints in `src/api/routes/`
- **Backend Logs**: `docker-compose logs -f app`

