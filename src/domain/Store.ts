export class Store {
  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly description?: string,
    public readonly imageUrl?: string,
    public readonly phone?: string,
    public readonly address?: string
  ) {}
}

