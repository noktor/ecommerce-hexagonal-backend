export interface CartItem {
  productId: string;
  quantity: number;
  reservedUntil?: Date; // For temporary reservations (Ticketmaster-style)
}

export enum CartStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ABANDONED = 'ABANDONED',
  EXPIRED = 'EXPIRED',
}

export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly items: CartItem[],
    public readonly updatedAt: Date,
    /**
     * Legacy expiration field (no longer used for TTL-based deletion).
     * Kept for backwards compatibility; will be phased out in favor of status/lastActivityAt.
     */
    public readonly expiresAt?: Date,
    /**
     * Persisted cart status. Derived primarily from lastActivityAt but stored for querying.
     */
    public readonly status: CartStatus = CartStatus.ACTIVE,
    /**
     * Last time the user interacted with the cart (add/remove/clear).
     */
    public readonly lastActivityAt: Date = updatedAt
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

  /**
   * Legacy helper kept for backwards compatibility.
   * New code should rely on CartStatus/deriveStatus instead.
   */
  isExpired(): boolean {
    return this.status === CartStatus.EXPIRED;
  }

  /**
   * Backwards-compatible helper for cache TTL.
   * Currently returns a fixed 15-minute TTL (in seconds) for server-side cache.
   */
  getExpiresInSeconds(): number {
    const FIFTEEN_MINUTES_IN_SECONDS = 15 * 60;
    return FIFTEEN_MINUTES_IN_SECONDS;
  }

  /**
   * Return a new Cart instance reflecting a fresh user interaction.
   * Sets lastActivityAt and updatedAt to now and marks status as ACTIVE.
   */
  touch(now: Date = new Date()): Cart {
    return new Cart(
      this.id,
      this.userId,
      this.items,
      now,
      this.expiresAt,
      CartStatus.ACTIVE,
      now
    );
  }

  /**
   * Return a new Cart with updated items and refreshed activity timestamp.
   */
  withItems(items: CartItem[], now: Date = new Date()): Cart {
    return new Cart(
      this.id,
      this.userId,
      items,
      now,
      this.expiresAt,
      CartStatus.ACTIVE,
      now
    );
  }

  /**
   * Derive the effective status based on lastActivityAt and time thresholds.
   * - ACTIVE:    last activity < 30 minutes ago
   * - INACTIVE:  30 minutes–24 hours
   * - ABANDONED: > 24 hours
   * - EXPIRED:   explicitly marked as expired, takes precedence
   */
  deriveStatus(now: Date = new Date()): CartStatus {
    if (this.status === CartStatus.EXPIRED) {
      return CartStatus.EXPIRED;
    }

    const last = this.lastActivityAt || this.updatedAt || now;
    const diffMs = now.getTime() - last.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 30) {
      return CartStatus.ACTIVE;
    }
    if (diffMinutes < 24 * 60) {
      return CartStatus.INACTIVE;
    }
    return CartStatus.ABANDONED;
  }
}
