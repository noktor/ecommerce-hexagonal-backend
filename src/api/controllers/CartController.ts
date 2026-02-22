import type { NextFunction, Response } from 'express';
import type { AddToCartUseCase } from '../../application/use-cases/AddToCartUseCase';
import type { RemoveFromCartUseCase } from '../../application/use-cases/RemoveFromCartUseCase';
import { Cart, CartStatus } from '../../domain/Cart';
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

  private buildCartResponse(cart: Cart | null, userId: string): {
    id: string | null;
    userId: string;
    items: Cart['items'];
    updatedAt: Date;
    status: CartStatus;
    lastActivityAt: Date;
  } {
    const now = new Date();

    if (!cart) {
      return {
        id: null,
        userId,
        items: [],
        updatedAt: now,
        status: CartStatus.ACTIVE,
        lastActivityAt: now,
      };
    }

    const effectiveStatus = cart.deriveStatus(now);

    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      updatedAt: cart.updatedAt,
      status: effectiveStatus,
      lastActivityAt: cart.lastActivityAt,
    };
  }

  async getByUserId(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.userId) {
        throw new AppError(401, 'Authentication required');
      }
      const userId = req.userId;
      const cacheKey = `cart:${userId}`;

      const cachedCart = await this.cacheService.get<Cart & { status?: CartStatus; lastActivityAt?: Date }>(
        cacheKey
      );
      if (cachedCart) {
        const hydrated = new Cart(
          cachedCart.id,
          cachedCart.userId,
          cachedCart.items,
          new Date(cachedCart.updatedAt),
          undefined,
          (cachedCart.status as CartStatus) ?? CartStatus.ACTIVE,
          cachedCart.lastActivityAt ? new Date(cachedCart.lastActivityAt) : new Date(cachedCart.updatedAt)
        );

        const data = this.buildCartResponse(hydrated, userId);
        res.json({
          success: true,
          data,
        });
        return;
      }

      const cart = await this.cartRepository.findByUserId(userId);

      if (cart) {
        const cacheTTL = cart.getExpiresInSeconds();
        await this.cacheService.set(cacheKey, cart, cacheTTL);
      }

      const data = this.buildCartResponse(cart, userId);
      res.json({
        success: true,
        data,
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
        userId: req.userId,
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
        userId: req.userId,
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
