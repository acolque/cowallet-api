export const ORDER_TYPES = ['MARKET', 'LIMIT'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_SIDES = ['CASH_IN', 'CASH_OUT', 'BUY', 'SELL'] as const;
export type OrderSide = (typeof ORDER_SIDES)[number];

export const ORDER_STATUSES = [
  'FILLED',
  'CANCELLED',
  'NEW',
  'REJECTED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class Order {
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly instrumentId: number,
    readonly size: string,
    readonly price: string,
    readonly type: OrderType,
    readonly side: OrderSide,
    readonly status: OrderStatus,
    readonly datetime: Date,
  ) {}
}
