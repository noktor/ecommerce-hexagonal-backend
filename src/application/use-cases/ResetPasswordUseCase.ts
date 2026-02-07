import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { EmailService } from '../../domain/services/EmailService';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

export class ResetPasswordUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private passwordService: PasswordService,
    private emailService: EmailService
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    // Find customer by reset token
    const customer = await this.customerRepository.findByResetToken(input.token);
    
    if (!customer) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(input.newPassword);

    // Update customer with new password and clear reset token
    const updatedCustomer = customer
      .withPasswordHash(passwordHash)
      .clearResetToken();

    // Save updated customer
    await this.customerRepository.save(updatedCustomer);

    // Send confirmation email
    await this.emailService.sendPasswordResetConfirmation(
      customer.email,
      customer.name
    );

    return {
      success: true,
      message: 'Password reset successfully'
    };
  }
}

