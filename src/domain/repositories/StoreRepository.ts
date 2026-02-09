import type { Store } from '../Store';

export interface StoreRepository {
  create(store: Store): Promise<Store>;
  findById(id: string): Promise<Store | null>;
  findByOwner(ownerId: string): Promise<Store[]>;
  update(store: Store): Promise<Store>;
}

