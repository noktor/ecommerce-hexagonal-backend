// Load environment variables
import 'dotenv/config';

import { CustomerModel, CustomerStatus } from '../models/CustomerModel';
import { ProductModel } from '../models/ProductModel';

export async function seedDatabase(): Promise<void> {
  try {
    // Seed Products
    const existingProducts = await ProductModel.countDocuments();

    if (existingProducts === 0) {
      const mockProducts = [
        {
          id: '1',
          name: 'Laptop',
          description: 'High-performance laptop',
          price: 999.99,
          stock: 10,
          category: 'Electronics',
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Mouse',
          description: 'Wireless mouse',
          price: 29.99,
          stock: 50,
          category: 'Electronics',
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Keyboard',
          description: 'Mechanical keyboard',
          price: 79.99,
          stock: 30,
          category: 'Electronics',
          createdAt: new Date(),
        },
        {
          id: '4',
          name: 'T-Shirt',
          description: 'Cotton t-shirt',
          price: 19.99,
          stock: 100,
          category: 'Clothing',
          createdAt: new Date(),
        },
        {
          id: '5',
          name: 'Jeans',
          description: 'Blue jeans',
          price: 49.99,
          stock: 75,
          category: 'Clothing',
          createdAt: new Date(),
        },
      ];

      await ProductModel.insertMany(mockProducts);
      console.log('✅ Seeded products collection');
    } else {
      console.log('ℹ️  Products collection already has data, skipping seed');
    }

    // Seed Customers
    const existingCustomers = await CustomerModel.countDocuments();

    if (existingCustomers === 0) {
      const mockCustomers = [
        {
          id: '1',
          email: 'john@example.com',
          name: 'John Doe',
          status: CustomerStatus.ACTIVE,
          createdAt: new Date(),
        },
        {
          id: '2',
          email: 'jane@example.com',
          name: 'Jane Smith',
          status: CustomerStatus.ACTIVE,
          createdAt: new Date(),
        },
        {
          id: '3',
          email: 'bob@example.com',
          name: 'Bob Johnson',
          status: CustomerStatus.INACTIVE,
          createdAt: new Date(),
        },
      ];

      await CustomerModel.insertMany(mockCustomers);
      console.log('✅ Seeded customers collection');
    } else {
      console.log('ℹ️  Customers collection already has data, skipping seed');
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if executed directly
if (require.main === module) {
  import('./mongodb').then(async ({ connectToMongoDB, closeMongoDBConnection }) => {
    try {
      await connectToMongoDB();
      await seedDatabase();
      await closeMongoDBConnection();
      console.log('✅ Database seeding completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    }
  });
}
