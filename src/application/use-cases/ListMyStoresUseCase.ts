import type { Store } from '../../domain/Store';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';

export class ListMyStoresUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(ownerId: string): Promise<Store[]> {
    return this.storeRepository.findByOwner(ownerId);
  }
}

