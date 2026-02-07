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

export interface EmailService {
  sendVerificationEmail(data: EmailVerificationData): Promise<void>;
  sendPasswordResetEmail(data: PasswordResetData): Promise<void>;
  sendPasswordResetConfirmation(email: string, name: string): Promise<void>;
}

