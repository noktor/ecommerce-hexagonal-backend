import mongoose, { Schema, Document } from 'mongoose';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface ICustomer extends Document {
  id: string;
  email: string;
  name: string;
  status: CustomerStatus;
  createdAt: Date;
  passwordHash?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: Object.values(CustomerStatus), 
    required: true,
    default: CustomerStatus.ACTIVE
  },
  createdAt: { type: Date, default: Date.now },
  passwordHash: { type: String, required: false },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, required: false, index: true },
  verificationTokenExpiry: { type: Date, required: false },
  resetToken: { type: String, required: false, index: true },
  resetTokenExpiry: { type: Date, required: false }
});

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);

