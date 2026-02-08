import type { NextFunction, Response } from 'express';
import type { AddToCartUseCase } from '../../application/use-cases/AddToCartUseCase';
import type { RemoveFromCartUseCase } from '../../application/use-cases/RemoveFromCartUseCase';
import type { Cart } from '../../domain/Cart';
import type { CartRepository } from '../../domain/repositories/CartRepository';
import type { CacheService } from '../../domain/services/CacheService';
import type { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export class CartController {
  constructor(
    private addToCartUseCase: AddToCartUseCase,
    private removeFromCartUseCase: RemoveFromCartUseCase,
    private cartRepository: CartRepository,
    private cacheService: CacheService
  ) {}

  async getByCustomerId(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const customerId = req.userId;
      const cacheKey = `cart:${customerId}`;

      // Try to get from cache first
      const cachedCart = await this.cacheService.get<Cart>(cacheKey);
      if (cachedCart) {
        // Reconstruct Date objects if needed (JSON.parse converts dates to strings)
        const cart = {
          ...cachedCart,
          updatedAt: new Date(cachedCart.updatedAt),
          expiresAt: cachedCart.expiresAt ? new Date(cachedCart.expiresAt) : undefined,
        };

        // Check if cart expired
        if (cart.expiresAt && new Date() > cart.expiresAt) {
          // Cart expired, clear it
          await this.cartRepository.clear(customerId);
          await this.cacheService.delete(cacheKey);
          res.json({
            success: true,
            data: {
              id: null,
              customerId,
              items: [],
              updatedAt: new Date(),
            },
          });
          return;
        }

        res.json({
          success: true,
          data: cart,
        });
        return;
      }

      // If not in cache, get from repository
      const cart = await this.cartRepository.findByCustomerId(customerId);

      if (!cart) {
        res.json({
          success: true,
          data: {
            id: null,
            customerId,
            items: [],
            updatedAt: new Date(),
          },
        });
        return;
      }

      // Check if cart expired
      if (cart.isExpired()) {
        await this.cartRepository.clear(customerId);
        res.json({
          success: true,
          data: {
            id: null,
            customerId,
            items: [],
            updatedAt: new Date(),
          },
        });
        return;
      }

      // Cache the cart with TTL matching expiration
      const cacheTTL = cart.getExpiresInSeconds();
      await this.cacheService.set(cacheKey, cart, cacheTTL);

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }

      const { productId, quantity } = req.body;

      if (!productId || !quantity) {
        throw new AppError(400, 'Missing required fields: productId, quantity');
      }

      if (quantity <= 0) {
        throw new AppError(400, 'Quantity must be greater than 0');
      }

      const cart = await this.addToCartUseCase.execute({
        customerId: req.userId,
        productId,
        quantity,
      });

      res.status(201).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      // Handle lock acquisition failures with 429 status
      if (error instanceof Error && error.message.includes('currently being modified')) {
        throw new AppError(429, error.message);
      }
      next(error);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }

      const { productId } = req.body;

      if (!productId) {
        throw new AppError(400, 'Missing required field: productId');
      }

      const cart = await this.removeFromCartUseCase.execute({
        customerId: req.userId,
        productId,
      });

      res.json({
        success: true,
        data: cart,
      });
    } catch (error) {
      // Handle lock acquisition failures with 429 status
      if (error instanceof Error && error.message.includes('currently being modified')) {
        throw new AppError(429, error.message);
      }
      next(error);
    }
  }
}
