import { Cart } from '../../domain/Cart';
import { Customer } from '../../domain/Customer';
import type { EventPublisher } from '../../domain/events/EventPublisher';
import { Product } from '../../domain/Product';
import type { CartRepository } from '../../domain/repositories/CartRepository';
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { CacheService } from '../../domain/services/CacheService';
import type { LockService } from '../../domain/services/LockService';

export interface AddToCartRequest {
  customerId: string;
  productId: string;
  quantity: number;
}

export class AddToCartUseCase {
  private readonly CART_LOCK_TTL = 10; // 10 seconds lock (reduced from 30)
  private readonly CART_EXPIRY_MINUTES = 15; // Cart expires in 15 minutes (Ticketmaster-style)
  private readonly MAX_RETRY_ATTEMPTS = 5; // Maximum retry attempts
  private readonly INITIAL_RETRY_DELAY = 50; // Initial delay in milliseconds (50ms)
  private readonly MAX_RETRY_DELAY = 500; // Maximum delay in milliseconds (500ms)

  constructor(
    private cartRepository: CartRepository,
    private customerRepository: CustomerRepository,
    private productRepository: ProductRepository,
    private cacheService: CacheService,
    private lockService: LockService,
    private eventPublisher: EventPublisher
  ) {}

  /**
   * Acquire lock with retry mechanism
   * Uses exponential backoff to retry acquiring the lock
   */
  private async acquireLockWithRetry(lockKey: string, ttlSeconds: number): Promise<boolean> {
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      const lockAcquired = await this.lockService.acquireLock(lockKey, ttlSeconds);

      if (lockAcquired) {
        return true;
      }

      // If not the last attempt, wait before retrying
      if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
        // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 500ms (capped)
        const delay = Math.min(this.INITIAL_RETRY_DELAY * 2 ** attempt, this.MAX_RETRY_DELAY);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  async execute(request: AddToCartRequest): Promise<Cart> {
    const lockKey = `cart:${request.customerId}`;
    const lockAcquired = await this.acquireLockWithRetry(lockKey, this.CART_LOCK_TTL);

    if (!lockAcquired) {
      throw new Error(
        'Cart is currently being modified by another request. Please try again in a moment.'
      );
    }

    try {
      // Validate customer
      const customer = await this.customerRepository.findById(request.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Validate product
      const product = await this.productRepository.findById(request.productId);
      if (!product) {
        throw new Error('Product not found');
      }
      if (!product.hasStock(request.quantity)) {
        throw new Error(`Insufficient stock. Available: ${product.stock}`);
      }

      // Get or create cart
      let cart = await this.cartRepository.findByCustomerId(request.customerId);

      // Check if cart expired
      if (cart && cart.isExpired()) {
        // Clear expired cart
        await this.cartRepository.clear(request.customerId);
        const cacheKey = `cart:${request.customerId}`;
        await this.cacheService.delete(cacheKey);
        cart = null;
      }

      if (!cart) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + this.CART_EXPIRY_MINUTES);

        cart = new Cart(this.generateCartId(), request.customerId, [], new Date(), expiresAt);
      }

      // Add item to cart
      cart.addItem(request.productId, request.quantity);

      // Save cart
      await this.cartRepository.save(cart);

      // Cache the cart with TTL matching expiration
      const cacheKey = `cart:${request.customerId}`;
      const cacheTTL = cart.getExpiresInSeconds();
      await this.cacheService.set(cacheKey, cart, cacheTTL);

      // NOTE: We do NOT invalidate product cache here because:
      // 1. Stock in database doesn't change when adding to cart (only changes on order creation)
      // 2. Invalidating cache on every cart modification would reduce cache effectiveness
      // 3. Product cache has a short TTL (5 minutes) which provides reasonable freshness
      // 4. Stock validation happens at order creation time, ensuring data consistency
      //
      // If you need real-time available stock (accounting for items in carts), consider:
      // - Calculating available stock dynamically: databaseStock - sum(quantities in active carts)
      // - Using a shorter TTL for product cache (e.g., 30 seconds)
      // - Implementing a stock reservation system

      // Publish event for cart update
      await this.eventPublisher.publish('cart.updated', {
        cartId: cart.id,
        customerId: cart.customerId,
        productId: request.productId,
        quantity: request.quantity,
        action: 'add',
        expiresAt: cart.expiresAt?.toISOString(),
      });

      return cart;
    } finally {
      await this.lockService.releaseLock(lockKey);
    }
  }

  private generateCartId(): string {
    return `CART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
