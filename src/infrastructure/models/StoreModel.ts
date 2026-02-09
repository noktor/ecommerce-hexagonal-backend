import mongoose, { type Document, Schema } from 'mongoose';

export interface IStore extends Document {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Date;
  description?: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
}

const StoreSchema = new Schema<IStore>({
  id: { type: String, required: true, unique: true, index: true },
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  description: { type: String, required: false },
  imageUrl: { type: String, required: false },
  phone: { type: String, required: false },
  address: { type: String, required: false },
});

export const StoreModel = mongoose.model<IStore>('Store', StoreSchema);

