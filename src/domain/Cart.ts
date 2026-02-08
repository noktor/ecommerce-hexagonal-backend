export interface CartItem {
  productId: string;
  quantity: number;
  reservedUntil?: Date; // For temporary reservations (Ticketmaster-style)
}

export class Cart {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: CartItem[],
    public readonly updatedAt: Date,
    public readonly expiresAt?: Date // Cart expiration (like Ticketmaster reservations)
  ) {}

  addItem(productId: string, quantity: number): CartItem[] {
    const existingItem = this.items.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productId, quantity });
    }

    return this.items;
  }

  removeItem(productId: string): CartItem[] {
    return this.items.filter((item) => item.productId !== productId);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  getExpiresInSeconds(): number {
    if (!this.expiresAt) {
      return 0;
    }
    const now = new Date();
    const diff = Math.floor((this.expiresAt.getTime() - now.getTime()) / 1000);
    return Math.max(0, diff);
  }
}
