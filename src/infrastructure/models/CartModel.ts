import mongoose, { type Document, Schema } from 'mongoose';

export interface ICartItem {
  productId: string;
  quantity: number;
  reservedUntil?: Date;
}

export interface ICart extends Document {
  id: string;
  customerId: string;
  items: ICartItem[];
  updatedAt: Date;
  expiresAt?: Date;
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
  customerId: { type: String, required: true, unique: true, index: true },
  items: [CartItemSchema],
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }, // TTL index
});

export const CartModel = mongoose.model<ICart>('Cart', CartSchema);
