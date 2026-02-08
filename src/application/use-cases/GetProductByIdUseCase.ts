import type { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { CacheService } from '../../domain/services/CacheService';

export class GetProductByIdUseCase {
  constructor(
    private productRepository: ProductRepository,
    private cacheService: CacheService
  ) {}

  async execute(productId: string, useCache: boolean = true): Promise<Product | null> {
    const cacheKey = `product:${productId}`;

    // Try to get from cache
    if (useCache) {
      const cached = await this.cacheService.get<Product>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get from repository
    const product = await this.productRepository.findById(productId);

    // Cache the result if found (TTL: 30 seconds for better stock freshness)
    // Shorter TTL ensures users see reasonably fresh stock data
    if (product && useCache) {
      await this.cacheService.set(cacheKey, product, 30);
    }

    return product;
  }
}
