import { Cart } from '../../domain/Cart';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { CacheService } from '../../domain/services/CacheService';
import { LockService } from '../../domain/services/LockService';
import { EventPublisher } from '../../domain/events/EventPublisher';

export interface RemoveFromCartRequest {
  customerId: string;
  productId: string;
}

export class RemoveFromCartUseCase {
  private readonly CART_LOCK_TTL = 10; // 10 seconds lock (reduced from 30)
  private readonly MAX_RETRY_ATTEMPTS = 5; // Maximum retry attempts
  private readonly INITIAL_RETRY_DELAY = 50; // Initial delay in milliseconds (50ms)
  private readonly MAX_RETRY_DELAY = 500; // Maximum delay in milliseconds (500ms)

  constructor(
    private cartRepository: CartRepository,
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
        const delay = Math.min(
          this.INITIAL_RETRY_DELAY * Math.pow(2, attempt),
          this.MAX_RETRY_DELAY
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  async execute(request: RemoveFromCartRequest): Promise<Cart> {
    const lockKey = `cart:${request.customerId}`;
    const lockAcquired = await this.acquireLockWithRetry(lockKey, this.CART_LOCK_TTL);
    
    if (!lockAcquired) {
      throw new Error('Cart is currently being modified by another request. Please try again in a moment.');
    }

    try {
      // Get cart
      let cart = await this.cartRepository.findByCustomerId(request.customerId);
      
      if (!cart) {
        throw new Error('Cart not found');
      }

      // Check if cart expired
      if (cart.isExpired()) {
        throw new Error('Cart has expired. Please add items again.');
      }

      // Check if item exists
      const itemExists = cart.items.some(item => item.productId === request.productId);
      if (!itemExists) {
        throw new Error('Item not found in cart');
      }

      // Remove item
      const updatedItems = cart.removeItem(request.productId);

      // Create updated cart (preserve expiration)
      const updatedCart = new Cart(
        cart.id,
        cart.customerId,
        updatedItems,
        new Date(),
        cart.expiresAt
      );

      // Save cart
      await this.cartRepository.save(updatedCart);

      // Cache the cart with TTL matching expiration
      const cacheKey = `cart:${request.customerId}`;
      const cacheTTL = updatedCart.getExpiresInSeconds();
      await this.cacheService.set(cacheKey, updatedCart, cacheTTL);

      // NOTE: We do NOT invalidate product cache here because:
      // 1. Stock in database doesn't change when removing from cart
      // 2. Invalidating cache on every cart modification would reduce cache effectiveness
      // 3. Product cache has a short TTL (5 minutes) which provides reasonable freshness
      // 4. Stock validation happens at order creation time, ensuring data consistency

      // Publish event for cart update
      await this.eventPublisher.publish('cart.updated', {
        cartId: updatedCart.id,
        customerId: updatedCart.customerId,
        productId: request.productId,
        action: 'remove'
      });

      return updatedCart;
    } finally {
      await this.lockService.releaseLock(lockKey);
    }
  }
}

