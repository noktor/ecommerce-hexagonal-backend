import { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';

// Mock implementation - In production, this would use MySQL
export class MysqlProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  // Simulate database latency (50-150ms typical for MySQL queries)
  private async simulateLatency(min: number = 50, max: number = 150): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async findById(id: string): Promise<Product | null> {
    await this.simulateLatency();
    return this.products.get(id) || null;
  }

  async findAll(): Promise<Product[]> {
    await this.simulateLatency(100, 200); // More data = slower query
    return Array.from(this.products.values());
  }

  async findByCategory(category: string): Promise<Product[]> {
    await this.simulateLatency(80, 180);
    return Array.from(this.products.values()).filter((p) => p.category === category);
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    await this.simulateLatency(100, 250); // Writes with locks are slower
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // In a real implementation, this would be an atomic SQL update with row lock
    const updatedProduct = new Product(
      product.id,
      product.storeId ?? null,
      product.name,
      product.description,
      product.price,
      product.stock + quantity,
      product.category,
      product.createdAt,
      product.imageUrl,
      product.thumbnailUrl,
      product.longDescription
    );
    this.products.set(productId, updatedProduct);
  }

  async findByStoreId(storeId: string): Promise<Product[]> {
    await this.simulateLatency(80, 180);
    return Array.from(this.products.values()).filter((p) => p.storeId === storeId);
  }

  async create(product: Product): Promise<Product> {
    await this.simulateLatency();
    this.products.set(product.id, product);
    return product;
  }

  async update(product: Product): Promise<Product> {
    await this.simulateLatency();
    this.products.set(product.id, product);
    return product;
  }

  private initializeMockData(): void {
    const mockProducts = [
      new Product('1', null, 'Laptop', 'High-performance laptop', 999.99, 10, 'Electronics', new Date()),
      new Product('2', null, 'Mouse', 'Wireless mouse', 29.99, 50, 'Electronics', new Date()),
      new Product('3', null, 'Keyboard', 'Mechanical keyboard', 79.99, 30, 'Electronics', new Date()),
      new Product('4', null, 'T-Shirt', 'Cotton t-shirt', 19.99, 100, 'Clothing', new Date()),
      new Product('5', null, 'Jeans', 'Blue jeans', 49.99, 75, 'Clothing', new Date()),
    ];

    mockProducts.forEach((product) => {
      this.products.set(product.id, product);
    });
  }
}
