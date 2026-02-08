import type { Product } from '../Product';

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  updateStock(productId: string, quantity: number): Promise<void>;
}
