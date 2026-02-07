import { Customer, CustomerStatus } from '../../domain/Customer';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { randomUUID } from 'crypto';

// Mock implementation with simulated latency to emulate real database
export class MysqlCustomerRepository implements CustomerRepository {
  private customers: Map<string, Customer> = new Map();

  constructor() {
    this.initializeMockData();
  }

  // Simulate database latency (50-150ms typical for MySQL queries)
  private async simulateLatency(min: number = 50, max: number = 150): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async findById(id: string): Promise<Customer | null> {
    await this.simulateLatency();
    return this.customers.get(id) || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    await this.simulateLatency();
    return Array.from(this.customers.values()).find(c => c.email === email) || null;
  }

  async findByVerificationToken(token: string): Promise<Customer | null> {
    await this.simulateLatency();
    return Array.from(this.customers.values()).find(
      c => c.verificationToken === token && 
      c.verificationTokenExpiry && 
      c.verificationTokenExpiry > new Date()
    ) || null;
  }

  async findByResetToken(token: string): Promise<Customer | null> {
    await this.simulateLatency();
    return Array.from(this.customers.values()).find(
      c => c.resetToken === token && 
      c.resetTokenExpiry && 
      c.resetTokenExpiry > new Date()
    ) || null;
  }

  async save(customer: Customer): Promise<Customer> {
    await this.simulateLatency();
    const existing = this.customers.get(customer.id);
    if (existing) {
      // Update existing
      this.customers.set(customer.id, customer);
      return customer;
    } else {
      // Create new
      const newCustomer = customer.id ? customer : new Customer(
        randomUUID(),
        customer.email,
        customer.name,
        customer.status,
        customer.createdAt || new Date(),
        customer.passwordHash,
        customer.passwordHistory || [],
        customer.emailVerified,
        customer.verificationToken,
        customer.verificationTokenExpiry,
        customer.resetToken,
        customer.resetTokenExpiry
      );
      this.customers.set(newCustomer.id, newCustomer);
      return newCustomer;
    }
  }

  private initializeMockData(): void {
    const mockCustomers = [
      new Customer('1', 'john@example.com', 'John Doe', CustomerStatus.ACTIVE, new Date(), undefined, []),
      new Customer('2', 'jane@example.com', 'Jane Smith', CustomerStatus.ACTIVE, new Date(), undefined, []),
      new Customer('3', 'bob@example.com', 'Bob Johnson', CustomerStatus.INACTIVE, new Date(), undefined, []),
    ];

    mockCustomers.forEach(customer => {
      this.customers.set(customer.id, customer);
    });
  }
}

