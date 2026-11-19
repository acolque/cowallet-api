import { Injectable } from '@nestjs/common';
import {
  compareDecimal,
  floorDivideDecimal,
  multiplyDecimal,
} from '../../../shared/domain/decimal';
import { InstrumentRepository } from '../../instruments/domain/instrument.repository';
import { GetAvailableCashUseCase } from '../../portfolio/application/get-available-cash.use-case';
import { GetAvailableSellSizeUseCase } from '../../portfolio/application/get-available-sell-size.use-case';
import { GetLatestCloseUseCase } from '../../portfolio/application/get-latest-close.use-case';
import { Order, OrderStatus, OrderType } from '../domain/order';
import { OrderRepository } from '../domain/order.repository';
import {
  AmountBelowOneShareError,
  InstrumentNotFoundError,
  InstrumentNotTradableError,
  InvalidOrderRequestError,
  MarketPriceUnavailableError,
  UserNotFoundError,
} from './order.errors';

const STOCK_TYPE = 'ACCIONES';
const MAX_SHARE_QUANTITY = 2_147_483_647;
const POSITIVE_INTEGER = /^[1-9]\d*$/;

export interface SubmitOrderInput {
  userId: number;
  instrumentId: number;
  side: 'BUY' | 'SELL';
  type: OrderType;
  quantity?: number;
  amount?: string;
  price?: string;
}

@Injectable()
export class SubmitOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly instruments: InstrumentRepository,
    private readonly availableCash: GetAvailableCashUseCase,
    private readonly availableSellSize: GetAvailableSellSizeUseCase,
    private readonly latestClose: GetLatestCloseUseCase,
  ) {}

  execute(input: SubmitOrderInput): Promise<Order> {
    return this.orders.executeWithUserLock(input.userId, () =>
      this.submit(input),
    );
  }

  private async submit(input: SubmitOrderInput): Promise<Order> {
    const userExists = await this.orders.userExists(input.userId);
    if (!userExists) {
      throw new UserNotFoundError();
    }

    const instrument = await this.instruments.findById(input.instrumentId);
    if (instrument === null) {
      throw new InstrumentNotFoundError();
    }
    if (instrument.type !== STOCK_TYPE) {
      throw new InstrumentNotTradableError();
    }

    const price = await this.priceFor(input);
    const size = this.shareQuantity(input, price);
    const status = await this.statusFor(input, size, price);

    return this.orders.insert({
      userId: input.userId,
      instrumentId: input.instrumentId,
      size,
      price,
      type: input.type,
      side: input.side,
      status,
      datetime: new Date(),
    });
  }

  private async priceFor(input: SubmitOrderInput): Promise<string> {
    if (input.type === 'LIMIT') {
      return input.price ?? '';
    }

    const close = await this.latestClose.execute(input.instrumentId);
    if (close === null || compareDecimal(close, '0') <= 0) {
      throw new MarketPriceUnavailableError();
    }

    return close;
  }

  private shareQuantity(input: SubmitOrderInput, price: string): number {
    if (input.quantity !== undefined) {
      return input.quantity;
    }

    const shares = floorDivideDecimal(input.amount ?? '0', price);
    if (!POSITIVE_INTEGER.test(shares)) {
      throw new AmountBelowOneShareError();
    }
    if (BigInt(shares) > BigInt(MAX_SHARE_QUANTITY)) {
      throw new InvalidOrderRequestError('Quantity is too large');
    }

    return Number(shares);
  }

  private async statusFor(
    input: SubmitOrderInput,
    size: number,
    price: string,
  ): Promise<OrderStatus> {
    const accepted =
      input.side === 'BUY'
        ? await this.canBuy(input.userId, size, price)
        : await this.canSell(input.userId, input.instrumentId, size);

    if (!accepted) {
      return 'REJECTED';
    }

    return input.type === 'MARKET' ? 'FILLED' : 'NEW';
  }

  private async canBuy(
    userId: number,
    size: number,
    price: string,
  ): Promise<boolean> {
    const available = await this.availableCash.execute(userId);
    const notional = multiplyDecimal(String(size), price);
    return compareDecimal(notional, available) <= 0;
  }

  private async canSell(
    userId: number,
    instrumentId: number,
    size: number,
  ): Promise<boolean> {
    const available = await this.availableSellSize.execute(userId, instrumentId);
    return compareDecimal(String(size), available) <= 0;
  }
}
