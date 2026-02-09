import { Store } from '../../domain/Store';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';

export interface UpdateStoreInput {
  storeId: string;
  ownerId: string; // current authenticated retailer
  name?: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
}

export class UpdateStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: UpdateStoreInput): Promise<Store> {
    const existing = await this.storeRepository.findById(input.storeId);
    if (!existing) {
      throw new Error('Store not found');
    }
    if (existing.ownerId !== input.ownerId) {
      throw new Error('You do not have permission to update this store');
    }

    const updated = new Store(
      existing.id,
      existing.ownerId,
      input.name ?? existing.name,
      existing.createdAt,
      input.description ?? existing.description,
      input.imageUrl ?? existing.imageUrl,
      input.phone ?? existing.phone,
      input.address ?? existing.address
    );

    return this.storeRepository.update(updated);
  }
}

