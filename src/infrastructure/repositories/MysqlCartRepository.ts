import type { Cart } from '../../domain/Cart';
import type { CartRepository } from '../../domain/repositories/CartRepository';

// Mock implementation with simulated latency to emulate real database
export class MysqlCartRepository implements CartRepository {
  private carts: Map<string, Cart> = new Map();

  // Simulate database latency (50-150ms typical for MySQL queries)
  private async simulateLatency(min: number = 50, max: number = 150): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async findByCustomerId(customerId: string): Promise<Cart | null> {
    await this.simulateLatency();
    return Array.from(this.carts.values()).find((c) => c.customerId === customerId) || null;
  }

  async save(cart: Cart): Promise<void> {
    await this.simulateLatency(80, 200); // Writes are typically slower
    this.carts.set(cart.id, cart);
  }

  async clear(customerId: string): Promise<void> {
    await this.simulateLatency();
    const cart = await this.findByCustomerId(customerId);
    if (cart) {
      this.carts.delete(cart.id);
    }
  }
}
