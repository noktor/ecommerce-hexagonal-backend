import { type NextFunction, Request, type Response } from 'express';
import type { CreateOrderUseCase } from '../../application/use-cases/CreateOrderUseCase';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class OrdersController {
  constructor(
    private createOrderUseCase: CreateOrderUseCase,
    private orderRepository: OrderRepository
  ) {}

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { items, shippingAddress, guestEmail, guestName } = req.body;

      if (!items || !shippingAddress) {
        throw new AppError(400, 'Missing required fields: items, shippingAddress');
      }

      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'Items must be a non-empty array');
      }

      // If user is authenticated, use their customerId; otherwise, require guest info
      let customerId: string | null = null;
      if (req.userId) {
        customerId = req.userId;
      } else {
        // Guest order - validate guest info
        if (!guestEmail || !guestName) {
          throw new AppError(400, 'Guest email and name are required for guest orders');
        }
      }

      const order = await this.createOrderUseCase.execute({
        customerId,
        items,
        shippingAddress,
        guestEmail,
        guestName,
      });

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const order = await this.orderRepository.findById(id);

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      // If user is authenticated, verify they own the order (unless it's a guest order)
      if (req.userId && order.customerId && order.customerId !== req.userId) {
        throw new AppError(403, 'Access denied: You do not have permission to view this order');
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
