import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import type { EmailService } from '../../domain/services/EmailService';
import type { PasswordService } from '../../domain/services/PasswordService';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

/**
 * Password security configuration following NIST and OWASP best practices
 * - Keep last N passwords in history to prevent reuse
 * - Standard recommendation: 3-5 previous passwords
 */
const PASSWORD_HISTORY_SIZE = parseInt(process.env.PASSWORD_HISTORY_SIZE || '5', 10);

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

    // Validate that new password is different from current password and password history
    // This follows NIST SP 800-63B and OWASP password security best practices

    // Check current password (prevent immediate reuse)
    if (customer.passwordHash) {
      const isSameAsCurrent = await this.passwordService.verifyPassword(
        input.newPassword,
        customer.passwordHash
      );

      if (isSameAsCurrent) {
        throw new Error('New password must be different from your current password');
      }
    }

    // Check password history (prevent reuse of recent passwords)
    // Standard practice: prevent reuse of last 3-5 passwords
    if (customer.passwordHistory && customer.passwordHistory.length > 0) {
      for (const historyEntry of customer.passwordHistory) {
        const isSameAsHistory = await this.passwordService.verifyPassword(
          input.newPassword,
          historyEntry.hash
        );

        if (isSameAsHistory) {
          throw new Error(
            `New password must be different from your recent passwords. ` +
              `Please choose a password you have not used in the last ${PASSWORD_HISTORY_SIZE} password changes.`
          );
        }
      }
    }

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(input.newPassword);

    // Update customer with new password (adds current to history) and clear reset token
    // Password history is automatically managed: current password moves to history
    const updatedCustomer = customer
      .withPasswordHash(passwordHash, PASSWORD_HISTORY_SIZE)
      .clearResetToken();

    // Save updated customer
    await this.customerRepository.save(updatedCustomer);

    // Send confirmation email
    await this.emailService.sendPasswordResetConfirmation(customer.email, customer.name);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
