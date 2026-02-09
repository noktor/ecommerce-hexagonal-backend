import { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';

export interface UpdateStoreProductInput {
  productId: string;
  ownerId: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  longDescription?: string;
}

export class UpdateStoreProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(input: UpdateStoreProductInput): Promise<Product> {
    const existing = await this.productRepository.findById(input.productId);
    if (!existing) {
      throw new Error('Product not found');
    }
    if (!existing.storeId) {
      throw new Error('Product is not associated with a store');
    }

    const store = await this.storeRepository.findById(existing.storeId);
    if (!store || store.ownerId !== input.ownerId) {
      throw new Error('You do not have permission to update this product');
    }

    const updated = new Product(
      existing.id,
      existing.storeId,
      input.name ?? existing.name,
      input.description ?? existing.description,
      input.price ?? existing.price,
      input.stock ?? existing.stock,
      input.category ?? existing.category,
      existing.createdAt,
      input.imageUrl ?? existing.imageUrl,
      input.thumbnailUrl ?? existing.thumbnailUrl,
      input.longDescription ?? existing.longDescription
    );

    return this.productRepository.update(updated);
  }
}

