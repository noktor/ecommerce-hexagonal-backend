import { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import { type IProduct, ProductModel } from '../models/ProductModel';

export class MongoProductRepository implements ProductRepository {
  private documentToProduct(doc: IProduct): Product {
    return new Product(
      doc.id,
      doc.name,
      doc.description,
      doc.price,
      doc.stock,
      doc.category,
      doc.createdAt
    );
  }

  async findById(id: string): Promise<Product | null> {
    const doc = await ProductModel.findOne({ id }).exec();
    return doc ? this.documentToProduct(doc) : null;
  }

  async findAll(): Promise<Product[]> {
    const docs = await ProductModel.find({}).exec();
    return docs.map((doc) => this.documentToProduct(doc));
  }

  async findByCategory(category: string): Promise<Product[]> {
    const docs = await ProductModel.find({ category }).exec();
    return docs.map((doc) => this.documentToProduct(doc));
  }

  async updateStock(productId: string, quantity: number): Promise<void> {
    const result = await ProductModel.findOneAndUpdate(
      { id: productId },
      { $inc: { stock: quantity } },
      { new: true }
    ).exec();

    if (!result) {
      throw new Error(`Product not found: ${productId}`);
    }
  }
}
