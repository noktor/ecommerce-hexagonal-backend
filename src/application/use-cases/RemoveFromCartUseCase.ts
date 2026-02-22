import { Cart } from '../../domain/Cart';
import type { EventPublisher } from '../../domain/events/EventPublisher';
import type { CartRepository } from '../../domain/repositories/CartRepository';
import type { CacheService } from '../../domain/services/CacheService';
import type { LockService } from '../../domain/services/LockService';

export interface RemoveFromCartRequest {
  userId: string;
  productId: string;
}

export class RemoveFromCartUseCase {
  private readonly CART_LOCK_TTL = 10;
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly INITIAL_RETRY_DELAY = 50;
  private readonly MAX_RETRY_DELAY = 500;

  constructor(
    private cartRepository: CartRepository,
    private cacheService: CacheService,
    private lockService: LockService,
    private eventPublisher: EventPublisher
  ) {}

  private async acquireLockWithRetry(lockKey: string, ttlSeconds: number): Promise<boolean> {
    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      const lockAcquired = await this.lockService.acquireLock(lockKey, ttlSeconds);
      if (lockAcquired) return true;
      if (attempt < this.MAX_RETRY_ATTEMPTS - 1) {
        const delay = Math.min(this.INITIAL_RETRY_DELAY * 2 ** attempt, this.MAX_RETRY_DELAY);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return false;
  }

  async execute(request: RemoveFromCartRequest): Promise<Cart> {
    const lockKey = `cart:${request.userId}`;
    const lockAcquired = await this.acquireLockWithRetry(lockKey, this.CART_LOCK_TTL);

    if (!lockAcquired) {
      throw new Error(
        'Cart is currently being modified by another request. Please try again in a moment.'
      );
    }

    try {
      const cart = await this.cartRepository.findByUserId(request.userId);

      if (!cart) {
        throw new Error('Cart not found');
      }

      const itemExists = cart.items.some((item) => item.productId === request.productId);
      if (!itemExists) {
        throw new Error('Item not found in cart');
      }

      const updatedItems = cart.removeItem(request.productId);
      const now = new Date();
      const updatedCart = new Cart(
        cart.id,
        cart.userId,
        updatedItems,
        now,
        cart.expiresAt,
        cart.status,
        now
      );

      await this.cartRepository.save(updatedCart);
      const cacheTTL = updatedCart.getExpiresInSeconds();
      await this.cacheService.set(`cart:${request.userId}`, updatedCart, cacheTTL);

      await this.eventPublisher.publish('cart.updated', {
        cartId: updatedCart.id,
        userId: updatedCart.userId,
        productId: request.productId,
        action: 'remove',
      });

      return updatedCart;
    } finally {
      await this.lockService.releaseLock(lockKey);
    }
  }
}
