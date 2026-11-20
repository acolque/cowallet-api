import { Order, OrderSide, OrderStatus, OrderType } from './order';

export interface NewOrder {
  userId: number;
  instrumentId: number;
  size: number;
  price: string;
  type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  datetime: Date;
}

export abstract class OrderRepository {
  abstract userExists(userId: number): Promise<boolean>;
  abstract insert(order: NewOrder): Promise<Order>;
  abstract findById(orderId: number): Promise<Order | null>;
  abstract update(order: Order): Promise<Order>;
  abstract executeWithUserLock<T>(
    userId: number,
    action: () => Promise<T>,
  ): Promise<T>;
}
