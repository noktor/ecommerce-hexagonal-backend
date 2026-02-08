import { Customer } from '../../domain/Customer';
import type { EventPublisher } from '../../domain/events/EventPublisher';
import { Order, type OrderItem, OrderStatus } from '../../domain/Order';
import { Product } from '../../domain/Product';
import type { CartRepository } from '../../domain/repositories/CartRepository';
import type { CustomerRepository } from '../../domain/repositories/CustomerRepository';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { CacheService } from '../../domain/services/CacheService';
import type { EmailService } from '../../domain/services/EmailService';

export interface CreateOrderRequest {
  customerId?: string | null; // Optional for guest orders
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: string;
  guestEmail?: string; // Email for guest orders
  guestName?: string; // Name for guest orders
}

export class CreateOrderUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private customerRepository: CustomerRepository,
    private productRepository: ProductRepository,
    private cartRepository: CartRepository,
    private eventPublisher: EventPublisher,
    private cacheService: CacheService,
    private emailService: EmailService | null
  ) {}

  async execute(request: CreateOrderRequest): Promise<Order> {
    // Validate customer (only if customerId is provided)
    let customerId: string | null = null;
    if (request.customerId) {
      const customer = await this.customerRepository.findById(request.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }
      if (!customer.canPlaceOrder()) {
        throw new Error(`Customer cannot place orders. Status: ${customer.status}`);
      }
      customerId = customer.id;
    } else {
      // Guest order - validate email and name are provided
      if (!request.guestEmail || !request.guestName) {
        throw new Error('Guest email and name are required for guest orders');
      }
      // Use "guest" as customerId for guest orders (standard in e-commerce)
      customerId = null;
    }

    // Validate products and build order items
    const orderItems: OrderItem[] = [];
    let total = 0;

    for (const item of request.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (!product.hasStock(item.quantity)) {
        throw new Error(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}`
        );
      }

      const subtotal = product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });
      total += subtotal;
    }

    // Create order
    const order = new Order(
      this.generateOrderId(),
      customerId,
      orderItems,
      total,
      OrderStatus.PENDING,
      new Date(),
      request.shippingAddress,
      request.guestEmail,
      request.guestName
    );

    // Save order
    await this.orderRepository.save(order);

    // Update stock and invalidate cache for affected products
    const affectedCategories = new Set<string>();
    for (const item of request.items) {
      // Get product to know its category before updating stock
      const product = await this.productRepository.findById(item.productId);
      if (product) {
        affectedCategories.add(product.category);
      }

      // Update stock
      await this.productRepository.updateStock(item.productId, -item.quantity);

      // Invalidate cache for this specific product
      await this.cacheService.delete(`product:${item.productId}`);
    }

    // Invalidate cache for product lists (all products and affected categories)
    await this.cacheService.delete('products:all');
    for (const category of affectedCategories) {
      await this.cacheService.delete(`products:category:${category}`);
    }

    // Clear cart after successful order creation (only for authenticated users)
    if (customerId) {
      await this.cartRepository.clear(customerId);
      const cartCacheKey = `cart:${customerId}`;
      await this.cacheService.delete(cartCacheKey);
    }

    // Send order confirmation email for guest orders
    if (!customerId && order.guestEmail && order.guestName && this.emailService) {
      try {
        await this.emailService.sendOrderConfirmationEmail({
          email: order.guestEmail,
          name: order.guestName,
          orderId: order.id,
          total: order.total,
          items: order.items.map((item) => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
          shippingAddress: order.shippingAddress,
        });
      } catch (error) {
        console.error('⚠️  Error sending order confirmation email (non-critical):', error);
        // Don't throw - email failure shouldn't break order creation
      }
    }

    // Publish event with retry
    await this.eventPublisher.publishWithRetry('order.created', {
      orderId: order.id,
      customerId: order.customerId || 'guest',
      total: order.total,
      items: order.items,
      status: order.status,
      guestEmail: order.guestEmail,
      guestName: order.guestName,
    });

    return order;
  }

  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
