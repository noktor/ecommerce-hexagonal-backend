import mongoose, { type Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
