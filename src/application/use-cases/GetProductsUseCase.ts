import { Product } from '../../domain/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { CacheService } from '../../domain/services/CacheService';

export interface GetProductsRequest {
  category?: string;
  useCache?: boolean;
}

export class GetProductsUseCase {
  constructor(
    private productRepository: ProductRepository,
    private cacheService: CacheService
  ) {}

  async execute(request: GetProductsRequest = {}): Promise<Product[]> {
    const cacheKey = request.category 
      ? `products:category:${request.category}`
      : 'products:all';

    // Try to get from cache
    if (request.useCache !== false) {
      const cached = await this.cacheService.get<Product[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Get from repository
    const products = request.category
      ? await this.productRepository.findByCategory(request.category)
      : await this.productRepository.findAll();

    // Cache the result (TTL: 30 seconds for better stock freshness)
    // Shorter TTL ensures users see reasonably fresh stock data without
    // the overhead of invalidating cache on every cart modification
    if (request.useCache !== false) {
      await this.cacheService.set(cacheKey, products, 30);
    }

    return products;
  }
}

