import { randomUUID } from 'crypto';
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import type { EmailService } from '../../domain/services/EmailService';

export interface RequestPasswordResetInput {
  email: string;
}

export interface RequestPasswordResetOutput {
  success: boolean;
  message: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private emailService: EmailService,
    private frontendUrl: string
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
    // Find customer by email
    const customer = await this.customerRepository.findByEmail(input.email);

    // Don't reveal if email exists or not (security best practice)
    if (!customer) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = randomUUID();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    // Update customer with reset token
    const updatedCustomer = customer.withResetToken(resetToken, resetTokenExpiry);
    await this.customerRepository.save(updatedCustomer);

    // Send reset email
    const resetUrl = `${this.frontendUrl}/reset-password/${resetToken}`;
    await this.emailService.sendPasswordResetEmail({
      email: customer.email,
      name: customer.name,
      resetToken: resetToken,
      resetUrl,
    });

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }
}
