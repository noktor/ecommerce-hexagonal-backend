import { Cart, type CartItem } from '../../domain/Cart';
import type { CartRepository } from '../../domain/repositories/CartRepository';
import { CartModel, type ICart } from '../models/CartModel';

export class MongoCartRepository implements CartRepository {
  private documentToCart(doc: ICart): Cart {
    return new Cart(doc.id, doc.customerId, doc.items as CartItem[], doc.updatedAt, doc.expiresAt);
  }

  async findByCustomerId(customerId: string): Promise<Cart | null> {
    const doc = await CartModel.findOne({ customerId }).exec();
    return doc ? this.documentToCart(doc) : null;
  }

  async save(cart: Cart): Promise<void> {
    await CartModel.findOneAndUpdate(
      { id: cart.id },
      {
        id: cart.id,
        customerId: cart.customerId,
        items: cart.items,
        updatedAt: cart.updatedAt,
        expiresAt: cart.expiresAt,
      },
      { upsert: true, new: true }
    ).exec();
  }

  async clear(customerId: string): Promise<void> {
    await CartModel.deleteOne({ customerId }).exec();
  }
}
