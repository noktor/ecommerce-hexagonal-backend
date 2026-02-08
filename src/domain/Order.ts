export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export class Order {
  constructor(
    public readonly id: string,
    public readonly customerId: string | null, // Allow null for guest orders
    public readonly items: OrderItem[],
    public readonly total: number,
    public readonly status: OrderStatus,
    public readonly createdAt: Date,
    public readonly shippingAddress: string,
    public readonly guestEmail?: string, // Email for guest orders
    public readonly guestName?: string // Name for guest orders
  ) {}

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  canBeCancelled(): boolean {
    return this.status === OrderStatus.PENDING || this.status === OrderStatus.CONFIRMED;
  }
}

