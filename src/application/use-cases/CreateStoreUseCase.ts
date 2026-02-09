import { randomUUID } from 'crypto';
import { Store } from '../../domain/Store';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';

export interface CreateStoreInput {
  ownerId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  phone?: string;
  address?: string;
}

export class CreateStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: CreateStoreInput): Promise<Store> {
    const store = new Store(
      randomUUID(),
      input.ownerId,
      input.name,
      new Date(),
      input.description,
      input.imageUrl,
      input.phone,
      input.address
    );

    return this.storeRepository.create(store);
  }
}

