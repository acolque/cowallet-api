import {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../domain/order';

export class OrderResponse {
  id!: number;
  userId!: number;
  instrumentId!: number;
  size!: number;
  price!: string;
  type!: OrderType;
  side!: OrderSide;
  status!: OrderStatus;
  datetime!: Date;
}

export function toOrderResponse(order: Order): OrderResponse {
  return Object.assign(new OrderResponse(), {
    id: order.id,
    userId: order.userId,
    instrumentId: order.instrumentId,
    size: order.size,
    price: order.price,
    type: order.type,
    side: order.side,
    status: order.status,
    datetime: order.datetime,
  });
}
