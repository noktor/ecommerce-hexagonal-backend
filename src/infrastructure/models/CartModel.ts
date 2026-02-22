import mongoose, { type Document, Schema } from 'mongoose';
import { CartStatus } from '../../domain/Cart';

export interface ICartItem {
  productId: string;
  quantity: number;
  reservedUntil?: Date;
}

export interface ICart extends Document {
  id: string;
  userId: string;
  items: ICartItem[];
  updatedAt: Date;
  /**
   * Legacy field; no longer used as a TTL index for deletion.
   * May be kept as a business hint if needed.
   */
  expiresAt?: Date;
  status: CartStatus;
  lastActivityAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    reservedUntil: { type: Date },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, unique: true, index: true },
  items: [CartItemSchema],
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // no TTL index anymore
  status: {
    type: String,
    enum: Object.values(CartStatus),
    required: true,
    default: CartStatus.ACTIVE,
    index: true,
  },
  lastActivityAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const CartModel = mongoose.model<ICart>('Cart', CartSchema);
