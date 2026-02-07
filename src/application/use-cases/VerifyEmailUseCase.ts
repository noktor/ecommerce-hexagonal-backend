import { CustomerRepository } from '../../domain/repositories/CustomerRepository';

export interface VerifyEmailInput {
  token: string;
}

export interface VerifyEmailOutput {
  success: boolean;
  message: string;
}

export class VerifyEmailUseCase {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    // Find customer by verification token
    const customer = await this.customerRepository.findByVerificationToken(input.token);
    
    if (!customer) {
      throw new Error('Invalid or expired verification token');
    }

    // Check if already verified
    if (customer.isEmailVerified()) {
      return {
        success: true,
        message: 'Email already verified'
      };
    }

    // Verify email and clear token
    const verifiedCustomer = customer.verifyEmail().clearVerificationToken();

    // Save updated customer
    await this.customerRepository.save(verifiedCustomer);

    return {
      success: true,
      message: 'Email verified successfully'
    };
  }
}

