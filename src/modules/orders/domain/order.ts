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

export interface OrderDraft {
  userId: number;
  instrumentId: number;
  size: number;
  price: string;
  type: OrderType;
  side: OrderSide;
  datetime: Date;
}

export class InvalidOrderTransitionError extends Error {
  constructor(status: OrderStatus) {
    super(`Cannot cancel an order in status ${status}`);
    this.name = 'InvalidOrderTransitionError';
  }
}

export class Order {
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly instrumentId: number,
    readonly size: number,
    readonly price: string,
    readonly type: OrderType,
    readonly side: OrderSide,
    readonly status: OrderStatus,
    readonly datetime: Date,
  ) {}

  static create(
    input: OrderDraft,
    accepted: boolean,
  ): OrderDraft & { status: OrderStatus } {
    return {
      ...input,
      status: initialStatus(input.type, accepted),
    };
  }

  cancel(): Order {
    if (this.status !== 'NEW') {
      throw new InvalidOrderTransitionError(this.status);
    }

    return new Order(
      this.id,
      this.userId,
      this.instrumentId,
      this.size,
      this.price,
      this.type,
      this.side,
      'CANCELLED',
      this.datetime,
    );
  }
}

function initialStatus(type: OrderType, accepted: boolean): OrderStatus {
  if (!accepted) {
    return 'REJECTED';
  }

  return type === 'MARKET' ? 'FILLED' : 'NEW';
}
