import { Order, type OrderItem, type OrderStatus } from '../../domain/Order';
import type { OrderRepository } from '../../domain/repositories/OrderRepository';
import { type IOrder, OrderModel } from '../models/OrderModel';

export class MongoOrderRepository implements OrderRepository {
  private documentToOrder(doc: IOrder): Order {
    return new Order(
      doc.id,
      doc.customerId,
      doc.items as OrderItem[],
      doc.total,
      doc.status as OrderStatus,
      doc.createdAt,
      doc.shippingAddress,
      doc.guestEmail,
      doc.guestName
    );
  }

  async save(order: Order): Promise<void> {
    await OrderModel.findOneAndUpdate(
      { id: order.id },
      {
        id: order.id,
        customerId: order.customerId,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        guestEmail: order.guestEmail,
        guestName: order.guestName,
      },
      { upsert: true, new: true }
    ).exec();
  }

  async findById(id: string): Promise<Order | null> {
    const doc = await OrderModel.findOne({ id }).exec();
    return doc ? this.documentToOrder(doc) : null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const docs = await OrderModel.find({ customerId }).exec();
    return docs.map((doc) => this.documentToOrder(doc));
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const result = await OrderModel.updateOne({ id: orderId }, { $set: { status } }).exec();

    if (result.matchedCount === 0) {
      throw new Error(`Order not found: ${orderId}`);
    }
  }
}
