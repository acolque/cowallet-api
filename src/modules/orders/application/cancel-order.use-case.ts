import { Injectable } from '@nestjs/common';
import { InvalidOrderTransitionError, Order } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import { OrderNotCancellableError, OrderNotFoundError } from './order.errors';

@Injectable()
export class CancelOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  execute(orderId: number, userId: number): Promise<Order> {
    return this.orders.executeWithUserLock(userId, async () => {
      const existing = await this.orders.findById(orderId);
      if (existing === null || existing.userId !== userId) {
        throw new OrderNotFoundError();
      }

      let cancelled: Order;
      try {
        cancelled = existing.cancel();
      } catch (error) {
        if (error instanceof InvalidOrderTransitionError) {
          throw new OrderNotCancellableError();
        }
        throw error;
      }

      return this.orders.update(cancelled);
    });
  }
}
