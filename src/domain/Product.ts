export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly stock: number,
    public readonly category: string,
    public readonly createdAt: Date
  ) {}

  hasStock(quantity: number): boolean {
    return this.stock >= quantity;
  }

  reduceStock(quantity: number): void {
    if (!this.hasStock(quantity)) {
      throw new Error(`Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`);
    }
    // Note: In a real scenario, this would be handled by the repository
    // This is just for domain logic validation
  }
}
