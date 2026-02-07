import { Customer, CustomerStatus } from '../../domain/Customer';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { PasswordService } from '../../domain/services/PasswordService';
import { EmailService } from '../../domain/services/EmailService';
import { randomUUID } from 'crypto';

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

export interface RegisterUserOutput {
  customer: Customer;
  message: string;
}

export class RegisterUserUseCase {
  constructor(
    private customerRepository: CustomerRepository,
    private passwordService: PasswordService,
    private emailService: EmailService,
    private frontendUrl: string
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // Check if email already exists
    const existingCustomer = await this.customerRepository.findByEmail(input.email);
    if (existingCustomer) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(input.password);

    // Generate verification token
    const verificationToken = randomUUID();
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours expiry

    // Create customer
    const customer = new Customer(
      randomUUID(),
      input.email,
      input.name,
      CustomerStatus.ACTIVE,
      new Date(),
      passwordHash,
      false, // email not verified yet
      verificationToken,
      verificationTokenExpiry
    );

    // Save customer
    const savedCustomer = await this.customerRepository.save(customer);

    // Send verification email
    const verificationUrl = `${this.frontendUrl}/verify-email/${verificationToken}`;
    await this.emailService.sendVerificationEmail({
      email: savedCustomer.email,
      name: savedCustomer.name,
      verificationToken: savedCustomer.verificationToken!,
      verificationUrl
    });

    return {
      customer: savedCustomer,
      message: 'Registration successful. Please check your email to verify your account.'
    };
  }
}

