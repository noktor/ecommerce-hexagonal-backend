import { randomUUID } from 'crypto';
import { Store } from '../../domain/Store';
import type { StoreRepository } from '../../domain/repositories/StoreRepository';
import { StoreModel, type IStore } from '../models/StoreModel';

export class MongoStoreRepository implements StoreRepository {
  private documentToStore(doc: IStore): Store {
    return new Store(
      doc.id,
      doc.ownerId,
      doc.name,
      doc.createdAt,
      doc.description,
      doc.imageUrl,
      doc.phone,
      doc.address
    );
  }

  async create(store: Store): Promise<Store> {
    const created = await StoreModel.create({
      id: store.id || randomUUID(),
      ownerId: store.ownerId,
      name: store.name,
      createdAt: store.createdAt || new Date(),
      description: store.description,
      imageUrl: store.imageUrl,
      phone: store.phone,
      address: store.address,
    });
    return this.documentToStore(created);
  }

  async findById(id: string): Promise<Store | null> {
    const doc = await StoreModel.findOne({ id }).exec();
    return doc ? this.documentToStore(doc) : null;
  }

  async findByOwner(ownerId: string): Promise<Store[]> {
    const docs = await StoreModel.find({ ownerId }).exec();
    return docs.map((doc) => this.documentToStore(doc));
  }

  async update(store: Store): Promise<Store> {
    const updated = await StoreModel.findOneAndUpdate(
      { id: store.id, ownerId: store.ownerId },
      {
        name: store.name,
        description: store.description,
        imageUrl: store.imageUrl,
        phone: store.phone,
        address: store.address,
      },
      { new: true }
    ).exec();

    if (!updated) {
      throw new Error('Store not found or you do not have permission to update it');
    }

    return this.documentToStore(updated);
  }
}

