import mongoose, { type Document, Schema } from 'mongoose';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface IPasswordHistory {
  hash: string;
  changedAt: Date;
}

export interface ICustomer extends Document {
  id: string;
  email: string;
  name: string;
  status: CustomerStatus;
  createdAt: Date;
  passwordHash?: string;
  passwordHistory?: IPasswordHistory[]; // Last N password hashes
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const PasswordHistorySchema = new Schema<IPasswordHistory>(
  {
    hash: { type: String, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(CustomerStatus),
    required: true,
    default: CustomerStatus.ACTIVE,
  },
  createdAt: { type: Date, default: Date.now },
  passwordHash: { type: String, required: false },
  passwordHistory: { type: [PasswordHistorySchema], required: false, default: [] },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, required: false, index: true },
  verificationTokenExpiry: { type: Date, required: false },
  resetToken: { type: String, required: false, index: true },
  resetTokenExpiry: { type: Date, required: false },
});

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);
