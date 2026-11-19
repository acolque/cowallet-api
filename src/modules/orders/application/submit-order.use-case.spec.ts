import { InstrumentRepository } from '../../instruments/domain/instrument.repository';
import { MarketDataRepository } from '../../instruments/domain/market-data.repository';
import { GetAvailableCashUseCase } from '../../portfolio/application/get-available-cash.use-case';
import { GetAvailableSellSizeUseCase } from '../../portfolio/application/get-available-sell-size.use-case';
import { Order } from '../domain/order';
import { NewOrder, OrderRepository } from '../domain/order.repository';
import {
  AmountBelowOneShareError,
  InstrumentNotFoundError,
  InstrumentNotTradableError,
  MarketPriceUnavailableError,
  UserNotFoundError,
} from './order.errors';
import { SubmitOrderInput, SubmitOrderUseCase } from './submit-order.use-case';

describe('SubmitOrderUseCase', () => {
  const orders = {
    userExists: jest.fn(),
    insert: jest.fn(),
    findById: jest.fn(),
    cancelIfNew: jest.fn(),
    executeWithUserLock: jest.fn(),
  };
  const instruments = {
    search: jest.fn(),
    findById: jest.fn(),
  };
  const availableCash = { execute: jest.fn() };
  const availableSellSize = { execute: jest.fn() };
  const marketData = { getLatestPrices: jest.fn() };
  const useCase = new SubmitOrderUseCase(
    orders as unknown as OrderRepository,
    instruments as unknown as InstrumentRepository,
    availableCash as unknown as GetAvailableCashUseCase,
    availableSellSize as unknown as GetAvailableSellSizeUseCase,
    marketData as unknown as MarketDataRepository,
  );

  const stock = {
    id: 34,
    ticker: 'GGAL',
    name: 'Grupo Financiero Galicia',
    type: 'ACCIONES',
  };
  const currency = {
    id: 1,
    ticker: 'ARS',
    name: 'Peso Argentino',
    type: 'MONEDA',
  };

  beforeEach(() => {
    orders.userExists.mockReset();
    orders.insert.mockReset();
    orders.findById.mockReset();
    orders.cancelIfNew.mockReset();
    orders.executeWithUserLock.mockReset();
    instruments.findById.mockReset();
    availableCash.execute.mockReset();
    availableSellSize.execute.mockReset();
    marketData.getLatestPrices.mockReset();

    orders.userExists.mockResolvedValue(true);
    orders.executeWithUserLock.mockImplementation(
      (_userId: number, action: () => Promise<unknown>) => action(),
    );
    orders.insert.mockImplementation(async (draft: NewOrder) => persisted(draft));
    instruments.findById.mockResolvedValue(stock);
    availableCash.execute.mockResolvedValue('1000000');
    availableSellSize.execute.mockResolvedValue('40');
    marketData.getLatestPrices.mockResolvedValue([
      { instrumentId: 34, close: '930.00', previousClose: null },
    ]);
  });

  it('fills a market buy at the latest close when cash covers the notional', async () => {
    const result = await useCase.execute(buy({ type: 'MARKET', quantity: 2 }));

    expect(marketData.getLatestPrices).toHaveBeenCalledWith([34]);
    expect(availableCash.execute).toHaveBeenCalledWith(7);
    expect(availableSellSize.execute).not.toHaveBeenCalled();
    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        instrumentId: 34,
        size: 2,
        price: '930.00',
        type: 'MARKET',
        side: 'BUY',
        status: 'FILLED',
      }),
    );
    expect(orders.executeWithUserLock).toHaveBeenCalledWith(
      7,
      expect.any(Function),
    );
    expect(result.status).toBe('FILLED');
    expect(result.price).toBe('930.00');
  });

  it('reads cash and inserts while the user lock is held', async () => {
    const steps: string[] = [];
    orders.executeWithUserLock.mockImplementation(
      async (userId: number, action: () => Promise<unknown>) => {
        steps.push(`lock:${userId}`);
        const result = await action();
        steps.push('unlock');
        return result;
      },
    );
    availableCash.execute.mockImplementation(async () => {
      steps.push('cash');
      return '1000000';
    });
    orders.insert.mockImplementation(async (draft: NewOrder) => {
      steps.push('insert');
      return persisted(draft);
    });

    await useCase.execute(buy({ type: 'MARKET', quantity: 2 }));

    expect(steps).toEqual(['lock:7', 'cash', 'insert', 'unlock']);
  });

  it('persists a market buy as REJECTED when available cash is short', async () => {
    availableCash.execute.mockResolvedValue('1000');

    const result = await useCase.execute(buy({ type: 'MARKET', quantity: 5 }));

    expect(result.status).toBe('REJECTED');
    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 5,
        price: '930.00',
        status: 'REJECTED',
      }),
    );
  });

  it('persists a limit buy as REJECTED without leaving it NEW when cash is short', async () => {
    availableCash.execute.mockResolvedValue('1000');

    const result = await useCase.execute(
      buy({ type: 'LIMIT', quantity: 5, price: '930.00' }),
    );

    expect(result.status).toBe('REJECTED');
    expect(marketData.getLatestPrices).not.toHaveBeenCalled();
    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'REJECTED', price: '930.00' }),
    );
  });

  it('leaves a funded limit buy NEW at the requested price', async () => {
    const result = await useCase.execute(
      buy({ type: 'LIMIT', quantity: 2, price: '710.50' }),
    );

    expect(result).toEqual(
      expect.objectContaining({ status: 'NEW', price: '710.50', size: 2 }),
    );
  });

  it('converts a peso amount into the whole shares that fit in that amount', async () => {
    const result = await useCase.execute(
      buy({ type: 'LIMIT', amount: '100', price: '10.50' }),
    );

    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({ size: 9, price: '10.50', status: 'NEW' }),
    );
    expect(result.size).toBe(9);
  });

  it('does not persist an amount that does not cover one share', async () => {
    await expect(
      useCase.execute(buy({ type: 'LIMIT', amount: '20', price: '100' })),
    ).rejects.toBeInstanceOf(AmountBelowOneShareError);

    expect(orders.insert).not.toHaveBeenCalled();
  });

  it('accepts a limit sell of 30 when 40 shares are available', async () => {
    const result = await useCase.execute(
      sell({ type: 'LIMIT', quantity: 30, price: '950.00' }),
    );

    expect(availableSellSize.execute).toHaveBeenCalledWith(7, 34);
    expect(availableCash.execute).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ status: 'NEW', size: 30, side: 'SELL' }),
    );
  });

  it('rejects a second limit sell of 20 when only 10 shares remain available', async () => {
    availableSellSize.execute.mockResolvedValue('10');

    const result = await useCase.execute(
      sell({ type: 'LIMIT', quantity: 20, price: '960.00' }),
    );

    expect(result.status).toBe('REJECTED');
    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({ size: 20, status: 'REJECTED' }),
    );
  });

  it('accepts a later sell of 20 once the reserved shares are available again', async () => {
    availableSellSize.execute.mockResolvedValue('40');

    const result = await useCase.execute(
      sell({ type: 'LIMIT', quantity: 20, price: '960.00' }),
    );

    expect(result.status).toBe('NEW');
  });

  it('rejects a market sell that exceeds shares reserved by an open limit sell', async () => {
    availableSellSize.execute.mockResolvedValue('10');

    const result = await useCase.execute(sell({ type: 'MARKET', quantity: 20 }));

    expect(result).toEqual(
      expect.objectContaining({ status: 'REJECTED', price: '930.00', size: 20 }),
    );
  });

  it('fills a market sell at the latest close when the shares are available', async () => {
    const result = await useCase.execute(sell({ type: 'MARKET', quantity: 10 }));

    expect(result).toEqual(
      expect.objectContaining({ status: 'FILLED', price: '930.00', size: 10 }),
    );
  });

  it('does not persist an order for an unknown user or instrument', async () => {
    orders.userExists.mockResolvedValue(false);
    await expect(useCase.execute(buy({ type: 'MARKET', quantity: 1 }))).rejects.toBeInstanceOf(
      UserNotFoundError,
    );

    orders.userExists.mockResolvedValue(true);
    instruments.findById.mockResolvedValue(null);
    await expect(useCase.execute(buy({ type: 'MARKET', quantity: 1 }))).rejects.toBeInstanceOf(
      InstrumentNotFoundError,
    );

    instruments.findById.mockResolvedValue({ ...stock, type: 'MONEDA' });
    await expect(useCase.execute(buy({ type: 'MARKET', quantity: 1 }))).rejects.toBeInstanceOf(
      InstrumentNotTradableError,
    );

    expect(orders.insert).not.toHaveBeenCalled();
  });

  it('does not persist a market order when the latest close is missing or not positive', async () => {
    marketData.getLatestPrices.mockResolvedValue([]);
    await expect(useCase.execute(buy({ type: 'MARKET', quantity: 1 }))).rejects.toBeInstanceOf(
      MarketPriceUnavailableError,
    );

    marketData.getLatestPrices.mockResolvedValue([
      { instrumentId: 34, close: '0.00', previousClose: null },
    ]);
    await expect(useCase.execute(buy({ type: 'MARKET', quantity: 1 }))).rejects.toBeInstanceOf(
      MarketPriceUnavailableError,
    );

    expect(orders.insert).not.toHaveBeenCalled();
  });

  it('fills an incoming transfer for the peso amount at price 1', async () => {
    instruments.findById.mockResolvedValue(currency);

    const result = await useCase.execute(
      transfer({ side: 'CASH_IN', amount: '25000' }),
    );

    expect(marketData.getLatestPrices).not.toHaveBeenCalled();
    expect(availableCash.execute).not.toHaveBeenCalled();
    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 25000,
        price: '1.00',
        type: 'MARKET',
        side: 'CASH_IN',
        status: 'FILLED',
      }),
    );
    expect(result.status).toBe('FILLED');
  });

  it('fills an outgoing transfer when available cash covers the amount', async () => {
    instruments.findById.mockResolvedValue(currency);
    availableCash.execute.mockResolvedValue('30000.00');

    const result = await useCase.execute(
      transfer({ side: 'CASH_OUT', amount: '25000' }),
    );

    expect(availableCash.execute).toHaveBeenCalledWith(7);
    expect(result).toEqual(
      expect.objectContaining({ status: 'FILLED', size: 25000, side: 'CASH_OUT' }),
    );
  });

  it('rejects an outgoing transfer that would spend reserved cash', async () => {
    instruments.findById.mockResolvedValue(currency);
    availableCash.execute.mockResolvedValue('10000');

    const result = await useCase.execute(
      transfer({ side: 'CASH_OUT', amount: '25000' }),
    );

    expect(result.status).toBe('REJECTED');
    expect(orders.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'REJECTED', size: 25000 }),
    );
  });

  it('does not persist a transfer on a stock or a buy on a currency', async () => {
    await expect(
      useCase.execute(transfer({ side: 'CASH_IN', amount: '1000' })),
    ).rejects.toBeInstanceOf(InstrumentNotTradableError);

    instruments.findById.mockResolvedValue(currency);
    await expect(
      useCase.execute(buy({ type: 'MARKET', quantity: 1 })),
    ).rejects.toBeInstanceOf(InstrumentNotTradableError);

    expect(orders.insert).not.toHaveBeenCalled();
  });
});

function buy(overrides: Partial<SubmitOrderInput>): SubmitOrderInput {
  return {
    userId: 7,
    instrumentId: 34,
    side: 'BUY',
    type: 'MARKET',
    ...overrides,
  };
}

function transfer(overrides: Partial<SubmitOrderInput>): SubmitOrderInput {
  return {
    userId: 7,
    instrumentId: 1,
    side: 'CASH_IN',
    type: 'MARKET',
    ...overrides,
  };
}

function sell(overrides: Partial<SubmitOrderInput>): SubmitOrderInput {
  return {
    userId: 7,
    instrumentId: 34,
    side: 'SELL',
    type: 'LIMIT',
    ...overrides,
  };
}

function persisted(draft: NewOrder): Order {
  return new Order(
    11,
    draft.userId,
    draft.instrumentId,
    draft.size,
    draft.price,
    draft.type,
    draft.side,
    draft.status,
    draft.datetime,
  );
}
