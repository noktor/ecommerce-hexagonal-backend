import type { NextFunction, Response } from 'express';
import type { CreateStoreUseCase } from '../../application/use-cases/CreateStoreUseCase';
import type { ListMyStoresUseCase } from '../../application/use-cases/ListMyStoresUseCase';
import type { UpdateStoreUseCase } from '../../application/use-cases/UpdateStoreUseCase';
import type { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class StoresController {
  constructor(
    private readonly createStoreUseCase: CreateStoreUseCase,
    private readonly updateStoreUseCase: UpdateStoreUseCase,
    private readonly listMyStoresUseCase: ListMyStoresUseCase
  ) {}

  async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const stores = await this.listMyStoresUseCase.execute(req.userId);
      res.json({ success: true, data: stores });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }

      const { name, description, imageUrl, phone, address } = req.body;
      if (!name) {
        throw new AppError(400, 'Store name is required');
      }

      const store = await this.createStoreUseCase.execute({
        ownerId: req.userId,
        name,
        description,
        imageUrl,
        phone,
        address,
      });

      res.status(201).json({ success: true, data: store });
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
      const { name, description, imageUrl, phone, address } = req.body;

      const store = await this.updateStoreUseCase.execute({
        storeId: id,
        ownerId: req.userId,
        name,
        description,
        imageUrl,
        phone,
        address,
      });

      res.json({ success: true, data: store });
    } catch (error) {
      next(error);
    }
  }
}

