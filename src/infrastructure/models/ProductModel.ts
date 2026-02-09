import mongoose, { type Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  storeId?: string | null;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  createdAt: Date;
  imageUrl?: string;
  thumbnailUrl?: string;
  longDescription?: string;
}

const ProductSchema = new Schema<IProduct>({
  id: { type: String, required: true, unique: true, index: true },
  storeId: { type: String, required: false, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  imageUrl: { type: String, required: false },
  thumbnailUrl: { type: String, required: false },
  longDescription: { type: String, required: false },
});

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
