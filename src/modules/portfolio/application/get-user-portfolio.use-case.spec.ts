import { PinoLogger } from 'nestjs-pino';
import { InstrumentRepository } from '../../instruments/domain/instrument.repository';
import { MarketDataRepository } from '../../instruments/domain/market-data.repository';
import { OrderReadRepository } from '../../orders/domain/order-read.repository';
import { GetUserPortfolioUseCase } from './get-user-portfolio.use-case';

describe('GetUserPortfolioUseCase', () => {
  const orderRead = {
    sumFilledCashEffect: jest.fn(),
    sumOpenLimitBuyNotional: jest.fn(),
    sumOpenLimitSellSize: jest.fn(),
    netFilledSizeByInstrument: jest.fn(),
  };
  const marketData = { getLatestPrices: jest.fn() };
  const instruments = {
    search: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
  };
  const logger = { error: jest.fn() };
  const useCase = new GetUserPortfolioUseCase(
    orderRead as unknown as OrderReadRepository,
    marketData as unknown as MarketDataRepository,
    instruments as unknown as InstrumentRepository,
    logger as unknown as PinoLogger,
  );

  beforeEach(() => {
    orderRead.sumFilledCashEffect.mockReset();
    orderRead.sumOpenLimitBuyNotional.mockReset();
    orderRead.sumOpenLimitSellSize.mockReset();
    orderRead.netFilledSizeByInstrument.mockReset();
    marketData.getLatestPrices.mockReset();
    instruments.findByIds.mockReset();
    logger.error.mockReset();

    orderRead.sumFilledCashEffect.mockResolvedValue('1500.00');
    orderRead.sumOpenLimitBuyNotional.mockResolvedValue('0');
  });

  it('omits instruments whose net size is zero', async () => {
    orderRead.netFilledSizeByInstrument.mockResolvedValue([
      { instrumentId: 34, netSize: '0' },
      { instrumentId: 35, netSize: '10' },
    ]);
    marketData.getLatestPrices.mockResolvedValue([
      { instrumentId: 35, close: '100.00', previousClose: '80.00' },
    ]);
    instruments.findByIds.mockResolvedValue([
      {
        id: 35,
        ticker: 'YPFD',
        name: 'YPF',
        type: 'ACCIONES',
      },
    ]);

    const result = await useCase.execute(7);

    expect(result.assets).toEqual([
      {
        instrumentId: 35,
        ticker: 'YPFD',
        name: 'YPF',
        netSize: '10',
        positionValueArs: '1000.00',
        dailyReturnPercentage: '25.00',
      },
    ]);
    expect(marketData.getLatestPrices).toHaveBeenCalledWith([35]);
    expect(instruments.findByIds).toHaveBeenCalledWith([35]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('discards a negative net size and logs the position', async () => {
    orderRead.netFilledSizeByInstrument.mockResolvedValue([
      { instrumentId: 34, netSize: '-5' },
      { instrumentId: 35, netSize: '10' },
    ]);
    marketData.getLatestPrices.mockResolvedValue([
      { instrumentId: 35, close: '100.00', previousClose: '80.00' },
    ]);
    instruments.findByIds.mockResolvedValue([
      {
        id: 35,
        ticker: 'YPFD',
        name: 'YPF',
        type: 'ACCIONES',
      },
    ]);

    const result = await useCase.execute(7);

    expect(result.assets.map((asset) => asset.instrumentId)).toEqual([35]);
    expect(marketData.getLatestPrices).toHaveBeenCalledWith([35]);
    expect(instruments.findByIds).toHaveBeenCalledWith([35]);
    expect(logger.error).toHaveBeenCalledWith(
      {
        userId: 7,
        instrumentId: 34,
        netSize: '-5',
      },
      'Negative net instrument position ignored',
    );
  });
});
