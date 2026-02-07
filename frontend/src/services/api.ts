// API URL from environment variable with fallback to default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string | null;
  customerId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  shippingAddress: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data.data;
}

export const api = {
  products: {
    getAll: (category?: string): Promise<Product[]> => {
      const query = category ? `?category=${encodeURIComponent(category)}` : '';
      return fetchApi<Product[]>(`/products${query}`);
    },
    getById: (id: string): Promise<Product> => {
      return fetchApi<Product>(`/products/${id}`);
    },
  },
  cart: {
    getByCustomerId: (): Promise<Cart> => {
      return fetchApi<Cart>('/cart/me');
    },
    addItem: (productId: string, quantity: number): Promise<Cart> => {
      return fetchApi<Cart>('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
    },
    removeItem: (productId: string): Promise<Cart> => {
      return fetchApi<Cart>('/cart/item', {
        method: 'DELETE',
        body: JSON.stringify({ productId }),
      });
    },
  },
  orders: {
    create: (items: Array<{ productId: string; quantity: number }>, shippingAddress: string): Promise<Order> => {
      return fetchApi<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({ items, shippingAddress }),
      });
    },
    getById: (id: string): Promise<Order> => {
      return fetchApi<Order>(`/orders/${id}`);
    },
  },
};

