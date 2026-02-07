import { Customer } from '../Customer';

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findByVerificationToken(token: string): Promise<Customer | null>;
  findByResetToken(token: string): Promise<Customer | null>;
  save(customer: Customer): Promise<Customer>;
}

