import { Injectable } from '@nestjs/common';
import { Order } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import {
  InvalidOrderRequestError,
  OrderNotCancellableError,
  OrderNotFoundError,
} from './order.errors';

@Injectable()
export class CancelOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: number, userId: number): Promise<Order> {
    if (!Number.isInteger(orderId) || orderId < 1) {
      throw new InvalidOrderRequestError('Order id must be a positive integer');
    }
    if (!Number.isInteger(userId) || userId < 1) {
      throw new InvalidOrderRequestError('User id must be a positive integer');
    }

    return this.orders.executeWithUserLock(userId, async () => {
      const cancelled = await this.orders.cancelIfNew(orderId, userId);
      if (cancelled) {
        return cancelled;
      }

      const existing = await this.orders.findById(orderId);
      if (existing === null || existing.userId !== userId) {
        throw new OrderNotFoundError();
      }

      throw new OrderNotCancellableError();
    });
  }
}
