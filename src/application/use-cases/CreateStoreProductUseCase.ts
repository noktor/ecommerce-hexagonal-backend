import { randomUUID } from 'crypto';
import { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';

export interface CreateStoreProductInput {
  storeId: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  longDescription?: string;
}

export class CreateStoreProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(input: CreateStoreProductInput): Promise<Product> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new Error('Store not found');
    }
    if (store.ownerId !== input.ownerId) {
      throw new Error('You do not have permission to add products to this store');
    }

    const product = new Product(
      randomUUID(),
      store.id,
      input.name,
      input.description,
      input.price,
      input.stock,
      input.category,
      new Date(),
      input.imageUrl,
      input.thumbnailUrl,
      input.longDescription
    );

    return this.productRepository.create(product);
  }
}

