import { Cart, CartStatus, type CartItem } from '../../domain/Cart';
import type { CartRepository } from '../../domain/repositories/CartRepository';
import { CartModel, type ICart } from '../models/CartModel';

export class MongoCartRepository implements CartRepository {
  private documentToCart(doc: ICart): Cart {
    const lastActivityAt = doc.lastActivityAt ?? doc.updatedAt ?? new Date();
    const status = (doc.status as CartStatus) ?? CartStatus.ACTIVE;
    return new Cart(
      doc.id,
      doc.userId,
      doc.items as CartItem[],
      doc.updatedAt,
      doc.expiresAt,
      status,
      lastActivityAt
    );
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const doc = await CartModel.findOne({ userId }).exec();
    return doc ? this.documentToCart(doc) : null;
  }

  async save(cart: Cart): Promise<void> {
    await CartModel.findOneAndUpdate(
      { id: cart.id },
      {
        id: cart.id,
        userId: cart.userId,
        items: cart.items,
        updatedAt: cart.updatedAt,
        expiresAt: cart.expiresAt,
        status: cart.status,
        lastActivityAt: cart.lastActivityAt,
      },
      { upsert: true, new: true }
    ).exec();
  }

  async clear(userId: string): Promise<void> {
    const now = new Date();
    await CartModel.updateOne(
      { userId },
      {
        $set: {
          items: [],
          status: CartStatus.EXPIRED,
          lastActivityAt: now,
          updatedAt: now,
        },
      }
    ).exec();
  }
}
