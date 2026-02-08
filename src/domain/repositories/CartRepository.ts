import type { Cart } from '../Cart';

export interface CartRepository {
  findByCustomerId(customerId: string): Promise<Cart | null>;
  save(cart: Cart): Promise<void>;
  clear(customerId: string): Promise<void>;
}
