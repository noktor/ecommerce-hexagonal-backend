export interface EmailVerificationData {
  email: string;
  name: string;
  verificationToken: string;
  verificationUrl: string;
}

export interface PasswordResetData {
  email: string;
  name: string;
  resetToken: string;
  resetUrl: string;
}

export interface OrderConfirmationData {
  email: string;
  name: string;
  orderId: string;
  total: number;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: string;
}

export interface EmailService {
  sendVerificationEmail(data: EmailVerificationData): Promise<void>;
  sendPasswordResetEmail(data: PasswordResetData): Promise<void>;
  sendPasswordResetConfirmation(email: string, name: string): Promise<void>;
  sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void>;
}
