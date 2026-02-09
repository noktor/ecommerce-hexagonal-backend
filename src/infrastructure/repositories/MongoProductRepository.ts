import { Product } from '../../domain/Product';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import { type IProduct, ProductModel } from '../models/ProductModel';

export class MongoProductRepository implements ProductRepository {
  private documentToProduct(doc: IProduct): Product {
    return new Product(
      doc.id,
      doc.storeId ?? null,
      doc.name,
      doc.description,
      doc.price,
      doc.stock,
      doc.category,
      doc.createdAt,
      doc.imageUrl,
      doc.thumbnailUrl,
      doc.longDescription
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

  async findByStoreId(storeId: string): Promise<Product[]> {
    const docs = await ProductModel.find({ storeId }).exec();
    return docs.map((doc) => this.documentToProduct(doc));
  }

  async create(product: Product): Promise<Product> {
    const created = await ProductModel.create({
      id: product.id,
      storeId: product.storeId,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      createdAt: product.createdAt,
      imageUrl: product.imageUrl,
      thumbnailUrl: product.thumbnailUrl,
      longDescription: product.longDescription,
    });
    return this.documentToProduct(created);
  }

  async update(product: Product): Promise<Product> {
    const updated = await ProductModel.findOneAndUpdate(
      { id: product.id },
      {
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        imageUrl: product.imageUrl,
        thumbnailUrl: product.thumbnailUrl,
        longDescription: product.longDescription,
      },
      { new: true }
    ).exec();

    if (!updated) {
      throw new Error(`Product not found: ${product.id}`);
    }

    return this.documentToProduct(updated);
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
