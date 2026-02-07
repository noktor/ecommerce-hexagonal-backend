import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { TokenService } from '../../domain/services/TokenService';

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  token: string;
  customer: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
}

export class LoginUserUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private requireEmailVerification: boolean = true
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // Find customer by email
    const customer = await this.customerRepository.findByEmail(input.email);
    if (!customer) {
      throw new Error('Invalid email or password');
    }

    // Check if password is set (for existing customers without passwords)
    if (!customer.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.verifyPassword(
      input.password,
      customer.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check email verification if required
    if (this.requireEmailVerification && !customer.isEmailVerified()) {
      throw new Error('Please verify your email before logging in');
    }

    // Check if customer can login
    if (!customer.canLogin()) {
      throw new Error('Account is not active or email not verified');
    }

    // Generate token
    const token = this.tokenService.generateToken({
      userId: customer.id,
      email: customer.email
    });

    return {
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        emailVerified: customer.emailVerified
      }
    };
  }
}

