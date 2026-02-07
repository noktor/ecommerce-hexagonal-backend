import { Response, NextFunction, Request } from 'express';
import { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import { OrderRepository } from '../../domain/repositories/OrderRepository';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class OrdersController {
  constructor(
    private createOrderUseCase: CreateOrderUseCase,
    private orderRepository: OrderRepository
  ) {}

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }

      const { items, shippingAddress } = req.body;

      if (!items || !shippingAddress) {
        throw new AppError(400, 'Missing required fields: items, shippingAddress');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'Items must be a non-empty array');
      }

      const order = await this.createOrderUseCase.execute({
        customerId: req.userId,
        items,
        shippingAddress
      });

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const { id } = req.params;

      const order = await this.orderRepository.findById(id);

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

