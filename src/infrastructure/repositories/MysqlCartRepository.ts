import { Cart, CartStatus } from '../../domain/Cart';
import type { CartRepository } from '../../domain/repositories/CartRepository';

// Mock implementation with simulated latency to emulate real database
export class MysqlCartRepository implements CartRepository {
  private carts: Map<string, Cart> = new Map();

  // Simulate database latency (50-150ms typical for MySQL queries)
  private async simulateLatency(min: number = 50, max: number = 150): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    await this.simulateLatency();
    return Array.from(this.carts.values()).find((c) => c.userId === userId) || null;
  }

  async save(cart: Cart): Promise<void> {
    await this.simulateLatency(80, 200);
    this.carts.set(cart.id, cart);
  }

  async clear(userId: string): Promise<void> {
    await this.simulateLatency();
    const cart = await this.findByUserId(userId);
    if (cart) {
      const now = new Date();
      const cleared = new Cart(
        cart.id,
        cart.userId,
        [],
        now,
        cart.expiresAt,
        CartStatus.EXPIRED,
        now
      );
      this.carts.set(cleared.id, cleared);
    }
  }
}
