import type { NextFunction, Response } from 'express';
import type { CreateStoreProductUseCase } from '../../application/use-cases/CreateStoreProductUseCase';
import type { ListStoreProductsUseCase } from '../../application/use-cases/ListStoreProductsUseCase';
import type { UpdateStoreProductUseCase } from '../../application/use-cases/UpdateStoreProductUseCase';
import type { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class RetailerProductsController {
  constructor(
    private readonly listStoreProductsUseCase: ListStoreProductsUseCase,
    private readonly createStoreProductUseCase: CreateStoreProductUseCase,
    private readonly updateStoreProductUseCase: UpdateStoreProductUseCase
  ) {}

  async listForStore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const { storeId } = req.params;
      const products = await this.listStoreProductsUseCase.execute({
        storeId,
        ownerId: req.userId,
      });
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const { storeId } = req.params;
      const { name, description, price, stock, category, imageUrl, thumbnailUrl, longDescription } =
        req.body;

      if (!name || !description || price == null || stock == null || !category) {
        throw new AppError(
          400,
          'Missing required fields: name, description, price, stock, category'
        );
      }

      const product = await this.createStoreProductUseCase.execute({
        storeId,
        ownerId: req.userId,
        name,
        description,
        price,
        stock,
        category,
        imageUrl,
        thumbnailUrl,
        longDescription,
      });

      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const { id } = req.params;
      const { name, description, price, stock, category, imageUrl, thumbnailUrl, longDescription } =
        req.body;

      const product = await this.updateStoreProductUseCase.execute({
        productId: id,
        ownerId: req.userId,
        name,
        description,
        price,
        stock,
        category,
        imageUrl,
        thumbnailUrl,
        longDescription,
      });

      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
}

