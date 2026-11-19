import { Injectable } from '@nestjs/common';
import {
  compareDecimal,
  floorDivideDecimal,
  multiplyDecimal,
} from '../../../shared/domain/decimal';
import { InstrumentRepository } from '../../instruments/domain/instrument.repository';
import { MarketDataRepository } from '../../instruments/domain/market-data.repository';
import { GetAvailableCashUseCase } from '../../portfolio/application/get-available-cash.use-case';
import { GetAvailableSellSizeUseCase } from '../../portfolio/application/get-available-sell-size.use-case';
import { Order, OrderSide, OrderType } from '../domain/order';
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
const CURRENCY_TYPE = 'MONEDA';
const CASH_PRICE = '1.00';
const MAX_SHARE_QUANTITY = 2_147_483_647;
const POSITIVE_INTEGER = /^[1-9]\d*$/;

export interface SubmitOrderInput {
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  quantity?: number;
  amount?: string;
  price?: string;
}

interface EvaluatedOrder {
  accepted: boolean;
  size: number;
  price: string;
}

@Injectable()
export class SubmitOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly instrumentRepository: InstrumentRepository,
    private readonly getAvailableCash: GetAvailableCashUseCase,
    private readonly getAvailableSellSize: GetAvailableSellSizeUseCase,
    private readonly marketData: MarketDataRepository,
  ) {}

  execute(input: SubmitOrderInput): Promise<Order> {
    return this.orderRepository.executeWithUserLock(input.userId, () =>
      this.submit(input),
    );
  }

  private async submit(input: SubmitOrderInput): Promise<Order> {
    await this.validate(input);

    const { accepted, size, price } = isCashMovement(input.side)
      ? await this.evaluateCashMovement(input)
      : await this.evaluateTradeOrder(input);

    return this.orderRepository.insert(
      Order.create(
        {
          userId: input.userId,
          instrumentId: input.instrumentId,
          size,
          price,
          type: isCashMovement(input.side) ? 'MARKET' : input.type,
          side: input.side,
          datetime: new Date(),
        },
        accepted,
      ),
    );
  }

  private async validate(input: SubmitOrderInput): Promise<void> {
    const userExists = await this.orderRepository.userExists(input.userId);
    if (!userExists) {
      throw new UserNotFoundError();
    }

    const instrument = await this.instrumentRepository.findById(
      input.instrumentId,
    );
    if (instrument === null) {
      throw new InstrumentNotFoundError();
    }

    const expectedType = isCashMovement(input.side) ? CURRENCY_TYPE : STOCK_TYPE;
    if (instrument.type === expectedType) {
      return;
    }

    throw isCashMovement(input.side)
      ? new InstrumentNotTradableError('Instrument is not a currency')
      : new InstrumentNotTradableError();
  }

  private async evaluateCashMovement(
    input: SubmitOrderInput,
  ): Promise<EvaluatedOrder> {
    const size = this.cashSize(input.amount);
    const accepted =
      input.side === 'CASH_IN' ||
      (await this.hasEnoughCash(input.userId, String(size)));

    return { accepted, size, price: CASH_PRICE };
  }

  private async evaluateTradeOrder(
    input: SubmitOrderInput,
  ): Promise<EvaluatedOrder> {
    const price = await this.tradePrice(input);
    const size = this.shareSize(input, price);
    const accepted =
      input.side === 'BUY'
        ? await this.hasEnoughCash(
            input.userId,
            multiplyDecimal(String(size), price),
          )
        : await this.hasEnoughShares(input.userId, input.instrumentId, size);

    return { accepted, size, price };
  }

  private cashSize(amount: string | undefined): number {
    if (
      amount === undefined ||
      !POSITIVE_INTEGER.test(amount) ||
      BigInt(amount) > BigInt(MAX_SHARE_QUANTITY)
    ) {
      throw new InvalidOrderRequestError('Amount is too large');
    }

    return Number(amount);
  }

  private async tradePrice(input: SubmitOrderInput): Promise<string> {
    if (input.type === 'LIMIT') {
      return input.price ?? '';
    }

    const [price] = await this.marketData.getLatestPrices([input.instrumentId]);
    const close = price?.close ?? null;
    if (close === null || compareDecimal(close, '0') <= 0) {
      throw new MarketPriceUnavailableError();
    }

    return close;
  }

  private shareSize(input: SubmitOrderInput, price: string): number {
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

  private async hasEnoughCash(userId: number, required: string): Promise<boolean> {
    const available = await this.getAvailableCash.execute(userId);
    return compareDecimal(required, available) <= 0;
  }

  private async hasEnoughShares(
    userId: number,
    instrumentId: number,
    size: number,
  ): Promise<boolean> {
    const available = await this.getAvailableSellSize.execute(
      userId,
      instrumentId,
    );
    return compareDecimal(String(size), available) <= 0;
  }
}

function isCashMovement(side: OrderSide): boolean {
  return side === 'CASH_IN' || side === 'CASH_OUT';
}
