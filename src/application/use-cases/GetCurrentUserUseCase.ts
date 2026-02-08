import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';

export interface GetCurrentUserInput {
  userId: string;
}

export interface GetCurrentUserOutput {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  status: string;
}

export class GetCurrentUserUseCase {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    const customer = await this.customerRepository.findById(input.userId);

    if (!customer) {
      throw new Error('User not found');
    }

    return {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      emailVerified: customer.emailVerified,
      status: customer.status,
    };
  }
}
