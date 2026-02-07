import { Customer, CustomerStatus } from '../../domain/Customer';
import { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { CustomerModel, ICustomer } from '../models/CustomerModel';
import { randomUUID } from 'crypto';

export class MongoCustomerRepository implements CustomerRepository {
  private documentToCustomer(doc: ICustomer): Customer {
    return new Customer(
      doc.id,
      doc.email,
      doc.name,
      doc.status as CustomerStatus,
      doc.createdAt,
      doc.passwordHash,
      doc.emailVerified || false,
      doc.verificationToken,
      doc.verificationTokenExpiry,
      doc.resetToken,
      doc.resetTokenExpiry
    );
  }

  async findById(id: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ id }).exec();
    return doc ? this.documentToCustomer(doc) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ email }).exec();
    return doc ? this.documentToCustomer(doc) : null;
  }

  async findByVerificationToken(token: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    }).exec();
    return doc ? this.documentToCustomer(doc) : null;
  }

  async findByResetToken(token: string): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    }).exec();
    return doc ? this.documentToCustomer(doc) : null;
  }

  async save(customer: Customer): Promise<Customer> {
    const existing = await CustomerModel.findOne({ id: customer.id }).exec();
    
    if (existing) {
      // Update existing customer
      existing.email = customer.email;
      existing.name = customer.name;
      existing.status = customer.status;
      existing.passwordHash = customer.passwordHash;
      existing.emailVerified = customer.emailVerified;
      existing.verificationToken = customer.verificationToken;
      existing.verificationTokenExpiry = customer.verificationTokenExpiry;
      existing.resetToken = customer.resetToken;
      existing.resetTokenExpiry = customer.resetTokenExpiry;
      
      const updated = await existing.save();
      return this.documentToCustomer(updated);
    } else {
      // Create new customer
      const newCustomer = new CustomerModel({
        id: customer.id || randomUUID(),
        email: customer.email,
        name: customer.name,
        status: customer.status,
        createdAt: customer.createdAt || new Date(),
        passwordHash: customer.passwordHash,
        emailVerified: customer.emailVerified,
        verificationToken: customer.verificationToken,
        verificationTokenExpiry: customer.verificationTokenExpiry,
        resetToken: customer.resetToken,
        resetTokenExpiry: customer.resetTokenExpiry
      });
      
      const saved = await newCustomer.save();
      return this.documentToCustomer(saved);
    }
  }
}
