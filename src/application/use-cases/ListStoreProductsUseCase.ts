import type { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';

export interface ListStoreProductsInput {
  storeId: string;
  ownerId: string;
}

export class ListStoreProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(input: ListStoreProductsInput): Promise<Product[]> {
    const store = await this.storeRepository.findById(input.storeId);
    if (!store) {
      throw new Error('Store not found');
    }
    if (store.ownerId !== input.ownerId) {
      throw new Error('You do not have permission to view products for this store');
    }

    return this.productRepository.findByStoreId(input.storeId);
  }
}

